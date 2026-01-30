import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { getPostgresPool } from '../config/database';
import { logger } from '../utils/logger';
import { 
  validateProductCreation, 
  validateProductUpdate,
  validateProductSearch,
  validateProductSpecifications,
  validatePriceRange
} from '@local-vendor-ai/shared';

const router = express.Router();

// Create product (vendors only)
router.post('/', requireRole(['vendor']), [
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('description').optional().isLength({ max: 2000 }),
  body('category').notEmpty(),
  body('basePrice').isFloat({ min: 0.01 }),
  body('availability.inStock').isBoolean(),
  body('availability.customOrderAvailable').isBoolean(),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const {
    name,
    description,
    category,
    subcategory,
    images = [],
    specifications = [],
    basePrice,
    availability,
    tags = []
  } = req.body;

  const pool = getPostgresPool();

  // Validate product data
  const { error: validationError } = validateProductCreation(req.body);
  if (validationError) {
    throw createError(`Validation failed: ${validationError.details.map(d => d.message).join(', ')}`, 400);
  }

  // Validate price range for category
  const { warnings } = validatePriceRange(basePrice, category);
  
  // Create product
  const result = await pool.query(
    `INSERT INTO products (
      vendor_id, name, description, category, subcategory, images, 
      specifications, base_price, availability, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING product_id, name, category, base_price, created_at`,
    [
      req.user!.userId,
      name,
      description || null,
      category,
      subcategory || null,
      images,
      JSON.stringify(specifications),
      basePrice,
      JSON.stringify(availability),
      tags
    ]
  );

  const product = result.rows[0];

  logger.info('Product created successfully', {
    productId: product.product_id,
    vendorId: req.user!.userId,
    name: product.name,
    category: product.category,
    basePrice: product.base_price
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product: {
      productId: product.product_id,
      name: product.name,
      category: product.category,
      basePrice: product.base_price,
      createdAt: product.created_at
    },
    warnings: warnings.length > 0 ? warnings : undefined
  });
}));

// Get products with search and filtering
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const {
    query: searchQuery,
    category,
    subcategory,
    minPrice,
    maxPrice,
    availability = 'all',
    vendorRating,
    tags,
    sortBy = 'relevance',
    limit = 20,
    offset = 0,
    vendorId
  } = req.query;

  const pool = getPostgresPool();

  // Build search query
  let sqlQuery = `
    SELECT 
      p.product_id,
      p.vendor_id,
      p.name,
      p.description,
      p.category,
      p.subcategory,
      p.images,
      p.specifications,
      p.base_price,
      p.availability,
      p.tags,
      p.created_at,
      p.updated_at,
      u.name as vendor_name,
      vp.reputation->>'overall' as vendor_rating,
      u.location as vendor_location
    FROM products p
    JOIN users u ON p.vendor_id = u.user_id
    LEFT JOIN vendor_profiles vp ON p.vendor_id = vp.vendor_id
    WHERE 1=1
  `;

  const queryParams: any[] = [];
  let paramCount = 1;

  // Add search filters
  if (searchQuery) {
    sqlQuery += ` AND (
      p.search_vector @@ plainto_tsquery('english', $${paramCount}) OR
      p.name ILIKE $${paramCount + 1} OR
      p.description ILIKE $${paramCount + 1}
    )`;
    queryParams.push(searchQuery, `%${searchQuery}%`);
    paramCount += 2;
  }

  if (category) {
    sqlQuery += ` AND p.category = $${paramCount}`;
    queryParams.push(category);
    paramCount++;
  }

  if (subcategory) {
    sqlQuery += ` AND p.subcategory = $${paramCount}`;
    queryParams.push(subcategory);
    paramCount++;
  }

  if (vendorId) {
    sqlQuery += ` AND p.vendor_id = $${paramCount}`;
    queryParams.push(vendorId);
    paramCount++;
  }

  if (minPrice) {
    sqlQuery += ` AND p.base_price >= $${paramCount}`;
    queryParams.push(parseFloat(minPrice as string));
    paramCount++;
  }

  if (maxPrice) {
    sqlQuery += ` AND p.base_price <= $${paramCount}`;
    queryParams.push(parseFloat(maxPrice as string));
    paramCount++;
  }

  if (availability !== 'all') {
    if (availability === 'in_stock') {
      sqlQuery += ` AND (p.availability->>'inStock')::boolean = true`;
    } else if (availability === 'custom_order') {
      sqlQuery += ` AND (p.availability->>'customOrderAvailable')::boolean = true`;
    }
  }

  if (vendorRating) {
    sqlQuery += ` AND (vp.reputation->>'overall')::float >= $${paramCount}`;
    queryParams.push(parseFloat(vendorRating as string));
    paramCount++;
  }

  if (tags && Array.isArray(tags)) {
    sqlQuery += ` AND p.tags && $${paramCount}`;
    queryParams.push(tags);
    paramCount++;
  }

  // Add sorting
  switch (sortBy) {
    case 'price_low':
      sqlQuery += ` ORDER BY p.base_price ASC`;
      break;
    case 'price_high':
      sqlQuery += ` ORDER BY p.base_price DESC`;
      break;
    case 'rating':
      sqlQuery += ` ORDER BY (vp.reputation->>'overall')::float DESC NULLS LAST`;
      break;
    case 'newest':
      sqlQuery += ` ORDER BY p.created_at DESC`;
      break;
    default:
      if (searchQuery) {
        sqlQuery += ` ORDER BY ts_rank(p.search_vector, plainto_tsquery('english', $${queryParams.length + 1})) DESC`;
        queryParams.push(searchQuery);
        paramCount++;
      } else {
        sqlQuery += ` ORDER BY p.created_at DESC`;
      }
  }

  // Add pagination
  sqlQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  queryParams.push(parseInt(limit as string), parseInt(offset as string));

  const result = await pool.query(sqlQuery, queryParams);

  // Get total count for pagination
  const countQuery = sqlQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
  const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
  const totalCount = parseInt(countResult.rows[0].count);

  // Format products
  const products = result.rows.map(row => ({
    productId: row.product_id,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorRating: parseFloat(row.vendor_rating || '0'),
    name: row.name,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    basePrice: parseFloat(row.base_price),
    images: row.images || [],
    availability: row.availability,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));

  res.json({
    success: true,
    products,
    totalCount,
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: (parseInt(offset as string) + parseInt(limit as string)) < totalCount
    }
  });
}));

