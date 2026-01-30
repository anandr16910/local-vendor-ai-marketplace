import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import { app } from '../index';
import { getPostgresPool } from '../config/database';

describe('Upload Endpoints', () => {
  let pool: any;
  let vendorAuthToken: string;
  let buyerAuthToken: string;
  let vendorUserId: string;
  let buyerUserId: string;
  let uploadedImageUrls: string[] = [];

  beforeAll(async () => {
    // Wait for database connections to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    pool = getPostgresPool();

    // Create test vendor user
    const vendorData = {
      name: 'Upload Test Vendor',
      phoneNumber: '+919876543230',
      email: 'uploadvendor@example.com',
      password: 'TestPass123!',
      userType: 'vendor',
      acceptTerms: true
    };

    const vendorResponse = await request(app)
      .post('/api/auth/register')
      .send(vendorData);

    vendorAuthToken = vendorResponse.body.token;
    vendorUserId = vendorResponse.body.user.userId;

    // Create test buyer user
    const buyerData = {
      name: 'Upload Test Buyer',
      phoneNumber: '+919876543231',
      email: 'uploadbuyer@example.com',
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
    // Clean up uploaded images
    for (const url of uploadedImageUrls) {
      try {
        const filename = path.basename(url);
        await request(app)
          .delete(`/api/upload/products/images/${filename}`)
          .set('Authorization', `Bearer ${vendorAuthToken}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Clean up test data
    if (pool) {
      await pool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [vendorUserId, buyerUserId]);
    }
  });

  describe('GET /api/upload/config', () => {
    it('should get upload configuration', async () => {
      const response = await request(app)
        .get('/api/upload/config')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.config).toMatchObject({
        maxFileSize: expect.any(Number),
        maxImagesPerProduct: expect.any(Number),
        allowedImageTypes: expect.any(Array),
        allowedDocumentTypes: expect.any(Array),
        supportedFormats: expect.any(Array),
        processedFormat: 'webp',
        maxDimensions: {
          width: 1200,
          height: 1200
        },
        thumbnailDimensions: {
          width: 300,
          height: 300
        }
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/upload/config')
        .expect(401);

      expect(response.body.error.message).toContain('No token provided');
    });
  });

  describe('POST /api/upload/products/image', () => {
    it('should upload a single image successfully', async () => {
      // Create a simple test image buffer (1x1 PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post('/api/upload/products/image')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .attach('image', testImageBuffer, 'test-image.png')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Image uploaded successfully');
      expect(response.body.image).toMatchObject({
        url: expect.stringMatching(/^http.*\/uploads\/products\/.*\.webp$/),
        thumbnailUrl: expect.stringMatching(/^http.*\/uploads\/products\/.*_thumb\.webp$/),
        filename: expect.stringMatching(/^[a-f0-9-]+\.webp$/),
        originalName: 'test-image.png',
        size: expect.any(Number),
        dimensions: {
          width: expect.any(Number),
          height: expect.any(Number)
        }
      });

      uploadedImageUrls.push(response.body.image.url);
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/upload/products/image')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(400);

      expect(response.body.error.message).toContain('No file uploaded');
    });

    it('should reject unsupported file type', async () => {
      const testTextBuffer = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/upload/products/image')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .attach('image', testTextBuffer, 'test.txt')
        .expect(400);

      expect(response.body.error.message).toContain('File type text/plain not allowed');
    });

    it('should require authentication', async () => {
      const testImageBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // Minimal PNG header

      const response = await request(app)
        .post('/api/upload/products/image')
        .attach('image', testImageBuffer, 'test.png')
        .expect(401);

      expect(response.body.error.message).toContain('No token provided');
    });
  });

  describe('POST /api/upload/products/images', () => {
    it('should upload multiple images successfully', async () => {
      // Create test image buffers
      const testImageBuffer1 = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const testImageBuffer2 = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02,
        0x08, 0x02, 0x00, 0x00, 0x00, 0xFD, 0xD5, 0x9A, 0x7A, 0x00, 0x00, 0x00,
        0x12, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x07, 0x00, 0xF8, 0xFF,
        0x00, 0xFF, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2,
        0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post('/api/upload/products/images')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .attach('images', testImageBuffer1, 'test-image-1.png')
        .attach('images', testImageBuffer2, 'test-image-2.png')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 images uploaded successfully');
      expect(response.body.images).toHaveLength(2);
      
      response.body.images.forEach((image: any) => {
        expect(image).toMatchObject({
          url: expect.stringMatching(/^http.*\/uploads\/products\/.*\.webp$/),
          thumbnailUrl: expect.stringMatching(/^http.*\/uploads\/products\/.*_thumb\.webp$/),
          filename: expect.stringMatching(/^[a-f0-9-]+\.webp$/),
          originalName: expect.stringMatching(/^test-image-[12]\.png$/),
          size: expect.any(Number),
          dimensions: {
            width: expect.any(Number),
            height: expect.any(Number)
          }
        });
        uploadedImageUrls.push(image.url);
      });
    });

    it('should reject upload without files', async () => {
      const response = await request(app)
        .post('/api/upload/products/images')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(400);

      expect(response.body.error.message).toContain('No files uploaded');
    });
  });

  describe('POST /api/upload/products/images/validate', () => {
    it('should validate image URLs', async () => {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const validUrls = [
        `${baseUrl}/uploads/products/test-image-1.webp`,
        `${baseUrl}/uploads/products/test-image-2.webp`
      ];
      const invalidUrls = [
        'http://external.com/image.jpg',
        'invalid-url',
        `${baseUrl}/uploads/documents/doc.pdf`
      ];

      const response = await request(app)
        .post('/api/upload/products/images/validate')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({ urls: [...validUrls, ...invalidUrls] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.validation).toMatchObject({
        valid: validUrls,
        invalid: invalidUrls,
        totalCount: 5,
        validCount: 2,
        invalidCount: 3
      });
    });

    it('should require URLs array', async () => {
      const response = await request(app)
        .post('/api/upload/products/images/validate')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toContain('Image URLs array is required');
    });
  });

  describe('DELETE /api/upload/products/images/:filename', () => {
    let testImageUrl: string;
    let testFilename: string;

    beforeEach(async () => {
      // Upload a test image first
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
        .attach('image', testImageBuffer, 'delete-test.png');

      testImageUrl = uploadResponse.body.image.url;
      testFilename = uploadResponse.body.image.filename;
    });

    it('should delete image successfully', async () => {
      const response = await request(app)
        .delete(`/api/upload/products/images/${testFilename}`)
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Image deleted successfully');
    });

    it('should reject invalid filename', async () => {
      const response = await request(app)
        .delete('/api/upload/products/images/invalid-filename')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(400);

      expect(response.body.error.message).toContain('Invalid filename format');
    });

    it('should require filename', async () => {
      const response = await request(app)
        .delete('/api/upload/products/images/')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/upload/products/images', () => {
    let testImageUrls: string[] = [];

    beforeEach(async () => {
      // Upload test images first
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
        .attach('images', testImageBuffer, 'bulk-delete-1.png')
        .attach('images', testImageBuffer, 'bulk-delete-2.png');

      testImageUrls = uploadResponse.body.images.map((img: any) => img.url);
    });

    it('should delete multiple images successfully', async () => {
      const response = await request(app)
        .delete('/api/upload/products/images')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({ urls: testImageUrls })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 images deleted successfully');
      expect(response.body.deletedCount).toBe(2);
    });

    it('should reject invalid URLs', async () => {
      const invalidUrls = ['http://external.com/image.jpg', 'invalid-url'];

      const response = await request(app)
        .delete('/api/upload/products/images')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({ urls: invalidUrls })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid image URLs');
    });

    it('should require URLs array', async () => {
      const response = await request(app)
        .delete('/api/upload/products/images')
        .set('Authorization', `Bearer ${vendorAuthToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toContain('Image URLs array is required');
    });
  });
});