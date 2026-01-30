import { 
  processAndSaveImage, 
  processMultipleImages, 
  deleteImage, 
  deleteMultipleImages,
  extractFilenameFromUrl,
  validateImageUrls,
  cleanupOrphanedImages
} from '../services/file-upload';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('sharp');
jest.mock('../utils/logger');
jest.mock('../config/database');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('File Upload Service', () => {
  const mockImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE
  ]);

  const mockFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test-image.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: mockImageBuffer.length,
    buffer: mockImageBuffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_URL = 'http://localhost:3001';
    process.env.UPLOAD_DIR = './uploads';
  });

  describe('processAndSaveImage', () => {
    it('should process and save image with default options', async () => {
      // Mock sharp
      const mockSharp = require('sharp');
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('processed-image-data'),
          info: { size: 1024, width: 800, height: 600 }
        })
      };
      mockSharp.mockReturnValue(mockSharpInstance);

      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await processAndSaveImage(mockFile);

      expect(result).toMatchObject({
        originalName: 'test-image.png',
        size: 1024,
        mimetype: 'image/webp',
        dimensions: {
          width: 800,
          height: 600
        }
      });

      expect(result.filename).toMatch(/^[a-f0-9-]+\.webp$/);
      expect(result.url).toMatch(/^http:\/\/localhost:3001\/uploads\/products\/[a-f0-9-]+\.webp$/);
      expect(result.thumbnail).toBeDefined();
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2); // Main image + thumbnail
    });

    it('should process image with custom options', async () => {
      const mockSharp = require('sharp');
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('processed-image-data'),
          info: { size: 2048, width: 1000, height: 1000 }
        })
      };
      mockSharp.mockReturnValue(mockSharpInstance);

      mockFs.writeFile.mockResolvedValue(undefined);

      const options = {
        width: 1000,
        height: 1000,
        quality: 90,
        format: 'jpeg' as const,
        generateThumbnail: false
      };

      const result = await processAndSaveImage(mockFile, options);

      expect(result.mimetype).toBe('image/jpeg');
      expect(result.thumbnail).toBeUndefined();
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(1000, 1000, {
        fit: 'inside',
        withoutEnlargement: true
      });
      expect(mockSharpInstance.toFormat).toHaveBeenCalledWith('jpeg', { quality: 90 });
    });

    it('should handle processing errors', async () => {
      const mockSharp = require('sharp');
      mockSharp.mockImplementation(() => {
        throw new Error('Sharp processing failed');
      });

      await expect(processAndSaveImage(mockFile)).rejects.toThrow('Image processing failed: Sharp processing failed');
    });
  });

  describe('processMultipleImages', () => {
    it('should process multiple images successfully', async () => {
      const mockSharp = require('sharp');
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('processed-image-data'),
          info: { size: 1024, width: 800, height: 600 }
        })
      };
      mockSharp.mockReturnValue(mockSharpInstance);

      mockFs.writeFile.mockResolvedValue(undefined);

      const files = [mockFile, { ...mockFile, originalname: 'test-image-2.png' }];
      const results = await processMultipleImages(files);

      expect(results).toHaveLength(2);
      expect(results[0].originalName).toBe('test-image.png');
      expect(results[1].originalName).toBe('test-image-2.png');
    });

    it('should continue processing other images if one fails', async () => {
      const mockSharp = require('sharp');
      let callCount = 0;
      mockSharp.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First image failed');
        }
        return {
          resize: jest.fn().mockReturnThis(),
          toFormat: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue({
            data: Buffer.from('processed-image-data'),
            info: { size: 1024, width: 800, height: 600 }
          })
        };
      });

      mockFs.writeFile.mockResolvedValue(undefined);

      const files = [mockFile, { ...mockFile, originalname: 'test-image-2.png' }];
      const results = await processMultipleImages(files);

      expect(results).toHaveLength(1);
      expect(results[0].originalName).toBe('test-image-2.png');
    });
  });

  describe('deleteImage', () => {
    it('should delete image and thumbnail', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      await deleteImage('test-image.webp');

      expect(mockFs.unlink).toHaveBeenCalledTimes(2);
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('test-image.webp')
      );
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('test-image_thumb.webp')
      );
    });

    it('should handle deletion errors gracefully', async () => {
      mockFs.unlink.mockRejectedValue(new Error('File not found'));

      await expect(deleteImage('non-existent.webp')).rejects.toThrow('Image deletion failed: File not found');
    });

    it('should continue if thumbnail deletion fails', async () => {
      mockFs.unlink
        .mockResolvedValueOnce(undefined) // Main image deletion succeeds
        .mockRejectedValueOnce(new Error('Thumbnail not found')); // Thumbnail deletion fails

      await expect(deleteImage('test-image.webp')).resolves.toBeUndefined();
      expect(mockFs.unlink).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteMultipleImages', () => {
    it('should delete multiple images', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      const filenames = ['image1.webp', 'image2.webp'];
      await deleteMultipleImages(filenames);

      expect(mockFs.unlink).toHaveBeenCalledTimes(4); // 2 images + 2 thumbnails
    });

    it('should continue deleting other images if one fails', async () => {
      mockFs.unlink
        .mockRejectedValueOnce(new Error('First image failed'))
        .mockRejectedValueOnce(new Error('First thumbnail failed'))
        .mockResolvedValueOnce(undefined) // Second image succeeds
        .mockResolvedValueOnce(undefined); // Second thumbnail succeeds

      const filenames = ['image1.webp', 'image2.webp'];
      await expect(deleteMultipleImages(filenames)).resolves.toBeUndefined();
      expect(mockFs.unlink).toHaveBeenCalledTimes(4);
    });
  });

  describe('extractFilenameFromUrl', () => {
    it('should extract filename from URL', () => {
      const url = 'http://localhost:3001/uploads/products/test-image.webp';
      const filename = extractFilenameFromUrl(url);
      expect(filename).toBe('test-image.webp');
    });

    it('should handle URLs with query parameters', () => {
      const url = 'http://localhost:3001/uploads/products/test-image.webp?v=123';
      const filename = extractFilenameFromUrl(url);
      expect(filename).toBe('test-image.webp?v=123');
    });
  });

  describe('validateImageUrls', () => {
    it('should validate image URLs correctly', () => {
      const baseUrl = 'http://localhost:3001';
      const validUrls = [
        `${baseUrl}/uploads/products/image1.webp`,
        `${baseUrl}/uploads/products/image2.jpg`
      ];
      const invalidUrls = [
        'http://external.com/image.jpg',
        'invalid-url',
        `${baseUrl}/uploads/documents/doc.pdf`
      ];

      const result = validateImageUrls([...validUrls, ...invalidUrls]);

      expect(result.valid).toEqual(validUrls);
      expect(result.invalid).toEqual(invalidUrls);
    });

    it('should handle empty URLs array', () => {
      const result = validateImageUrls([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });
  });

  describe('cleanupOrphanedImages', () => {
    it('should clean up orphaned images', async () => {
      // Mock database
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { image_url: 'http://localhost:3001/uploads/products/used-image.webp' }
          ]
        })
      };

      const mockGetPostgresPool = jest.fn().mockReturnValue(mockPool);
      jest.doMock('../config/database', () => ({
        getPostgresPool: mockGetPostgresPool
      }));

      // Mock file system
      mockFs.readdir.mockResolvedValue([
        'used-image.webp',
        'used-image_thumb.webp',
        'orphaned-image.webp',
        'orphaned-image_thumb.webp'
      ] as any);

      mockFs.unlink.mockResolvedValue(undefined);

      await cleanupOrphanedImages();

      expect(mockFs.unlink).toHaveBeenCalledTimes(2); // Only orphaned image and its thumbnail
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('orphaned-image.webp')
      );
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('orphaned-image_thumb.webp')
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockPool = {
        query: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      const mockGetPostgresPool = jest.fn().mockReturnValue(mockPool);
      jest.doMock('../config/database', () => ({
        getPostgresPool: mockGetPostgresPool
      }));

      await expect(cleanupOrphanedImages()).resolves.toBeUndefined();
    });
  });
});