// Get single product by ID
router.get('/:productId', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { productId } = req.params;
  const pool = getPostgresPool();

  const result = await pool.query(`
    SELECT 
      p.*,
      u.name as vendor_name,
      u.phone_number as vendor_phone,
      u.email as vendor_email,
      u.location as vendor_location,
      vp.reputation,
      vp.verification_status,
      vp.business_info,
      vp.specializations
    FROM products p
    JOIN users u ON p.vendor_id = u.user_id
    LEFT JOIN vendor_profiles vp ON p.vendor_id = vp.vendor_id
    WHERE p.product_id = $1
  `, [productId]);

  if (result.rows.length === 0) {
    throw createError('Product not found', 404);
  }

  const product = result.rows[0];
  const isOwner = product.vendor_id === req.user!.userId;

  res.json({
    success: true,
    product: {
      productId: product.product_id,
      vendorId: product.vendor_id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      images: product.images || [],
      specifications: product.specifications || [],
      basePrice: parseFloat(product.base_price),
      availability: product.availability,
      tags: product.tags || [],
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      vendor: {
        name: product.vendor_name,
        reputation: product.reputation,
        verificationStatus: product.verification_status,
        businessInfo: product.business_info,
        specializations: product.specializations || [],
        // Only show contact info if user is authenticated and not the owner
        contactInfo: isOwner ? {
          phone: product.vendor_phone,
          email: product.vendor_email,
          location: product.vendor_location
        } : undefined
      }
    },
    canEdit: isOwner
  });
}));

// Update product (owner only)
router.put('/:productId', requireRole(['vendor']), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { productId } = req.params;
  const pool = getPostgresPool();

  // Check if product exists and user is owner
  const existingProduct = await pool.query(
    'SELECT vendor_id FROM products WHERE product_id = $1',
    [productId]
  );

  if (existingProduct.rows.length === 0) {
    throw createError('Product not found', 404);
  }

  if (existingProduct.rows[0].vendor_id !== req.user!.userId) {
    throw createError('You can only update your own products', 403);
  }

  // Validate update data
  const { error: validationError } = validateProductUpdate(req.body);
  if (validationError) {
    throw createError(`Validation failed: ${validationError.details.map(d => d.message).join(', ')}`, 400);
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const allowedFields = ['name', 'description', 'category', 'subcategory', 'images', 'specifications', 'basePrice', 'availability', 'tags'];
  
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      const dbField = field === 'basePrice' ? 'base_price' : field;
      updates.push(`${dbField} = $${paramCount}`);
      
      if (field === 'specifications' || field === 'availability') {
        values.push(JSON.stringify(req.body[field]));
      } else {
        values.push(req.body[field]);
      }
      paramCount++;
    }
  }

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updates.push(`updated_at = NOW()`);
  values.push(productId);

  const query = `
    UPDATE products 
    SET ${updates.join(', ')}
    WHERE product_id = $${paramCount}
    RETURNING product_id, name, category, base_price, updated_at
  `;

  const result = await pool.query(query, values);
  const updatedProduct = result.rows[0];

  logger.info('Product updated successfully', {
    productId: updatedProduct.product_id,
    vendorId: req.user!.userId,
    updatedFields: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: 'Product updated successfully',
    product: {
      productId: updatedProduct.product_id,
      name: updatedProduct.name,
      category: updatedProduct.category,
      basePrice: parseFloat(updatedProduct.base_price),
      updatedAt: updatedProduct.updated_at
    },
    changesApplied: Object.keys(req.body)
  });
}));

