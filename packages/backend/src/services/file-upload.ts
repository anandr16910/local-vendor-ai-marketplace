import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { FILE_UPLOAD } from '@local-vendor-ai/shared';

// Ensure upload directories exist
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const PRODUCT_IMAGES_DIR = path.join(UPLOAD_DIR, 'products');
const DOCUMENTS_DIR = path.join(UPLOAD_DIR, 'documents');

export async function ensureUploadDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(PRODUCT_IMAGES_DIR, { recursive: true });
    await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
    logger.info('Upload directories ensured');
  } catch (error) {
    logger.error('Failed to create upload directories:', error);
    throw error;
  }
}

// Configure multer for memory storage (we'll process and save manually)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImage = FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isDocument = FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);
  
  if (isImage || isDocument) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
    files: FILE_UPLOAD.MAX_IMAGES_PER_PRODUCT
  }
});

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
}

export interface ProcessedImage {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  dimensions: {
    width: number;
    height: number;
  };
  thumbnail?: {
    filename: string;
    path: string;
    url: string;
    size: number;
  };
}

export async function processAndSaveImage(
  file: Express.Multer.File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    width = 1200,
    height = 1200,
    quality = 85,
    format = 'webp',
    generateThumbnail = true
  } = options;

  const fileId = uuidv4();
  const filename = `${fileId}.${format}`;
  const filepath = path.join(PRODUCT_IMAGES_DIR, filename);
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const url = `${baseUrl}/uploads/products/${filename}`;

  try {
    // Process main image
    const processedImage = sharp(file.buffer)
      .resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .toFormat(format, { quality });

    const { data, info } = await processedImage.toBuffer({ resolveWithObject: true });
    await fs.writeFile(filepath, data);

    const result: ProcessedImage = {
      filename,
      originalName: file.originalname,
      path: filepath,
      url,
      size: info.size,
      mimetype: `image/${format}`,
      dimensions: {
        width: info.width,
        height: info.height
      }
    };

    // Generate thumbnail if requested
    if (generateThumbnail) {
      const thumbnailFilename = `${fileId}_thumb.${format}`;
      const thumbnailPath = path.join(PRODUCT_IMAGES_DIR, thumbnailFilename);
      const thumbnailUrl = `${baseUrl}/uploads/products/${thumbnailFilename}`;

      const thumbnailImage = sharp(file.buffer)
        .resize(300, 300, { 
          fit: 'cover',
          position: 'center'
        })
        .toFormat(format, { quality: 75 });

      const { data: thumbData, info: thumbInfo } = await thumbnailImage.toBuffer({ resolveWithObject: true });
      await fs.writeFile(thumbnailPath, thumbData);

      result.thumbnail = {
        filename: thumbnailFilename,
        path: thumbnailPath,
        url: thumbnailUrl,
        size: thumbInfo.size
      };
    }

    logger.info('Image processed successfully', {
      originalName: file.originalname,
      filename,
      size: info.size,
      dimensions: `${info.width}x${info.height}`
    });

    return result;
  } catch (error) {
    logger.error('Failed to process image:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

export async function processMultipleImages(
  files: Express.Multer.File[],
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  
  for (const file of files) {
    try {
      const processed = await processAndSaveImage(file, options);
      results.push(processed);
    } catch (error) {
      logger.error(`Failed to process image ${file.originalname}:`, error);
      // Continue processing other images
    }
  }
  
  return results;
}

export async function deleteImage(filename: string): Promise<void> {
  try {
    const filepath = path.join(PRODUCT_IMAGES_DIR, filename);
    await fs.unlink(filepath);
    
    // Also delete thumbnail if it exists
    const thumbnailFilename = filename.replace(/\.(\w+)$/, '_thumb.$1');
    const thumbnailPath = path.join(PRODUCT_IMAGES_DIR, thumbnailFilename);
    
    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      // Thumbnail might not exist, ignore error
    }
    
    logger.info('Image deleted successfully', { filename });
  } catch (error) {
    logger.error('Failed to delete image:', error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
}

export async function deleteMultipleImages(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    try {
      await deleteImage(filename);
    } catch (error) {
      logger.error(`Failed to delete image ${filename}:`, error);
      // Continue deleting other images
    }
  }
}

// Utility function to extract filename from URL
export function extractFilenameFromUrl(url: string): string {
  return path.basename(url);
}

// Utility function to validate image URLs
export function validateImageUrls(urls: string[]): { valid: string[]; invalid: string[] } {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const validPrefix = `${baseUrl}/uploads/products/`;
  
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const url of urls) {
    if (url.startsWith(validPrefix) && url.length > validPrefix.length) {
      valid.push(url);
    } else {
      invalid.push(url);
    }
  }
  
  return { valid, invalid };
}

// Clean up orphaned images (images not referenced by any product)
export async function cleanupOrphanedImages(): Promise<void> {
  try {
    const { getPostgresPool } = await import('../config/database');
    const pool = getPostgresPool();
    
    // Get all image URLs from products
    const result = await pool.query(`
      SELECT DISTINCT unnest(images) as image_url 
      FROM products 
      WHERE images IS NOT NULL AND array_length(images, 1) > 0
    `);
    
    const referencedUrls = new Set(result.rows.map(row => row.image_url));
    
    // Get all files in the upload directory
    const files = await fs.readdir(PRODUCT_IMAGES_DIR);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    let deletedCount = 0;
    
    for (const file of files) {
      const fileUrl = `${baseUrl}/uploads/products/${file}`;
      
      // Skip thumbnails (they'll be deleted with their main images)
      if (file.includes('_thumb.')) {
        continue;
      }
      
      if (!referencedUrls.has(fileUrl)) {
        await deleteImage(file);
        deletedCount++;
      }
    }
    
    logger.info(`Cleanup completed: ${deletedCount} orphaned images deleted`);
  } catch (error) {
    logger.error('Failed to cleanup orphaned images:', error);
  }
}