import request from 'supertest';
import { app } from '../index';
import { getPostgresPool } from '../config/database';

describe('Product Endpoints', () => {
  let pool: any;
  let vendorAuthToken: string;
  let buyerAuthToken: string;
  let vendorUserId: string;
  let buyerUserId: string;
  let productId: string;

  beforeAll(async () => {
    // Wait for database connections to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    pool = getPostgresPool();

    // Create test vendor user
    const vendorData = {
      name: 'Product Test Vendor',
      phoneNumber: '+919876543220',
      email: 'productvendor@example.com',
      password: 'TestPass123!',
      userType: 'vendor',
      acceptTerms: true
    };

    const vendorResponse = await request(app)
      .post('/api/auth/register')
      .send(vendorData);

    vendorAuthToken = vendorResponse.body.token;
    vendorUserId = vendorResponse.body.user.userId;

    // Create vendor profile
    const profileData = {
      businessInfo: {
        businessName: 'Product Test Business',
        businessType: 'individual',
        establishedYear: 2020,
        description: 'A test business for product testing',
        categories: ['food_beverages'],
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
          primaryPhone: '+919876543220'
        }
      },
      specializations: ['organic_food'],
      serviceRadius: 15,
      preferredPaymentMethods: ['UPI', 'CASH'],
      deliveryOptions: ['pickup', 'delivery']
    };

    await request(app)
      .post('/api/vendors/profile')
      .set('Authorization', `Bearer ${vendorAuthToken}`)
      .send(profileData);

    // Create test buyer user
    const buyerData = {
      name: 'Product Test Buyer',
      phoneNumber: '+919876543221',
      email: 'productbuyer@example.com',
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
      await pool.query('DELETE FROM products WHERE vendor_id IN ($1, $2)', [vendorUserId, buyerUserId]);
      await pool.query('DELETE FROM vendor_profiles WHERE vendor_id IN ($1, $2)', [vendorUserId, buyerUserId]);
      await pool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [vendorUserId, buyerUserId]);
    }
  });

  describe('POST /api/products', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'Organic Apples',
        description: 'Fresh organic apples from local farm',
        category: 'food_beverages',
        subcategory: 'fruits',
        basePrice: 120.50,
        availability: {
          inStock: true,
          quantity: 100,
          unit: 'kg',
          customOrderAvailable: true,
          leadTime: 2
        },
        specifications: [
          {
            attribute: 'Origin',
            value: 'Kashmir',
            isNegotiable: false
          },
          {
            attribute: 'Organic Certified',
            value: 'Yes',
            isNegotiable: false
          }
        ],
        tags: ['organic', 'fresh', 'local', 'apples']
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.product).toMatchObject({
        name: productData.name,
        category: productData.category,
        basePrice: productData.basePrice
      });
      expect(response.body.product.productId).toBeDefined();

      productId = response.body.product.productId;
    });

    it('should reject product creation by non-vendor user', async () => {
      const productData = {
        name: 'Test Product',
        category: 'food_beverages',
        basePrice: 100,
        availability: {
          inStock: true,
          customOrderAvailable: false
        }
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.error.message).toContain('Insufficient permissions');
    });

    it('should reject product with invalid data', async () => {
      const invalidProductData = {
        name: 'A', // Too short
        category: 'invalid_category',
        basePrice: -10, // Negative price
        availability: {
          inStock: 'yes', // Should be boolean
          customOrderAvailable: false
        }
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(invalidProductData)
        .expect(400);

      expect(response.body.error.message).toContain('Validation failed');
    });
  });

  describe('GET /api/products', () => {
    it('should get products with search', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .query({
          query: 'Organic',
          category: 'food_beverages',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.totalCount).toBeGreaterThanOrEqual(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .query({
          minPrice: 100,
          maxPrice: 200,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should get vendor-specific products', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .query({
          vendorId: vendorUserId,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('GET /api/products/:productId', () => {
    it('should get single product details', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.product).toMatchObject({
        productId: productId,
        name: 'Organic Apples',
        category: 'food_beverages'
      });
      expect(response.body.product.vendor).toBeDefined();
      expect(response.body.canEdit).toBe(false);
    });

    it('should show edit permissions for product owner', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.canEdit).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeProductId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/products/${fakeProductId}`)
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .expect(404);

      expect(response.body.error.message).toContain('Product not found');
    });
  });

  describe('PUT /api/products/:productId', () => {
    it('should update product successfully', async () => {
      const updateData = {
        name: 'Premium Organic Apples',
        description: 'Premium quality organic apples from Kashmir valley',
        basePrice: 150.00,
        tags: ['organic', 'premium', 'kashmir', 'apples']
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe('Premium Organic Apples');
      expect(response.body.product.basePrice).toBe(150.00);
      expect(response.body.changesApplied).toEqual(Object.keys(updateData));
    });

    it('should reject update by non-owner', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error.message).toContain('You can only update your own products');
    });

    it('should reject update with no fields', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toContain('No valid fields to update');
    });
  });

  describe('GET /api/products/categories/list', () => {
    it('should get product categories with statistics', async () => {
      const response = await request(app)
        .get('/api/products/categories/list')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });

  describe('POST /api/products/bulk', () => {
    it('should validate bulk products without creating them', async () => {
      const bulkData = {
        validateOnly: true,
        products: [
          {
            name: 'Bulk Product 1',
            category: 'food_beverages',
            basePrice: 50,
            availability: {
              inStock: true,
              customOrderAvailable: false
            }
          },
          {
            name: 'Invalid Product',
            category: 'invalid_category', // Invalid category
            basePrice: -10, // Invalid price
            availability: {
              inStock: true,
              customOrderAvailable: false
            }
          }
        ]
      };

      const response = await request(app)
        .post('/api/products/bulk')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Validation completed');
      expect(response.body.summary.total).toBe(2);
      expect(response.body.summary.valid).toBe(1);
      expect(response.body.summary.invalid).toBe(1);
    });

    it('should reject bulk upload by non-vendor', async () => {
      const bulkData = {
        products: [
          {
            name: 'Test Product',
            category: 'food_beverages',
            basePrice: 50,
            availability: {
              inStock: true,
              customOrderAvailable: false
            }
          }
        ]
      };

      const response = await request(app)
        .post('/api/products/bulk')
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .send(bulkData)
        .expect(403);

      expect(response.body.error.message).toContain('Insufficient permissions');
    });
  });

  describe('Product with Image Integration', () => {
    it('should create product with uploaded images', async () => {
      // First upload images
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const uploadResponse = await request(app)
        .post('/api/upload/products/images')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .attach('images', testImageBuffer, 'product-image-1.png')
        .attach('images', testImageBuffer, 'product-image-2.png')
        .expect(201);

      const imageUrls = uploadResponse.body.images.map((img: any) => img.url);
      uploadedImageUrls.push(...imageUrls);

      // Then create product with uploaded images
      const productData = {
        name: 'Product with Images',
        description: 'A product with uploaded images',
        category: 'food_beverages',
        subcategory: 'fruits',
        basePrice: 200.00,
        availability: {
          inStock: true,
          quantity: 50,
          unit: 'kg',
          customOrderAvailable: true,
          leadTime: 3
        },
        images: imageUrls,
        specifications: [
          {
            attribute: 'Quality',
            value: 'Premium',
            isNegotiable: false
          }
        ],
        tags: ['premium', 'fresh', 'organic']
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.product).toMatchObject({
        name: productData.name,
        category: productData.category,
        basePrice: productData.basePrice
      });

      // Verify product has images
      const productId = response.body.product.productId;
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .expect(200);

      expect(getResponse.body.product.images).toHaveLength(2);
      expect(getResponse.body.product.images).toEqual(imageUrls);

      // Clean up
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`);
    });

    it('should update product images', async () => {
      // Create a product first
      const productData = {
        name: 'Product for Image Update',
        category: 'food_beverages',
        basePrice: 100,
        availability: {
          inStock: true,
          customOrderAvailable: false
        }
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(productData);

      const productId = createResponse.body.product.productId;

      // Upload new images
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const uploadResponse = await request(app)
        .post('/api/upload/products/image')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .attach('image', testImageBuffer, 'update-image.png')
        .expect(201);

      const imageUrl = uploadResponse.body.image.url;
      uploadedImageUrls.push(imageUrl);

      // Update product images
      const updateResponse = await request(app)
        .put(`/api/products/${productId}/images`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({ images: [imageUrl] })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.product.images).toEqual([imageUrl]);

      // Verify the update
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .expect(200);

      expect(getResponse.body.product.images).toEqual([imageUrl]);

      // Clean up
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`);
    });

    it('should reject invalid image URLs when updating product', async () => {
      // Create a product first
      const productData = {
        name: 'Product for Invalid Image Test',
        category: 'food_beverages',
        basePrice: 100,
        availability: {
          inStock: true,
          customOrderAvailable: false
        }
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(productData);

      const productId = createResponse.body.product.productId;

      // Try to update with invalid image URLs
      const invalidImageUrls = [
        'http://external.com/image.jpg',
        'invalid-url'
      ];

      const response = await request(app)
        .put(`/api/products/${productId}/images`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({ images: invalidImageUrls })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid image URL');

      // Clean up
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`);
    });
  });

  describe('DELETE /api/products/:productId', () => {
    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Product deleted successfully');
    });

    it('should reject delete by non-owner', async () => {
      // Create another product first
      const productData = {
        name: 'Another Test Product',
        category: 'food_beverages',
        basePrice: 100,
        availability: {
          inStock: true,
          customOrderAvailable: false
        }
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send(productData);

      const newProductId = createResponse.body.product.productId;

      const response = await request(app)
        .delete(`/api/products/${newProductId}`)
        .set('Authorization', `Bearer ${buyerAuthToken}`)
        .expect(403);

      expect(response.body.error.message).toContain('You can only delete your own products');

      // Clean up
      await request(app)
        .delete(`/api/products/${newProductId}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`);
    });
  });
});