// Update product images
router.put('/:productId/images', requireRole(['vendor']), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { productId } = req.params;
  const { images } = req.body;
  const pool = getPostgresPool();

  // Check if product exists and user is owner
  const existingProduct = await pool.query(
    'SELECT vendor_id, images FROM products WHERE product_id = $1',
    [productId]
  );

  if (existingProduct.rows.length === 0) {
    throw createError('Product not found', 404);
  }

  if (existingProduct.rows[0].vendor_id !== req.user!.userId) {
    throw createError('You can only update your own products', 403);
  }

  if (!images || !Array.isArray(images)) {
    throw createError('Images array is required', 400);
  }

  if (images.length > 10) {
    throw createError('Maximum 10 images allowed per product', 400);
  }

  // Validate image URLs
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const validPrefix = `${baseUrl}/uploads/products/`;
  
  for (const imageUrl of images) {
    if (!imageUrl.startsWith(validPrefix)) {
      throw createError(`Invalid image URL: ${imageUrl}`, 400);
    }
  }

  // Update product images
  const result = await pool.query(
    `UPDATE products 
     SET images = $1, updated_at = NOW()
     WHERE product_id = $2
     RETURNING product_id, name, images, updated_at`,
    [images, productId]
  );

  const updatedProduct = result.rows[0];

  logger.info('Product images updated successfully', {
    productId: updatedProduct.product_id,
    vendorId: req.user!.userId,
    imageCount: images.length
  });

  res.json({
    success: true,
    message: 'Product images updated successfully',
    product: {
      productId: updatedProduct.product_id,
      name: updatedProduct.name,
      images: updatedProduct.images,
      updatedAt: updatedProduct.updated_at
    }
  });
}));

// Delete product (owner only)
router.delete('/:productId', requireRole(['vendor']), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { productId } = req.params;
  const pool = getPostgresPool();

  // Check if product exists and user is owner
  const existingProduct = await pool.query(
    'SELECT vendor_id, name FROM products WHERE product_id = $1',
    [productId]
  );

  if (existingProduct.rows.length === 0) {
    throw createError('Product not found', 404);
  }

  if (existingProduct.rows[0].vendor_id !== req.user!.userId) {
    throw createError('You can only delete your own products', 403);
  }

  // Delete product
  await pool.query('DELETE FROM products WHERE product_id = $1', [productId]);

  logger.info('Product deleted successfully', {
    productId,
    vendorId: req.user!.userId,
    productName: existingProduct.rows[0].name
  });

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

// Get product categories
router.get('/categories/list', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const pool = getPostgresPool();

  // Get categories with product counts
  const result = await pool.query(`
    SELECT 
      category,
      COUNT(*) as product_count,
      AVG(base_price) as avg_price,
      MIN(base_price) as min_price,
      MAX(base_price) as max_price
    FROM products 
    GROUP BY category
    ORDER BY product_count DESC
  `);

  const categories = result.rows.map(row => ({
    category: row.category,
    productCount: parseInt(row.product_count),
    averagePrice: parseFloat(row.avg_price || '0'),
    priceRange: {
      min: parseFloat(row.min_price || '0'),
      max: parseFloat(row.max_price || '0')
    }
  }));

  res.json({
    success: true,
    categories
  });
}));

// Bulk upload products (vendors only)
router.post('/bulk', requireRole(['vendor']), [
  body('products').isArray({ min: 1, max: 100 }),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { products, validateOnly = false } = req.body;
  const pool = getPostgresPool();

  const results = [];
  const validationErrors = [];

  // Validate each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const { error } = validateProductCreation(product);
    
    if (error) {
      validationErrors.push({
        index: i,
        product: product.name || `Product ${i + 1}`,
        errors: error.details.map(d => d.message)
      });
    } else {
      results.push({
        index: i,
        product: product.name,
        status: 'valid'
      });
    }
  }

  if (validateOnly) {
    return res.json({
      success: true,
      message: 'Validation completed',
      results,
      validationErrors,
      summary: {
        total: products.length,
        valid: results.length,
        invalid: validationErrors.length
      }
    });
  }

  if (validationErrors.length > 0) {
    throw createError('Some products have validation errors', 400, { validationErrors });
  }

  // Insert valid products
  const insertedProducts = [];
  
  for (const product of products) {
    try {
      const result = await pool.query(
        `INSERT INTO products (
          vendor_id, name, description, category, subcategory, images, 
          specifications, base_price, availability, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING product_id, name`,
        [
          req.user!.userId,
          product.name,
          product.description || null,
          product.category,
          product.subcategory || null,
          product.images || [],
          JSON.stringify(product.specifications || []),
          product.basePrice,
          JSON.stringify(product.availability),
          product.tags || []
        ]
      );

      insertedProducts.push({
        productId: result.rows[0].product_id,
        name: result.rows[0].name
      });
    } catch (error) {
      logger.error('Failed to insert product during bulk upload', {
        productName: product.name,
        error: error.message
      });
    }
  }

  logger.info('Bulk product upload completed', {
    vendorId: req.user!.userId,
    totalProducts: products.length,
    successfulInserts: insertedProducts.length
  });

  res.status(201).json({
    success: true,
    message: `Successfully uploaded ${insertedProducts.length} products`,
    insertedProducts,
    summary: {
      total: products.length,
      successful: insertedProducts.length,
      failed: products.length - insertedProducts.length
    }
  });
}));

export default router;