import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { getPostgresPool, getRedisClient } from '../config/database';
import { logger } from '../utils/logger';
import { sendVerificationSMS } from '../utils/sms';
import { sendMFAEmail } from '../utils/email';
import { 
  validateUserProfileUpdate, 
  validateMFASetup, 
  validateMFAVerify,
  validatePhoneVerification,
  validateEmailVerification 
} from '@local-vendor-ai/shared';

const router = express.Router();

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const pool = getPostgresPool();
  
  const result = await pool.query(`
    SELECT 
      user_id,
      user_type,
      name,
      phone_number,
      email,
      preferred_language,
      is_verified,
      profile_image_url,
      location,
      preferences,
      security_settings,
      created_at,
      updated_at,
      last_active
    FROM users 
    WHERE user_id = $1
  `, [req.user!.userId]);

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = result.rows[0];
  
  // Format response according to UserProfile interface
  const userProfile = {
    userId: user.user_id,
    userType: user.user_type,
    personalInfo: {
      name: user.name,
      phoneNumber: user.phone_number,
      email: user.email,
      preferredLanguage: user.preferred_language,
      location: user.location,
      profileImage: user.profile_image_url
    },
    preferences: user.preferences || {
      languages: [user.preferred_language],
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
    },
    securitySettings: user.security_settings || {
      mfaEnabled: false,
      mfaMethod: 'sms',
      sessionTimeout: 1800,
      loginNotifications: true
    },
    isVerified: user.is_verified,
    createdAt: user.created_at,
    lastActive: user.last_active
  };

  res.json({
    success: true,
    user: userProfile
  });
}));

// Update user profile
router.put('/profile', [
  body('personalInfo.name').optional().trim().isLength({ min: 2, max: 100 }),
  body('personalInfo.email').optional().isEmail(),
  body('personalInfo.preferredLanguage').optional().isLength({ min: 2, max: 10 }),
  body('personalInfo.location.address').optional().isLength({ min: 5, max: 500 }),
  body('personalInfo.location.city').optional().isLength({ min: 2, max: 100 }),
  body('personalInfo.location.state').optional().isLength({ min: 2, max: 100 }),
  body('personalInfo.location.pincode').optional().matches(/^[1-9][0-9]{5}$/),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { personalInfo, preferences, securitySettings } = req.body;
  const pool = getPostgresPool();

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (personalInfo) {
    if (personalInfo.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(personalInfo.name);
    }
    if (personalInfo.email) {
      // Check if email is already taken by another user
      const emailCheck = await pool.query(
        'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
        [personalInfo.email, req.user!.userId]
      );
      if (emailCheck.rows.length > 0) {
        throw createError('Email already in use by another account', 409);
      }
      updates.push(`email = $${paramCount++}`);
      values.push(personalInfo.email);
    }
    if (personalInfo.preferredLanguage) {
      updates.push(`preferred_language = $${paramCount++}`);
      values.push(personalInfo.preferredLanguage);
    }
    if (personalInfo.profileImage) {
      updates.push(`profile_image_url = $${paramCount++}`);
      values.push(personalInfo.profileImage);
    }
    if (personalInfo.location) {
      updates.push(`location = $${paramCount++}`);
      values.push(JSON.stringify(personalInfo.location));
    }
  }

  if (preferences) {
    updates.push(`preferences = $${paramCount++}`);
    values.push(JSON.stringify(preferences));
  }

  if (securitySettings) {
    updates.push(`security_settings = $${paramCount++}`);
    values.push(JSON.stringify(securitySettings));
  }

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updates.push(`updated_at = NOW()`);
  values.push(req.user!.userId);

  const query = `
    UPDATE users 
    SET ${updates.join(', ')}
    WHERE user_id = $${paramCount}
    RETURNING user_id, name, phone_number, email, preferred_language, 
             profile_image_url, location, preferences, security_settings, updated_at
  `;

  const result = await pool.query(query, values);
  const updatedUser = result.rows[0];

  logger.info('User profile updated', { 
    userId: req.user!.userId, 
    updatedFields: Object.keys(req.body) 
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      userId: updatedUser.user_id,
      personalInfo: {
        name: updatedUser.name,
        phoneNumber: updatedUser.phone_number,
        email: updatedUser.email,
        preferredLanguage: updatedUser.preferred_language,
        profileImage: updatedUser.profile_image_url,
        location: updatedUser.location
      },
      preferences: updatedUser.preferences,
      securitySettings: updatedUser.security_settings,
      updatedAt: updatedUser.updated_at
    }
  });
}));

