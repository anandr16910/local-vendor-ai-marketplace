import request from 'supertest';
import { app } from '../index';
import { getPostgresPool, getRedisClient } from '../config/database';

describe('Authentication Endpoints', () => {
  let pool: any;
  let redis: any;

  beforeAll(async () => {
    // Wait for database connections to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    pool = getPostgresPool();
    redis = getRedisClient();
  });

  afterAll(async () => {
    // Clean up test data
    if (pool) {
      await pool.query('DELETE FROM users WHERE phone_number LIKE \'+91%test%\'');
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        phoneNumber: '+919876543210',
        email: 'test@example.com',
        password: 'TestPass123!',
        userType: 'buyer',
        preferredLanguage: 'en',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        userType: userData.userType,
        preferredLanguage: userData.preferredLanguage,
        isVerified: false
      });
      expect(response.body.token).toBeDefined();
      expect(response.body.requiresVerification).toBe(true);
    });

    it('should reject registration with invalid phone number', async () => {
      const userData = {
        name: 'Test User',
        phoneNumber: '123456789', // Invalid Indian phone number
        email: 'test2@example.com',
        password: 'TestPass123!',
        userType: 'buyer',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'Test User',
        phoneNumber: '+919876543211',
        email: 'test3@example.com',
        password: 'weak', // Weak password
        userType: 'buyer',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject duplicate phone number registration', async () => {
      const userData = {
        name: 'Test User 2',
        phoneNumber: '+919876543210', // Same as first test
        email: 'test4@example.com',
        password: 'TestPass123!',
        userType: 'vendor',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error.message).toContain('already exists');
    });

    it('should reject registration without accepting terms', async () => {
      const userData = {
        name: 'Test User',
        phoneNumber: '+919876543212',
        email: 'test5@example.com',
        password: 'TestPass123!',
        userType: 'buyer',
        acceptTerms: false
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      const userData = {
        name: 'Login Test User',
        phoneNumber: '+919876543213',
        email: 'logintest@example.com',
        password: 'TestPass123!',
        userType: 'buyer',
        acceptTerms: true
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        phoneNumber: '+919876543213',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        phoneNumber: loginData.phoneNumber,
        userType: 'buyer'
      });
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should reject login with invalid phone number', async () => {
      const loginData = {
        phoneNumber: '+919999999999', // Non-existent phone number
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        phoneNumber: '+919876543213',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid phone format', async () => {
      const loginData = {
        phoneNumber: '123456789', // Invalid format
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get a refresh token
      const loginData = {
        phoneNumber: '+919876543213',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      refreshToken = response.body.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.expiresIn).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error.message).toContain('Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get a refresh token
      const loginData = {
        phoneNumber: '+919876543213',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      refreshToken = response.body.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should handle logout without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});