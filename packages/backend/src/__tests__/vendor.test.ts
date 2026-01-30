import request from 'supertest';
import { app } from '../index';
import { getPostgresPool } from '../config/database';

describe('Vendor Profile Endpoints', () => {
  let pool: any;
  let vendorAuthToken: string;
  let buyerAuthToken: string;
  let vendorUserId: string;
  let buyerUserId: string;

  beforeAll(async () => {
    // Wait for database connections to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    pool = getPostgresPool();

    // Create a test vendor user
    const vendorData = {
      name: 'Test Vendor',
      phoneNumber: '+919876543216',
      email: 'vendor@example.com',
      password: 'TestPass123!',
      userType: 'vendor',
      acceptTerms: true
    };

    const vendorResponse = await request(app)
      .post('/api/auth/register')
      .send(vendorData);

    vendorAuthToken = vendorResponse.body.token;
    vendorUserId = vendorResponse.body.user.userId;

    // Create a test buyer user for feedback tests
    const buyerData = {
      name: 'Test Buyer',
      phoneNumber: '+919876543217',
      email: 'buyer@example.com',
      password: 'TestPass123!',
      userType: 'buyer',
      acceptTerms: true
    };

    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send(buyerData);

    buyerAuthToken = buyerResponse.body.token;
    buyerUserId = buyerResponse.body.user.userId;
  });

  afterAll(async () => {
    // Clean up test data
    if (pool) {
      await pool.query('DELETE FROM vendor_profiles WHERE vendor_id IN ($1, $2)', [vendorUserId, buyerUserId]);
      await pool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [vendorUserId, buyerUserId]);
    }
  });

  describe('POST /api/vendors/profile', () => {
    it('should create vendor profile successfully', async () => {
      const profileData = {
        businessInfo: {
          businessName: 'Test Business',
          businessType: 'individual',
          establishedYear: 2020,
          description: 'A test business for unit testing purposes',
          categories: ['food_beverages', 'handicrafts'],
          operatingHours: {
            monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
            sunday: { isOpen: false }
          },
          contactInfo: {
            primaryPhone: '+919876543216',
            email: 'vendor@example.com'
          }
        },
        specializations: ['organic_food', 'handmade_crafts'],
        culturalPreferences: [
          {
            category: 'negotiation_style',
            preference: 'respectful',
            importance: 'high'
          }
        ],
        serviceRadius: 15,
        preferredPaymentMethods: ['UPI', 'CASH'],
        deliveryOptions: ['pickup', 'delivery']
      };

      const response = await request(app)
        .post('/api/vendors/profile')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Vendor profile created successfully');
      expect(response.body.vendorProfile).toMatchObject({
        vendorId: vendorUserId,
        businessInfo: profileData.businessInfo,
        specializations: profileData.specializations
      });
      expect(response.body.nextSteps).toBeDefined();
      expect(Array.isArray(response.body.nextSteps)).toBe(true);
    });

    it('should reject vendor profile creation by non-vendor user', async () => {
      const profileData = {
        businessInfo: {
          businessName: 'Test Business',
          businessType: 'individual',
          establishedYear: 2020,
          description: 'A test business',
          categories: ['food_beverages'],
          operatingHours: {
            monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            tuesday: { isOpen: false },
            wednesday: { isOpen: false },
            thursday: { isOpen: false },
            friday: { isOpen: false },
            saturday: { isOpen: false },
            sunday: { isOpen: false }
          },
          contactInfo: {
            primaryPhone: '+919876543217'
          }
        },
        specializations: ['test']
      };

      const response = await request(app)
        .post('/api/vendors/profile')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .send(profileData)
        .expect(403);

      expect(response.body.error.message).toContain('Insufficient permissions');
    });

    it('should reject duplicate vendor profile creation', async () => {
      const profileData = {
        businessInfo: {
          businessName: 'Another Test Business',
          businessType: 'company',
          establishedYear: 2019,
          description: 'Another test business',
          categories: ['electronics'],
          operatingHours: {
            monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            tuesday: { isOpen: false },
            wednesday: { isOpen: false },
            thursday: { isOpen: false },
            friday: { isOpen: false },
            saturday: { isOpen: false },
            sunday: { isOpen: false }
          },
          contactInfo: {
            primaryPhone: '+919876543216'
          }
        },
        specializations: ['electronics_repair']
      };

      const response = await request(app)
        .post('/api/vendors/profile')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(profileData)
        .expect(409);

      expect(response.body.error.message).toContain('Vendor profile already exists');
    });

    it('should reject invalid business info', async () => {
      // Create another vendor for this test
      const newVendorData = {
        name: 'Another Test Vendor',
        phoneNumber: '+919876543218',
        email: 'vendor2@example.com',
        password: 'TestPass123!',
        userType: 'vendor',
        acceptTerms: true
      };

      const newVendorResponse = await request(app)
        .post('/api/auth/register')
        .send(newVendorData);

      const newVendorToken = newVendorResponse.body.token;

      const invalidProfileData = {
        businessInfo: {
          businessName: 'A', // Too short
          businessType: 'invalid_type',
          establishedYear: 1800, // Too old
          description: 'Short', // Too short
          categories: [], // Empty array
          operatingHours: {},
          contactInfo: {
            primaryPhone: '123' // Invalid phone
          }
        },
        specializations: [] // Empty array
      };

      const response = await request(app)
        .post('/api/vendors/profile')
        .set('Authorization', `Bearer ${newVendorToken}`)
        .send(invalidProfileData)
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');

      // Clean up
      await pool.query('DELETE FROM users WHERE user_id = $1', [newVendorResponse.body.user.userId]);
    });
  });

  describe('GET /api/vendors/profile/:vendorId', () => {
    it('should get vendor profile successfully', async () => {
      const response = await request(app)
        .get(`/api/vendors/profile/${vendorUserId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.vendorProfile).toMatchObject({
        vendorId: vendorUserId,
        businessInfo: {
          businessName: 'Test Business',
          businessType: 'individual'
        }
      });
      expect(response.body.canEdit).toBe(true);
      expect(response.body.publicView).toBe(false);
    });

    it('should get vendor profile as public view', async () => {
      const response = await request(app)
        .get(`/api/vendors/profile/${vendorUserId}`)
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.vendorProfile.vendorId).toBe(vendorUserId);
      expect(response.body.canEdit).toBe(false);
      expect(response.body.publicView).toBe(true);
    });

    it('should return 404 for non-existent vendor profile', async () => {
      const fakeVendorId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/vendors/profile/${fakeVendorId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(404);

      expect(response.body.error.message).toContain('Vendor profile not found');
    });
  });

  describe('PUT /api/vendors/profile', () => {
    it('should update vendor profile successfully', async () => {
      const updateData = {
        businessInfo: {
          businessName: 'Updated Test Business',
          description: 'An updated test business description with more details',
          categories: ['food_beverages', 'handicrafts', 'services']
        },
        specializations: ['organic_food', 'handmade_crafts', 'consultation'],
        serviceRadius: 20
      };

      const response = await request(app)
        .put('/api/vendors/profile')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Vendor profile updated successfully');
      expect(response.body.vendorProfile.businessInfo.businessName).toBe('Updated Test Business');
      expect(response.body.vendorProfile.specializations).toContain('consultation');
      expect(response.body.changesApplied).toEqual(Object.keys(updateData));
    });

    it('should reject update by non-vendor user', async () => {
      const updateData = {
        businessInfo: {
          businessName: 'Unauthorized Update'
        }
      };

      const response = await request(app)
        .put('/api/vendors/profile')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error.message).toContain('Insufficient permissions');
    });

    it('should reject update with no fields', async () => {
      const response = await request(app)
        .put('/api/vendors/profile')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toContain('No valid fields to update');
    });
  });

  describe('GET /api/vendors', () => {
    it('should search vendors successfully', async () => {
      const response = await request(app)
        .get('/api/vendors')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .query({
          query: 'Test Business',
          limit: 10,
          offset: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.vendors)).toBe(true);
      expect(response.body.totalCount).toBeGreaterThanOrEqual(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter vendors by category', async () => {
      const response = await request(app)
        .get('/api/vendors')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .query({
          categories: ['food_beverages'],
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.vendors)).toBe(true);
    });

    it('should filter vendors by minimum rating', async () => {
      const response = await request(app)
        .get('/api/vendors')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .query({
          minRating: 4.0,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.vendors)).toBe(true);
    });

    it('should sort vendors by rating', async () => {
      const response = await request(app)
        .get('/api/vendors')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .query({
          sortBy: 'rating',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.vendors)).toBe(true);
    });
  });

  describe('Vendor Feedback', () => {
    let transactionId: string;

    beforeAll(async () => {
      // Create a test transaction for feedback
      const transactionResult = await pool.query(`
        INSERT INTO transactions (vendor_id, buyer_id, amount, payment_method, status)
        VALUES ($1, $2, 100.00, 'UPI', 'completed')
        RETURNING transaction_id
      `, [vendorUserId, buyerUserId]);
      
      transactionId = transactionResult.rows[0].transaction_id;
    });

    describe('POST /api/vendors/:vendorId/feedback', () => {
      it('should submit vendor feedback successfully', async () => {
        const feedbackData = {
          transactionId,
          ratings: {
            quality: 5,
            fairness: 4,
            service: 5,
            reliability: 4
          },
          comments: 'Great service and quality products!',
          wouldRecommend: true
        };

        const response = await request(app)
          .post(`/api/vendors/${vendorUserId}/feedback`)
          .set('Authorization', `Bearer ${buyerAuthToken}`)
          .send(feedbackData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.feedbackId).toBeDefined();
        expect(response.body.message).toContain('Feedback submitted successfully');
        expect(response.body.reputationUpdated).toBe(true);
      });

      it('should reject feedback submission by vendor user', async () => {
        const feedbackData = {
          transactionId,
          ratings: {
            quality: 3,
            fairness: 3,
            service: 3,
            reliability: 3
          },
          wouldRecommend: false
        };

        const response = await request(app)
          .post(`/api/vendors/${vendorUserId}/feedback`)
          .set('Authorization', `Bearer ${vendorAuthToken}`)
          .send(feedbackData)
          .expect(403);

        expect(response.body.error.message).toContain('Insufficient permissions');
      });

      it('should reject duplicate feedback submission', async () => {
        const feedbackData = {
          transactionId,
          ratings: {
            quality: 3,
            fairness: 3,
            service: 3,
            reliability: 3
          },
          wouldRecommend: false
        };

        const response = await request(app)
          .post(`/api/vendors/${vendorUserId}/feedback`)
          .set('Authorization', `Bearer ${buyerAuthToken}`)
          .send(feedbackData)
          .expect(409);

        expect(response.body.error.message).toContain('Feedback already submitted');
      });

      it('should reject feedback with invalid ratings', async () => {
        // Create another transaction for this test
        const anotherTransactionResult = await pool.query(`
          INSERT INTO transactions (vendor_id, buyer_id, amount, payment_method, status)
          VALUES ($1, $2, 50.00, 'CASH', 'completed')
          RETURNING transaction_id
        `, [vendorUserId, buyerUserId]);
        
        const anotherTransactionId = anotherTransactionResult.rows[0].transaction_id;

        const feedbackData = {
          transactionId: anotherTransactionId,
          ratings: {
            quality: 6, // Invalid rating (should be 1-5)
            fairness: 0, // Invalid rating (should be 1-5)
            service: 3,
            reliability: 4
          },
          wouldRecommend: true
        };

        const response = await request(app)
          .post(`/api/vendors/${vendorUserId}/feedback`)
          .set('Authorization', `Bearer ${buyerAuthToken}`)
          .send(feedbackData)
          .expect(400);

        expect(response.body.error.message).toContain('Validation failed');
      });
    });

    describe('GET /api/vendors/:vendorId/feedback', () => {
      it('should get vendor feedback successfully', async () => {
        const response = await request(app)
          .get(`/api/vendors/${vendorUserId}/feedback`)
          .set('Authorization', `Bearer ${buyerAuthToken}`)
          .query({
            limit: 10,
            offset: 0,
            sortBy: 'newest'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.feedback)).toBe(true);
        expect(response.body.totalCount).toBeGreaterThanOrEqual(1);
        expect(response.body.averageRatings).toBeDefined();
        expect(response.body.averageRatings.overall).toBeDefined();
      });

      it('should filter feedback by verified status', async () => {
        const response = await request(app)
          .get(`/api/vendors/${vendorUserId}/feedback`)
          .set('Authorization', `Bearer ${buyerAuthToken}`)
          .query({
            verified: 'true',
            limit: 10
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.feedback)).toBe(true);
      });

      it('should sort feedback by rating', async () => {
        const response = await request(app)
          .get(`/api/vendors/${vendorUserId}/feedback`)
          .set('Authorization', `Bearer ${buyerAuthToken}`)
          .query({
            sortBy: 'rating_high',
            limit: 10
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.feedback)).toBe(true);
      });
    });
  });
});