// Setup Multi-Factor Authentication
router.post('/mfa/setup', [
  body('method').isIn(['sms', 'email', 'app']),
  body('phoneNumber').optional().isMobilePhone('en-IN'),
  body('email').optional().isEmail(),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { method, phoneNumber, email } = req.body;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  // Generate verification code
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const codeKey = `mfa_setup:${req.user!.userId}:${method}`;

  // Store verification code in Redis (expires in 5 minutes)
  await redis.setEx(codeKey, 300, JSON.stringify({
    code: verificationCode,
    method,
    phoneNumber,
    email,
    timestamp: Date.now()
  }));

  // Send verification code based on method
  if (method === 'sms' && phoneNumber) {
    await sendVerificationSMS(phoneNumber, verificationCode);
    logger.info('SMS MFA setup code sent', { userId: req.user!.userId, phoneNumber });
  } else if (method === 'email' && email) {
    await sendMFAEmail(email, verificationCode);
    logger.info('Email MFA setup code sent', { userId: req.user!.userId, email });
  } else if (method === 'app') {
    // Generate QR code for authenticator app
    const secret = crypto.randomBytes(32).toString('base64');
    await redis.setEx(`mfa_secret:${req.user!.userId}`, 300, secret);
    
    // TODO: Generate QR code URL for authenticator app
    const qrCodeUrl = `otpauth://totp/LocalVendorAI:${req.user!.userId}?secret=${secret}&issuer=LocalVendorAI`;
    
    return res.json({
      success: true,
      method: 'app',
      qrCode: qrCodeUrl,
      secret,
      message: 'Scan the QR code with your authenticator app and enter the verification code'
    });
  }

  res.json({
    success: true,
    method,
    message: `Verification code sent via ${method}. Please enter the code to complete MFA setup.`
  });
}));

// Verify MFA Setup
router.post('/mfa/verify', [
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  body('method').isIn(['sms', 'email', 'app']),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { code, method } = req.body;
  const pool = getPostgresPool();
  const redis = getRedisClient();

  const codeKey = `mfa_setup:${req.user!.userId}:${method}`;
  const storedData = await redis.get(codeKey);

  if (!storedData) {
    throw createError('Verification code expired or invalid', 400);
  }

  const { code: storedCode, phoneNumber, email } = JSON.parse(storedData);

  if (code !== storedCode) {
    throw createError('Invalid verification code', 400);
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  // Update user's security settings
  const securitySettings = {
    mfaEnabled: true,
    mfaMethod: method,
    sessionTimeout: 1800,
    loginNotifications: true,
    backupCodes: backupCodes.map(code => ({ code, used: false })),
    mfaSetupDate: new Date().toISOString()
  };

  if (method === 'sms' && phoneNumber) {
    securitySettings.mfaPhoneNumber = phoneNumber;
  } else if (method === 'email' && email) {
    securitySettings.mfaEmail = email;
  }

  await pool.query(
    'UPDATE users SET security_settings = $1 WHERE user_id = $2',
    [JSON.stringify(securitySettings), req.user!.userId]
  );

  // Clean up Redis keys
  await redis.del(codeKey);
  if (method === 'app') {
    await redis.del(`mfa_secret:${req.user!.userId}`);
  }

  logger.info('MFA setup completed', { userId: req.user!.userId, method });

  res.json({
    success: true,
    message: 'Multi-factor authentication has been successfully enabled',
    backupCodes,
    method
  });
}));

