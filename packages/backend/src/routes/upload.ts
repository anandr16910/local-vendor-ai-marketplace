import express from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { 
  upload, 
  processMultipleImages, 
  deleteImage, 
  deleteMultipleImages,
  extractFilenameFromUrl,
  validateImageUrls,
  ensureUploadDirectories
} from '../services/file-upload';
import { logger } from '../utils/logger';
import { FILE_UPLOAD } from '@local-vendor-ai/shared';

const router = express.Router();

// Ensure upload directories exist on startup
ensureUploadDirectories().catch(error => {
  logger.error('Failed to ensure upload directories:', error);
});

// Upload product images
router.post('/products/images', requireAuth, upload.array('images', FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT), 
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw createError('No files uploaded', 400);
    }

    if (files.length > FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT) {
      throw createError(`Maximum ${FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT} images allowed`, 400);
    }

    // Validate file types
    for (const file of files) {
      if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw createError(`File type ${file.mimetype} not allowed`, 400);
      }
    }

    try {
      const processedImages = await processMultipleImages(files, {
        width: 1200,
        height: 1200,
        quality: 85,
        format: 'webp',
        generateThumbnail: true
      });

      logger.info('Images uploaded successfully', {
        userId: req.user!.userId,
        imageCount: processedImages.length,
        totalSize: processedImages.reduce((sum, img) => sum + img.size, 0)
      });

      res.status(201).json({
        success: true,
        message: `${processedImages.length} images uploaded successfully`,
        images: processedImages.map(img => ({
          url: img.url,
          thumbnailUrl: img.thumbnail?.url,
          filename: img.filename,
          originalName: img.originalName,
          size: img.size,
          dimensions: img.dimensions
        }))
      });
    } catch (error) {
      logger.error('Image upload failed:', error);
      throw createError(`Image upload failed: ${error.message}`, 500);
    }
  })
);

// Upload single product image
router.post('/products/image', requireAuth, upload.single('image'), 
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const file = req.file;
    
    if (!file) {
      throw createError('No file uploaded', 400);
    }

    if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw createError(`File type ${file.mimetype} not allowed`, 400);
    }

    try {
      const processedImage = await processMultipleImages([file], {
        width: 1200,
        height: 1200,
        quality: 85,
        format: 'webp',
        generateThumbnail: true
      });

      const image = processedImage[0];

      logger.info('Image uploaded successfully', {
        userId: req.user!.userId,
        filename: image.filename,
        size: image.size
      });

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        image: {
          url: image.url,
          thumbnailUrl: image.thumbnail?.url,
          filename: image.filename,
          originalName: image.originalName,
          size: image.size,
          dimensions: image.dimensions
        }
      });
    } catch (error) {
      logger.error('Image upload failed:', error);
      throw createError(`Image upload failed: ${error.message}`, 500);
    }
  })
);

// Delete product image
router.delete('/products/images/:filename', requireAuth, 
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { filename } = req.params;
    
    if (!filename) {
      throw createError('Filename is required', 400);
    }

    // Validate filename format (basic security check)
    if (!/^[a-f0-9-]+\.(webp|jpg|jpeg|png)$/i.test(filename)) {
      throw createError('Invalid filename format', 400);
    }

    try {
      await deleteImage(filename);

      logger.info('Image deleted successfully', {
        userId: req.user!.userId,
        filename
      });

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      logger.error('Image deletion failed:', error);
      throw createError(`Image deletion failed: ${error.message}`, 500);
    }
  })
);

// Delete multiple product images
router.delete('/products/images', requireAuth, 
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw createError('Image URLs array is required', 400);
    }

    const { valid, invalid } = validateImageUrls(urls);
    
    if (invalid.length > 0) {
      throw createError(`Invalid image URLs: ${invalid.join(', ')}`, 400);
    }

    try {
      const filenames = valid.map(extractFilenameFromUrl);
      await deleteMultipleImages(filenames);

      logger.info('Images deleted successfully', {
        userId: req.user!.userId,
        imageCount: filenames.length,
        filenames
      });

      res.json({
        success: true,
        message: `${filenames.length} images deleted successfully`,
        deletedCount: filenames.length
      });
    } catch (error) {
      logger.error('Images deletion failed:', error);
      throw createError(`Images deletion failed: ${error.message}`, 500);
    }
  })
);

// Validate image URLs (utility endpoint)
router.post('/products/images/validate', requireAuth, 
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls)) {
      throw createError('Image URLs array is required', 400);
    }

    const { valid, invalid } = validateImageUrls(urls);

    res.json({
      success: true,
      validation: {
        valid,
        invalid,
        totalCount: urls.length,
        validCount: valid.length,
        invalidCount: invalid.length
      }
    });
  })
);

// Get upload configuration (for frontend)
router.get('/config', requireAuth, 
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    res.json({
      success: true,
      config: {
        maxFileSize: FILE_UPLOAD.MAX_SIZE,
        maxImagesPerProduct: FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT,
        allowedImageTypes: FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
        allowedDocumentTypes: FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES,
        supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
        processedFormat: 'webp',
        maxDimensions: {
          width: 1200,
          height: 1200
        },
        thumbnailDimensions: {
          width: 300,
          height: 300
        }
      }
    });
  })
);

export default router;