import request from 'supertest';
import { app } from '../index';
import { getPostgresPool, getMongoDb } from '../config/database';

describe('Market Data Endpoints', () => {
  let pool: any;
  let mongoDb: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Wait for database connections to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    pool = getPostgresPool();
    mongoDb = getMongoDb();

    // Create test user
    const userData = {
      name: 'Market Data Test User',
      phoneNumber: '+919876543222',
      email: 'marketdata@example.com',
      password: 'TestPass123!',
      userType: 'vendor',
      acceptTerms: true
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = response.body.token;
    userId = response.body.user.userId;

    // Insert some test market data
    await mongoDb.collection('market_data').insertMany([
      {
        category: 'food_beverages',
        subcategory: 'fruits',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra'
        },
        pricePoints: [{
          price: 100,
          quantity: 1,
          vendorReputation: 4.2,
          transactionVolume: 10,
          timeOfDay: '10:00',
          dayOfWeek: 'Monday',
          quality: 'standard',
          verified: true
        }],
        demandIndicators: [],
        seasonalFactors: [],
        competitorAnalysis: [],
        timestamp: new Date(),
        dataSource: 'test_data',
        reliability: 1.0
      },
      {
        category: 'electronics',
        subcategory: 'mobile',
        location: {
          city: 'Delhi',
          state: 'Delhi'
        },
        pricePoints: [{
          price: 15000,
          quantity: 1,
          vendorReputation: 4.5,
          transactionVolume: 5,
          timeOfDay: '14:00',
          dayOfWeek: 'Tuesday',
          quality: 'premium',
          verified: true
        }],
        demandIndicators: [],
        seasonalFactors: [],
        competitorAnalysis: [],
        timestamp: new Date(),
        dataSource: 'test_data',
        reliability: 1.0
      }
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    if (pool) {
      await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
    }
    if (mongoDb) {
      await mongoDb.collection('market_data').deleteMany({ dataSource: 'test_data' });
    }
  });

  describe('POST /api/market-data/collect', () => {
    it('should collect market data from transactions', async () => {
      const response = await request(app)
        .post('/api/market-data/collect')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Market data collection completed');
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.transactionsProcessed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/market-data/trends', () => {
    it('should get market trends for a category', async () => {
      const response = await request(app)
        .get('/api/market-data/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          category: 'food_beverages',
          timeRange: '1_month'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trend).toBeDefined();
      expect(response.body.trend.category).toBe('food_beverages');
      expect(response.body.trend.trend).toMatch(/^(bullish|bearish|stable)$/);
      expect(response.body.trend.prediction).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get trends for specific location', async () => {
      const response = await request(app)
        .get('/api/market-data/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          category: 'food_beverages',
          location: 'Mumbai',
          timeRange: '1_week'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trend.location).toBe('Mumbai');
    });

    it('should reject request without category', async () => {
      const response = await request(app)
        .get('/api/market-data/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          timeRange: '1_month'
        })
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('GET /api/market-data/price-recommendation', () => {
    it('should get price recommendation for a product', async () => {
      const response = await request(app)
        .get('/api/market-data/price-recommendation')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          category: 'food_beverages',
          basePrice: 120,
          location: 'Mumbai',
          vendorReputation: 4.0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendation).toBeDefined();
      expect(response.body.recommendation.suggestedPrice).toBeGreaterThan(0);
      expect(response.body.recommendation.priceRange).toBeDefined();
      expect(response.body.recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.recommendation.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(response.body.recommendation.reasoning)).toBe(true);
      expect(Array.isArray(response.body.recommendation.marketFactors)).toBe(true);
    });

    it('should handle subcategory in price recommendation', async () => {
      const response = await request(app)
        .get('/api/market-data/price-recommendation')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          category: 'food_beverages',
          subcategory: 'fruits',
          basePrice: 100,
          vendorReputation: 3.5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendation.competitorComparison).toBeDefined();
      expect(response.body.recommendation.demandForecast).toBeDefined();
    });

    it('should reject request with invalid base price', async () => {
      const response = await request(app)
        .get('/api/market-data/price-recommendation')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          category: 'food_beverages',
          basePrice: -10 // Invalid negative price
        })
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should reject request without required fields', async () => {
      const response = await request(app)
        .get('/api/market-data/price-recommendation')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          basePrice: 100
          // Missing category
        })
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('GET /api/market-data/insights', () => {
    it('should get market insights', async () => {
      const response = await request(app)
        .get('/api/market-data/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          limit: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insights)).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalInsights).toBeGreaterThanOrEqual(0);
    });

    it('should filter insights by category', async () => {
      const response = await request(app)
        .get('/api/market-data/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          category: 'food_beverages',
          limit: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insights)).toBe(true);
    });

    it('should filter insights by location', async () => {
      const response = await request(app)
        .get('/api/market-data/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          location: 'Mumbai',
          limit: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insights)).toBe(true);
    });
  });

  describe('GET /api/market-data/analytics', () => {
    it('should get market analytics dashboard data', async () => {
      const response = await request(app)
        .get('/api/market-data/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.totalMarkets).toBeGreaterThanOrEqual(0);
      expect(response.body.analytics.activeVendors).toBeGreaterThanOrEqual(0);
      expect(response.body.analytics.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.body.analytics.categoryBreakdown)).toBe(true);
      expect(Array.isArray(response.body.analytics.locationBreakdown)).toBe(true);
      expect(response.body.analytics.dataQuality).toBeDefined();
    });
  });
});