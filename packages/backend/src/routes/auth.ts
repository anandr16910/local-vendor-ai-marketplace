import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getPostgresPool, getRedisClient } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { sendVerificationSMS, sendMFASMS } from '../utils/sms';
import { sendMFAEmail, sendPasswordResetEmail } from '../utils/email';
import { validateUserRegistration, validateUserLogin } from '@local-vendor-ai/shared';

const router = express.Router();

// Register endpoint
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phoneNumber').isMobilePhone('en-IN').withMessage('Please provide a valid Indian phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  body('userType').isIn(['vendor', 'buyer', 'intermediary']).withMessage('Invalid user type'),
  body('preferredLanguage').optional().isLength({ min: 2, max: 10 }).withMessage('Invalid language code'),
  body('acceptTerms').equals('true').withMessage('You must accept the terms and conditions'),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { 
    name, 
    phoneNumber, 
    email, 
    password, 
    userType, 
    preferredLanguage = 'en',
    location,
    acceptTerms 
  } = req.body;

  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT user_id FROM users WHERE phone_number = $1 OR ($2::text IS NOT NULL AND email = $2)',
    [phoneNumber, email || null]
  );

  if (existingUser.rows.length > 0) {
    throw createError('User already exists with this phone number or email', 409);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Default preferences and security settings
  const defaultPreferences = {
    languages: [preferredLanguage],
    culturalSettings: [],
    notificationSettings: {
      email: true,
      sms: true,
      push: true,
      negotiationUpdates: true,
      priceAlerts: true,
      marketInsights: true
    },
    privacySettings: {
      profileVisibility: 'public',
      locationSharing: 'city_only',
      transactionHistory: 'private',
      contactInfo: 'verified_only'
    }
  };

  const defaultSecuritySettings = {
    mfaEnabled: false,
    mfaMethod: 'sms',
    sessionTimeout: 1800, // 30 minutes
    loginNotifications: true
  };

  // Create user
  const result = await pool.query(
    `INSERT INTO users (
      name, phone_number, email, password_hash, user_type, preferred_language,
      location, preferences, security_settings, is_verified
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING user_id, name, phone_number, email, user_type, preferred_language, 
               location, preferences, security_settings, created_at, is_verified`,
    [
      name, 
      phoneNumber, 
      email || null, 
      passwordHash, 
      userType, 
      preferredLanguage,
      location ? JSON.stringify(location) : null,
      JSON.stringify(defaultPreferences),
      JSON.stringify(defaultSecuritySettings),
      false // Email/phone verification required
    ]
  );

  const user = result.rows[0];

  // Generate phone verification code
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const codeKey = `phone_verification:${phoneNumber}`;
  
  // Store verification code in Redis (expires in 10 minutes)
  await redis.setEx(codeKey, 600, verificationCode);

  // TODO: Send SMS verification code using Twilio or similar service
  await sendVerificationSMS(phoneNumber, verificationCode);
  logger.info('Phone verification code generated', { 
    userId: user.user_id, 
    phoneNumber: phoneNumber.replace(/(\d{2})(\d{5})(\d{5})/, '$1*****$3') // Mask phone number in logs
  });

  // Generate JWT token (but mark as unverified)
  const token = jwt.sign(
    { 
      userId: user.user_id, 
      userType: user.user_type,
      isVerified: false 
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info('User registered successfully', { 
    userId: user.user_id, 
    userType: user.user_type,
    hasEmail: !!email,
    hasLocation: !!location
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your phone number to complete registration.',
    user: {
      userId: user.user_id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      userType: user.user_type,
      preferredLanguage: user.preferred_language,
      location: user.location,
      preferences: user.preferences,
      securitySettings: user.security_settings,
      isVerified: user.is_verified,
      createdAt: user.created_at,
    },
    token,
    requiresVerification: true,
    verificationMethod: 'sms'
  });
}));

