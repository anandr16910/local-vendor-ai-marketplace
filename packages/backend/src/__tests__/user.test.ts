import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';
import { getPostgresPool } from '../config/database';

describe('User Profile Endpoints', () => {
  let pool: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Wait for database connections to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    pool = getPostgresPool();

    // Create a test user and get auth token
    const userData = {
      name: 'Profile Test User',
      phoneNumber: '+919876543214',
      email: 'profiletest@example.com',
      password: 'TestPass123!',
      userType: 'buyer',
      acceptTerms: true
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.userId;
  });

  afterAll(async () => {
    // Clean up test data
    if (pool) {
      await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
    }
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        userId,
        userType: 'buyer',
        personalInfo: {
          name: 'Profile Test User',
          phoneNumber: '+919876543214',
          email: 'profiletest@example.com',
          preferredLanguage: 'en'
        },
        isVerified: false
      });
      expect(response.body.user.preferences).toBeDefined();
      expect(response.body.user.securitySettings).toBeDefined();
    });

    it('should reject request without auth token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.error.message).toContain('No token provided');
    });

    it('should reject request with invalid auth token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.message).toContain('Invalid token');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        personalInfo: {
          name: 'Updated Profile Test User',
          email: 'updated-profiletest@example.com',
          location: {
            address: '123 Test Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            coordinates: {
              latitude: 19.0760,
              longitude: 72.8777
            }
          }
        },
        preferences: {
          languages: ['en', 'hi'],
          culturalSettings: [
            {
              category: 'negotiation_style',
              preference: 'respectful',
              importance: 'high'
            }
          ],
          notificationSettings: {
            email: true,
            sms: false,
            push: true,
            negotiationUpdates: true,
            priceAlerts: false,
            marketInsights: true
          }
        }
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Profile updated successfully');
      expect(response.body.user.personalInfo.name).toBe('Updated Profile Test User');
      expect(response.body.user.personalInfo.email).toBe('updated-profiletest@example.com');
      expect(response.body.user.personalInfo.location).toMatchObject(updateData.personalInfo.location);
    });

    it('should reject update with invalid email format', async () => {
      const updateData = {
        personalInfo: {
          email: 'invalid-email-format'
        }
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should reject update with invalid pincode', async () => {
      const updateData = {
        personalInfo: {
          location: {
            address: '123 Test Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '12345' // Invalid pincode (should be 6 digits starting with non-zero)
          }
        }
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should reject update with no fields provided', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toContain('No valid fields to update');
    });
  });

  describe('POST /api/users/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'TestPass123!',
        newPassword: 'NewTestPass123!',
        confirmPassword: 'NewTestPass123!'
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');

      // Verify new password works by logging in
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '+919876543214',
          password: 'NewTestPass123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password change with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'WrongCurrentPassword123!',
        newPassword: 'AnotherNewPass123!',
        confirmPassword: 'AnotherNewPass123!'
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.error.message).toContain('Current password is incorrect');
    });

    it('should reject password change with weak new password', async () => {
      const passwordData = {
        currentPassword: 'NewTestPass123!',
        newPassword: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should reject password change with mismatched confirmation', async () => {
      const passwordData = {
        currentPassword: 'NewTestPass123!',
        newPassword: 'AnotherNewPass123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('MFA Endpoints', () => {
    describe('POST /api/users/mfa/setup', () => {
      it('should setup SMS MFA successfully', async () => {
        const mfaData = {
          method: 'sms',
          phoneNumber: '+919876543214'
        };

        const response = await request(app)
          .post('/api/users/mfa/setup')
          .set('Authorization', `Bearer ${authToken}`)
          .send(mfaData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.method).toBe('sms');
        expect(response.body.message).toContain('Verification code sent');
      });

      it('should setup app-based MFA successfully', async () => {
        const mfaData = {
          method: 'app'
        };

        const response = await request(app)
          .post('/api/users/mfa/setup')
          .set('Authorization', `Bearer ${authToken}`)
          .send(mfaData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.method).toBe('app');
        expect(response.body.qrCode).toBeDefined();
        expect(response.body.secret).toBeDefined();
      });

      it('should reject invalid MFA method', async () => {
        const mfaData = {
          method: 'invalid-method'
        };

        const response = await request(app)
          .post('/api/users/mfa/setup')
          .set('Authorization', `Bearer ${authToken}`)
          .send(mfaData)
          .expect(400);

        expect(response.body.error.message).toContain('Validation failed');
      });
    });

    describe('POST /api/users/mfa/verify', () => {
      it('should reject invalid verification code format', async () => {
        const verifyData = {
          code: '12345', // Should be 6 digits
          method: 'sms'
        };

        const response = await request(app)
          .post('/api/users/mfa/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send(verifyData)
          .expect(400);

        expect(response.body.error.message).toContain('Validation failed');
      });

      it('should reject expired or invalid verification code', async () => {
        const verifyData = {
          code: '123456',
          method: 'sms'
        };

        const response = await request(app)
          .post('/api/users/mfa/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send(verifyData)
          .expect(400);

        expect(response.body.error.message).toContain('Verification code expired or invalid');
      });
    });
  });

  describe('Phone Verification', () => {
    describe('POST /api/auth/verify/phone/send', () => {
      it('should send phone verification code successfully', async () => {
        const phoneData = {
          phoneNumber: '+919876543215'
        };

        const response = await request(app)
          .post('/api/auth/verify/phone/send')
          .send(phoneData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Verification code sent');
      });

      it('should reject invalid phone number format', async () => {
        const phoneData = {
          phoneNumber: '123456789'
        };

        const response = await request(app)
          .post('/api/auth/verify/phone/send')
          .send(phoneData)
          .expect(400);

        expect(response.body.error.message).toContain('Validation failed');
      });
    });

    describe('POST /api/users/verify/phone', () => {
      it('should reject invalid verification code', async () => {
        const verifyData = {
          phoneNumber: '+919876543214',
          code: '123456'
        };

        const response = await request(app)
          .post('/api/users/verify/phone')
          .set('Authorization', `Bearer ${authToken}`)
          .send(verifyData)
          .expect(400);

        expect(response.body.error.message).toContain('Invalid or expired verification code');
      });
    });
  });
});