// Disable MFA
router.post('/mfa/disable', [
  body('password').notEmpty(),
  body('code').optional().isLength({ min: 6, max: 6 }),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { password, code } = req.body;
  const pool = getPostgresPool();

  // Verify password
  const userResult = await pool.query(
    'SELECT password_hash, security_settings FROM users WHERE user_id = $1',
    [req.user!.userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const { password_hash, security_settings } = userResult.rows[0];
  const isValidPassword = await bcrypt.compare(password, password_hash);

  if (!isValidPassword) {
    throw createError('Invalid password', 401);
  }

  // If MFA is enabled, require MFA code to disable
  if (security_settings?.mfaEnabled && !code) {
    throw createError('MFA verification code required to disable MFA', 400);
  }

  if (security_settings?.mfaEnabled && code) {
    // Verify MFA code based on method
    const mfaKey = `mfa_disable:${req.user!.userId}`;
    const storedCode = await redis.get(mfaKey);
    
    if (!storedCode || storedCode !== code) {
      throw createError('Invalid or expired MFA code', 400);
    }
    
    // Clean up the MFA code
    await redis.del(mfaKey);
  }

  // Update security settings to disable MFA
  const updatedSecuritySettings = {
    ...security_settings,
    mfaEnabled: false,
    mfaMethod: null,
    mfaPhoneNumber: null,
    mfaEmail: null,
    backupCodes: null,
    mfaDisabledDate: new Date().toISOString()
  };

  await pool.query(
    'UPDATE users SET security_settings = $1 WHERE user_id = $2',
    [JSON.stringify(updatedSecuritySettings), req.user!.userId]
  );

  logger.info('MFA disabled', { userId: req.user!.userId });

  res.json({
    success: true,
    message: 'Multi-factor authentication has been disabled'
  });
}));

// Verify phone number
router.post('/verify/phone', [
  body('phoneNumber').isMobilePhone('en-IN'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { phoneNumber, code } = req.body;
  const redis = getRedisClient();
  const pool = getPostgresPool();

  const codeKey = `phone_verification:${phoneNumber}`;
  const storedCode = await redis.get(codeKey);

  if (!storedCode || storedCode !== code) {
    throw createError('Invalid or expired verification code', 400);
  }

  // Update user's phone verification status
  await pool.query(
    'UPDATE users SET phone_number = $1, is_verified = true WHERE user_id = $2',
    [phoneNumber, req.user!.userId]
  );

  // Clean up verification code
  await redis.del(codeKey);

  logger.info('Phone number verified', { userId: req.user!.userId, phoneNumber });

  res.json({
    success: true,
    message: 'Phone number verified successfully',
    isVerified: true
  });
}));

// Verify email
router.post('/verify/email', [
  body('email').isEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, code } = req.body;
  const redis = getRedisClient();
  const pool = getPostgresPool();

  const codeKey = `email_verification:${email}`;
  const storedCode = await redis.get(codeKey);

  if (!storedCode || storedCode !== code) {
    throw createError('Invalid or expired verification code', 400);
  }

  // Update user's email
  await pool.query(
    'UPDATE users SET email = $1 WHERE user_id = $2',
    [email, req.user!.userId]
  );

  // Clean up verification code
  await redis.del(codeKey);

  logger.info('Email verified', { userId: req.user!.userId, email });

  res.json({
    success: true,
    message: 'Email verified successfully',
    isVerified: true
  });
}));

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { currentPassword, newPassword } = req.body;
  const pool = getPostgresPool();

  // Verify current password
  const userResult = await pool.query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [req.user!.userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
  if (!isValidPassword) {
    throw createError('Current password is incorrect', 401);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [newPasswordHash, req.user!.userId]
  );

  logger.info('Password changed', { userId: req.user!.userId });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Delete account
router.delete('/account', [
  body('password').notEmpty(),
  body('confirmation').equals('DELETE_MY_ACCOUNT'),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { password } = req.body;
  const pool = getPostgresPool();

  // Verify password
  const userResult = await pool.query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [req.user!.userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const isValidPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);
  if (!isValidPassword) {
    throw createError('Invalid password', 401);
  }

  // Soft delete user account (mark as deleted instead of hard delete)
  await pool.query(
    'UPDATE users SET is_verified = false, email = NULL, updated_at = NOW() WHERE user_id = $1',
    [req.user!.userId]
  );

  logger.info('User account deleted', { userId: req.user!.userId });

  res.json({
    success: true,
    message: 'Account has been successfully deleted'
  });
}));

export default router;