// Login endpoint
router.post('/login', [
  body('phoneNumber').isMobilePhone('en-IN').withMessage('Please provide a valid Indian phone number'),
  body('password').notEmpty().withMessage('Password is required'),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { phoneNumber, password, rememberMe = false } = req.body;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Find user
  const result = await pool.query(
    `SELECT user_id, name, phone_number, email, user_type, preferred_language, 
            password_hash, security_settings, is_verified, location, preferences
     FROM users WHERE phone_number = $1`,
    [phoneNumber]
  );

  if (result.rows.length === 0) {
    throw createError('Invalid credentials', 401);
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  // Check if MFA is enabled
  const securitySettings = user.security_settings || {};
  const requiresMFA = securitySettings.mfaEnabled && user.is_verified;

  if (requiresMFA) {
    // Generate temporary token for MFA verification
    const tempToken = jwt.sign(
      { 
        userId: user.user_id, 
        userType: user.user_type,
        mfaPending: true 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '10m' }
    );

    // Generate and send MFA code
    const mfaCode = crypto.randomInt(100000, 999999).toString();
    const mfaKey = `mfa_login:${user.user_id}`;
    
    await redis.setEx(mfaKey, 300, mfaCode); // 5 minutes expiry

    // TODO: Send MFA code based on user's preferred method
    if (securitySettings.mfaMethod === 'sms') {
      await sendMFASMS(user.phone_number, mfaCode);
      logger.info('MFA SMS code sent', { userId: user.user_id });
    } else if (securitySettings.mfaMethod === 'email' && user.email) {
      await sendMFAEmail(user.email, mfaCode);
      logger.info('MFA email code sent', { userId: user.user_id });
    }

    return res.json({
      success: true,
      message: 'MFA verification required',
      requiresMFA: true,
      mfaMethod: securitySettings.mfaMethod,
      tempToken
    });
  }

  // Update last active
  await pool.query('UPDATE users SET last_active = NOW() WHERE user_id = $1', [user.user_id]);

  // Generate JWT token
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
  const token = jwt.sign(
    { 
      userId: user.user_id, 
      userType: user.user_type,
      isVerified: user.is_verified 
    },
    process.env.JWT_SECRET!,
    { expiresIn }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { userId: user.user_id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  // Store refresh token in Redis
  await redis.setEx(`refresh_token:${user.user_id}`, 30 * 24 * 60 * 60, refreshToken);

  logger.info('User logged in successfully', { 
    userId: user.user_id, 
    userType: user.user_type,
    isVerified: user.is_verified,
    rememberMe 
  });

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      userId: user.user_id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      userType: user.user_type,
      preferredLanguage: user.preferred_language,
      location: user.location,
      preferences: user.preferences,
      isVerified: user.is_verified
    },
    token,
    refreshToken
  });
}));

