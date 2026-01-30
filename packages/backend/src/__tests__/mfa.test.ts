import request from 'supertest';
import { app } from '../index';
import { getPostgresPool, getRedisClient } from '../config/database';

describe('MFA Endpoints', () => {
  let pool: any;
  let redis: any;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Wait for database connections to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    pool = getPostgresPool();
    redis = getRedisClient();

    // Create a test user and get token
    const userData = {
      name: 'MFA Test User',
      phoneNumber: '+919876543220',
      email: 'mfatest@example.com',
      password: 'TestPass123!',
      userType: 'buyer',
      acceptTerms: true
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    userToken = registerResponse.body.token;
    userId = registerResponse.body.user.userId;

    // Verify the user
    await pool.query('UPDATE users SET is_verified = true WHERE user_id = $1', [userId]);
  });

  afterAll(async () => {
    // Clean up test data
    if (pool) {
      await pool.query('DELETE FROM users WHERE phone_number = \'+919876543220\'');
    }
  });

  describe('POST /api/auth/mfa/setup', () => {
    it('should setup SMS MFA successfully', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          method: 'sms',
          phoneNumber: '+919876543220'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.method).toBe('sms');
      expect(response.body.message).toContain('MFA setup code sent via sms');
    });

    it('should setup email MFA successfully', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          method: 'email',
          email: 'mfatest@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.method).toBe('email');
      expect(response.body.message).toContain('MFA setup code sent via email');
    });

    it('should reject MFA setup without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .send({
          method: 'sms',
          phoneNumber: '+919876543220'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid MFA method', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          method: 'invalid',
          phoneNumber: '+919876543220'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/mfa/setup/confirm', () => {
    beforeEach(async () => {
      // Setup MFA first
      await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          method: 'sms',
          phoneNumber: '+919876543220'
        });
    });

    it('should confirm MFA setup with valid code', async () => {
      // Get the setup code from Redis (for testing purposes)
      const setupKey = `mfa_setup:${userId}`;
      const setupData = await redis.get(setupKey);
      const { code } = JSON.parse(setupData);

      const response = await request(app)
        .post('/api/auth/mfa/setup/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mfaEnabled).toBe(true);
      expect(response.body.method).toBe('sms');
    });

    it('should reject invalid confirmation code', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: '000000' })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid verification code');
    });

    it('should reject confirmation without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup/confirm')
        .send({ code: '123456' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/mfa/disable', () => {
    beforeEach(async () => {
      // Enable MFA first
      await pool.query(
        'UPDATE users SET security_settings = $1 WHERE user_id = $2',
        [JSON.stringify({ mfaEnabled: true, mfaMethod: 'sms' }), userId]
      );
    });

    it('should disable MFA with valid password', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/disable')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'TestPass123!' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mfaEnabled).toBe(false);
    });

    it('should reject MFA disable with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/disable')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'WrongPassword' })
        .expect(401);

      expect(response.body.error.message).toContain('Invalid password');
    });

    it('should reject MFA disable without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/disable')
        .send({ password: 'TestPass123!' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('MFA Login Flow', () => {
    beforeEach(async () => {
      // Enable MFA for the user
      await pool.query(
        'UPDATE users SET security_settings = $1 WHERE user_id = $2',
        [JSON.stringify({ mfaEnabled: true, mfaMethod: 'sms' }), userId]
      );
    });

    it('should require MFA during login when enabled', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+919876543220',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.requiresMFA).toBe(true);
      expect(response.body.mfaMethod).toBe('sms');
      expect(response.body.tempToken).toBeDefined();
    });

    it('should complete login after MFA verification', async () => {
      // First, login to get temp token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+919876543220',
          password: 'TestPass123!'
        });

      const tempToken = loginResponse.body.tempToken;

      // Get MFA code from Redis (for testing)
      const mfaKey = `mfa_login:${userId}`;
      const mfaCode = await redis.get(mfaKey);

      // Verify MFA
      const verifyResponse = await request(app)
        .post('/api/auth/mfa/verify')
        .send({
          code: mfaCode,
          tempToken
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.token).toBeDefined();
      expect(verifyResponse.body.refreshToken).toBeDefined();
      expect(verifyResponse.body.user).toBeDefined();
    });

    it('should reject invalid MFA code', async () => {
      // First, login to get temp token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+919876543220',
          password: 'TestPass123!'
        });

      const tempToken = loginResponse.body.tempToken;

      // Try with invalid MFA code
      const verifyResponse = await request(app)
        .post('/api/auth/mfa/verify')
        .send({
          code: '000000',
          tempToken
        })
        .expect(400);

      expect(verifyResponse.body.error.message).toContain('Invalid or expired MFA code');
    });
  });

  describe('Phone Verification', () => {
    it('should send phone verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify/phone/send')
        .send({ phoneNumber: '+919876543221' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Verification code sent');
    });

    it('should verify phone number with valid code', async () => {
      const phoneNumber = '+919876543222';
      
      // First create a user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Phone Test User',
          phoneNumber,
          password: 'TestPass123!',
          userType: 'buyer',
          acceptTerms: true
        });

      // Get verification code from Redis
      const codeKey = `phone_verification:${phoneNumber}`;
      const verificationCode = await redis.get(codeKey);

      // Verify phone
      const response = await request(app)
        .post('/api/auth/verify/phone')
        .send({
          phoneNumber,
          code: verificationCode
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');

      // Clean up
      await pool.query('DELETE FROM users WHERE phone_number = $1', [phoneNumber]);
    });

    it('should reject invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify/phone')
        .send({
          phoneNumber: '+919876543220',
          code: '000000'
        })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid or expired verification code');
    });

    it('should enforce rate limiting on verification requests', async () => {
      const phoneNumber = '+919876543223';

      // Send 3 verification requests (should hit rate limit)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/verify/phone/send')
          .send({ phoneNumber });
      }

      // 4th request should be rate limited
      const response = await request(app)
        .post('/api/auth/verify/phone/send')
        .send({ phoneNumber })
        .expect(429);

      expect(response.body.error.message).toContain('Too many verification attempts');
    });
  });
});