// MFA verification endpoint
router.post('/mfa/verify', [
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  body('tempToken').notEmpty(),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { code, tempToken } = req.body;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Verify temporary token
  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as any;
    if (!decoded.mfaPending) {
      throw new Error('Invalid token');
    }
  } catch (error) {
    throw createError('Invalid or expired token', 401);
  }

  // Verify MFA code
  const mfaKey = `mfa_login:${decoded.userId}`;
  const storedCode = await redis.get(mfaKey);

  if (!storedCode || storedCode !== code) {
    throw createError('Invalid or expired MFA code', 400);
  }

  // Get user details
  const result = await pool.query(
    `SELECT user_id, name, phone_number, email, user_type, preferred_language, 
            is_verified, location, preferences
     FROM users WHERE user_id = $1`,
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = result.rows[0];

  // Update last active
  await pool.query('UPDATE users SET last_active = NOW() WHERE user_id = $1', [user.user_id]);

  // Generate final JWT token
  const token = jwt.sign(
    { 
      userId: user.user_id, 
      userType: user.user_type,
      isVerified: user.is_verified 
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { userId: user.user_id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  // Store refresh token and clean up MFA code
  await redis.setEx(`refresh_token:${user.user_id}`, 30 * 24 * 60 * 60, refreshToken);
  await redis.del(mfaKey);

  logger.info('MFA verification successful', { userId: user.user_id });

  res.json({
    success: true,
    message: 'MFA verification successful',
    user: {
      userId: user.user_id,
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      userType: user.user_type,
      preferredLanguage: user.preferred_language,
      location: user.location,
      preferences: user.preferences,
      isVerified: user.is_verified
    },
    token,
    refreshToken
  });
}));

// Send phone verification code
router.post('/verify/phone/send', [
  body('phoneNumber').isMobilePhone('en-IN'),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { phoneNumber } = req.body;
  const redis = getRedisClient();

  // Check rate limiting
  const rateLimitKey = `phone_verification_rate:${phoneNumber}`;
  const attempts = await redis.get(rateLimitKey);
  
  if (attempts && parseInt(attempts) >= 3) {
    throw createError('Too many verification attempts. Please try again later.', 429);
  }

  // Generate verification code
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const codeKey = `phone_verification:${phoneNumber}`;
  
  // Store verification code (expires in 10 minutes)
  await redis.setEx(codeKey, 600, verificationCode);
  
  // Update rate limiting
  await redis.setEx(rateLimitKey, 3600, (parseInt(attempts || '0') + 1).toString()); // 1 hour

  // TODO: Send SMS using Twilio or similar service
  await sendVerificationSMS(phoneNumber, verificationCode);
  logger.info('Phone verification code sent', { phoneNumber: phoneNumber.replace(/(\d{2})(\d{5})(\d{5})/, '$1*****$3') });

  res.json({
    success: true,
    message: 'Verification code sent to your phone number'
  });
}));

// Refresh token endpoint
router.post('/refresh', [
  body('refreshToken').notEmpty(),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const { refreshToken } = req.body;
  const redis = getRedisClient();

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!) as any;
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
  } catch (error) {
    throw createError('Invalid refresh token', 401);
  }

  // Check if refresh token exists in Redis
  const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
  if (!storedToken || storedToken !== refreshToken) {
    throw createError('Invalid or expired refresh token', 401);
  }

  // Get user details
  const pool = getPostgresPool();
  const result = await pool.query(
    'SELECT user_id, user_type, is_verified FROM users WHERE user_id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = result.rows[0];

  // Generate new tokens
  const newToken = jwt.sign(
    { 
      userId: user.user_id, 
      userType: user.user_type,
      isVerified: user.is_verified 
    },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const newRefreshToken = jwt.sign(
    { userId: user.user_id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  // Update refresh token in Redis
  await redis.setEx(`refresh_token:${user.user_id}`, 30 * 24 * 60 * 60, newRefreshToken);

  res.json({
    success: true,
    token: newToken,
    refreshToken: newRefreshToken,
    expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
  });
}));

// Verify phone number
router.post('/verify/phone', [
  body('phoneNumber').isMobilePhone('en-IN'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { phoneNumber, code } = req.body;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Verify code
  const codeKey = `phone_verification:${phoneNumber}`;
  const storedCode = await redis.get(codeKey);

  if (!storedCode || storedCode !== code) {
    throw createError('Invalid or expired verification code', 400);
  }

  // Update user verification status
  const result = await pool.query(
    'UPDATE users SET is_verified = true WHERE phone_number = $1 RETURNING user_id, name, phone_number, email, user_type',
    [phoneNumber]
  );

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  // Clean up verification code
  await redis.del(codeKey);

  logger.info('Phone verification successful', { 
    userId: result.rows[0].user_id,
    phoneNumber: phoneNumber.replace(/(\d{2})(\d{5})(\d{5})/, '$1*****$3')
  });

  res.json({
    success: true,
    message: 'Phone number verified successfully',
    user: result.rows[0]
  });
}));

// Setup MFA
router.post('/mfa/setup', [
  body('method').isIn(['sms', 'email']),
  body('phoneNumber').optional().isMobilePhone('en-IN'),
  body('email').optional().isEmail(),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { method, phoneNumber, email } = req.body;
  
  // Extract user ID from token
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw createError('Authentication required', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Get user details
  const userResult = await pool.query(
    'SELECT user_id, phone_number, email, security_settings FROM users WHERE user_id = $1',
    [decoded.userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = userResult.rows[0];

  // Generate setup code
  const setupCode = crypto.randomInt(100000, 999999).toString();
  const setupKey = `mfa_setup:${user.user_id}`;
  
  // Store setup code (expires in 10 minutes)
  await redis.setEx(setupKey, 600, JSON.stringify({ code: setupCode, method, phoneNumber, email }));

  // Send verification code based on method
  if (method === 'sms') {
    const targetPhone = phoneNumber || user.phone_number;
    await sendVerificationSMS(targetPhone, setupCode);
    logger.info('MFA setup SMS code sent', { userId: user.user_id, phoneNumber: targetPhone });
  } else if (method === 'email') {
    const targetEmail = email || user.email;
    if (!targetEmail) {
      throw createError('Email address required for email MFA', 400);
    }
    await sendMFAEmail(targetEmail, setupCode);
    logger.info('MFA setup email code sent', { userId: user.user_id, email: targetEmail });
  }

  res.json({
    success: true,
    message: `MFA setup code sent via ${method}`,
    method
  });
}));

// Confirm MFA setup
router.post('/mfa/setup/confirm', [
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { code } = req.body;
  
  // Extract user ID from token
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw createError('Authentication required', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Verify setup code
  const setupKey = `mfa_setup:${decoded.userId}`;
  const storedData = await redis.get(setupKey);

  if (!storedData) {
    throw createError('Setup session expired. Please start MFA setup again.', 400);
  }

  const setupData = JSON.parse(storedData);
  if (setupData.code !== code) {
    throw createError('Invalid verification code', 400);
  }

  // Update user security settings
  const securitySettings = {
    mfaEnabled: true,
    mfaMethod: setupData.method,
    sessionTimeout: 1800,
    loginNotifications: true
  };

  await pool.query(
    'UPDATE users SET security_settings = $1 WHERE user_id = $2',
    [JSON.stringify(securitySettings), decoded.userId]
  );

  // Clean up setup session
  await redis.del(setupKey);

  logger.info('MFA setup completed', { 
    userId: decoded.userId, 
    method: setupData.method 
  });

  res.json({
    success: true,
    message: 'MFA setup completed successfully',
    mfaEnabled: true,
    method: setupData.method
  });
}));

// Disable MFA
router.post('/mfa/disable', [
  body('password').notEmpty(),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { password } = req.body;
  
  // Extract user ID from token
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw createError('Authentication required', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const pool = getPostgresPool();

  // Get user and verify password
  const userResult = await pool.query(
    'SELECT user_id, password_hash, security_settings FROM users WHERE user_id = $1',
    [decoded.userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = userResult.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    throw createError('Invalid password', 401);
  }

  // Update security settings to disable MFA
  const securitySettings = {
    ...user.security_settings,
    mfaEnabled: false,
    mfaMethod: 'sms'
  };

  await pool.query(
    'UPDATE users SET security_settings = $1 WHERE user_id = $2',
    [JSON.stringify(securitySettings), decoded.userId]
  );

  logger.info('MFA disabled', { userId: decoded.userId });

  res.json({
    success: true,
    message: 'MFA disabled successfully',
    mfaEnabled: false
  });
}));

// Password reset request
router.post('/password/reset', [
  body('phoneNumber').isMobilePhone('en-IN'),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { phoneNumber } = req.body;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Find user
  const userResult = await pool.query(
    'SELECT user_id, email FROM users WHERE phone_number = $1',
    [phoneNumber]
  );

  // Always return success to prevent user enumeration
  if (userResult.rows.length === 0) {
    logger.warn('Password reset requested for non-existent phone number', { phoneNumber });
    return res.json({
      success: true,
      message: 'If an account with this phone number exists, you will receive reset instructions.'
    });
  }

  const user = userResult.rows[0];

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetKey = `password_reset:${user.user_id}`;
  
  // Store reset token (expires in 1 hour)
  await redis.setEx(resetKey, 3600, resetToken);

  // Send reset instructions via email if available, otherwise SMS
  if (user.email) {
    await sendPasswordResetEmail(user.email, resetToken);
    logger.info('Password reset email sent', { userId: user.user_id });
  } else {
    // For SMS, send a shorter reset code instead of full token
    const resetCode = crypto.randomInt(100000, 999999).toString();
    await redis.setEx(`password_reset_code:${phoneNumber}`, 3600, resetCode);
    await sendVerificationSMS(phoneNumber, resetCode);
    logger.info('Password reset SMS sent', { userId: user.user_id });
  }

  res.json({
    success: true,
    message: 'If an account with this phone number exists, you will receive reset instructions.'
  });
}));

// Password reset confirmation
router.post('/password/reset/confirm', [
  body('resetToken').optional().isLength({ min: 32 }),
  body('phoneNumber').optional().isMobilePhone('en-IN'),
  body('resetCode').optional().isLength({ min: 6, max: 6 }).isNumeric(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { resetToken, phoneNumber, resetCode, newPassword } = req.body;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  let userId: string;

  if (resetToken) {
    // Token-based reset (email)
    const keys = await redis.keys('password_reset:*');
    let foundUserId = null;
    
    for (const key of keys) {
      const storedToken = await redis.get(key);
      if (storedToken === resetToken) {
        foundUserId = key.split(':')[1];
        await redis.del(key);
        break;
      }
    }

    if (!foundUserId) {
      throw createError('Invalid or expired reset token', 400);
    }
    
    userId = foundUserId;
  } else if (phoneNumber && resetCode) {
    // Code-based reset (SMS)
    const codeKey = `password_reset_code:${phoneNumber}`;
    const storedCode = await redis.get(codeKey);

    if (!storedCode || storedCode !== resetCode) {
      throw createError('Invalid or expired reset code', 400);
    }

    // Find user by phone number
    const userResult = await pool.query(
      'SELECT user_id FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (userResult.rows.length === 0) {
      throw createError('User not found', 404);
    }

    userId = userResult.rows[0].user_id;
    await redis.del(codeKey);
  } else {
    throw createError('Either resetToken or phoneNumber with resetCode is required', 400);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE user_id = $2',
    [passwordHash, userId]
  );

  logger.info('Password reset completed', { userId });

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// Logout endpoint
router.post('/logout', [
  body('refreshToken').optional(),
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const { refreshToken } = req.body;
  const redis = getRedisClient();

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!) as any;
      if (decoded.type === 'refresh') {
        // Remove refresh token from Redis
        await redis.del(`refresh_token:${decoded.userId}`);
        logger.info('User logged out', { userId: decoded.userId });
      }
    } catch (error) {
      // Token might be invalid, but we still want to respond with success
      logger.warn('Invalid refresh token during logout', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

export default router;