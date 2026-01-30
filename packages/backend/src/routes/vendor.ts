import express from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { getPostgresPool } from '../config/database';
import { logger } from '../utils/logger';
import { 
  validateVendorProfileCreation, 
  validateVendorProfileUpdate,
  validateVendorSearch,
  validateVendorFeedback 
} from '@local-vendor-ai/shared';

const router = express.Router();

// Create vendor profile (only for vendor users)
router.post('/profile', requireRole(['vendor']), [
  body('businessInfo.businessName').trim().isLength({ min: 2, max: 200 }),
  body('businessInfo.businessType').isIn(['individual', 'partnership', 'company', 'cooperative']),
  body('businessInfo.establishedYear').isInt({ min: 1900, max: new Date().getFullYear() }),
  body('businessInfo.description').trim().isLength({ min: 10, max: 1000 }),
  body('businessInfo.categories').isArray({ min: 1, max: 10 }),
  body('specializations').isArray({ min: 1, max: 20 }),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const {
    businessInfo,
    specializations,
    culturalPreferences = [],
    operatingHours,
    serviceRadius = 10,
    preferredPaymentMethods,
    deliveryOptions
  } = req.body;

  const pool = getPostgresPool();

  // Check if vendor profile already exists
  const existingProfile = await pool.query(
    'SELECT vendor_id FROM vendor_profiles WHERE vendor_id = $1',
    [req.user!.userId]
  );

  if (existingProfile.rows.length > 0) {
    throw createError('Vendor profile already exists. Use PUT to update.', 409);
  }

  // Validate business hours if provided
  if (operatingHours) {
    const { isValid, errors: hourErrors } = validateBusinessHours(operatingHours);
    if (!isValid) {
      throw createError(`Invalid operating hours: ${hourErrors.join(', ')}`, 400);
    }
  }

  // Create default reputation score
  const defaultReputation = {
    overall: 0,
    quality: 0,
    fairness: 0,
    service: 0,
    reliability: 0,
    totalReviews: 0,
    recentReviews: 0,
    verifiedReviews: 0,
    lastUpdated: new Date()
  };

  // Create default verification status
  const defaultVerificationStatus = {
    isVerified: false,
    verificationLevel: 'basic',
    documentsVerified: [],
    verificationDate: null,
    verificationExpiry: null,
    verifiedBy: null
  };

  // Create default market presence
  const defaultMarketPresence = {
    yearsActive: new Date().getFullYear() - businessInfo.establishedYear,
    totalTransactions: 0,
    monthlyTransactions: 0,
    averageTransactionValue: 0,
    preferredPaymentMethods: preferredPaymentMethods || ['UPI', 'CASH'],
    deliveryOptions: deliveryOptions || ['pickup'],
    serviceRadius: serviceRadius
  };

  // Create vendor profile
  const result = await pool.query(
    `INSERT INTO vendor_profiles (
      vendor_id, business_info, reputation, specializations, 
      verification_status, market_presence, cultural_preferences
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING vendor_id, business_info, reputation, specializations, 
             verification_status, market_presence, cultural_preferences, created_at`,
    [
      req.user!.userId,
      JSON.stringify(businessInfo),
      JSON.stringify(defaultReputation),
      specializations,
      JSON.stringify(defaultVerificationStatus),
      JSON.stringify(defaultMarketPresence),
      JSON.stringify(culturalPreferences)
    ]
  );

  const vendorProfile = result.rows[0];

  logger.info('Vendor profile created', { 
    vendorId: req.user!.userId,
    businessName: businessInfo.businessName,
    businessType: businessInfo.businessType,
    categories: businessInfo.categories
  });

  res.status(201).json({
    success: true,
    message: 'Vendor profile created successfully',
    vendorProfile: {
      vendorId: vendorProfile.vendor_id,
      businessInfo: vendorProfile.business_info,
      reputation: vendorProfile.reputation,
      specializations: vendorProfile.specializations,
      verificationStatus: vendorProfile.verification_status,
      marketPresence: vendorProfile.market_presence,
      culturalPreferences: vendorProfile.cultural_preferences,
      createdAt: vendorProfile.created_at
    },
    nextSteps: [
      'Upload business verification documents',
      'Add product listings',
      'Set up payment methods',
      'Complete profile verification'
    ]
  });
}));

// Get vendor profile
router.get('/profile/:vendorId?', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const vendorId = req.params.vendorId || req.user!.userId;
  const pool = getPostgresPool();

  const result = await pool.query(`
    SELECT 
      vp.vendor_id,
      vp.business_info,
      vp.reputation,
      vp.specializations,
      vp.verification_status,
      vp.market_presence,
      vp.cultural_preferences,
      vp.created_at,
      vp.updated_at,
      u.name,
      u.phone_number,
      u.email,
      u.location,
      u.is_verified as user_verified
    FROM vendor_profiles vp
    JOIN users u ON vp.vendor_id = u.user_id
    WHERE vp.vendor_id = $1
  `, [vendorId]);

  if (result.rows.length === 0) {
    throw createError('Vendor profile not found', 404);
  }

  const vendor = result.rows[0];
  const isOwnProfile = vendorId === req.user!.userId;

  // Determine what information to show based on privacy settings and ownership
  const vendorProfile = {
    vendorId: vendor.vendor_id,
    businessInfo: vendor.business_info,
    reputation: vendor.reputation,
    specializations: vendor.specializations,
    verificationStatus: vendor.verification_status,
    marketPresence: vendor.market_presence,
    culturalPreferences: vendor.cultural_preferences,
    createdAt: vendor.created_at,
    updatedAt: vendor.updated_at,
    // Only show contact info if it's own profile or based on privacy settings
    contactInfo: isOwnProfile ? {
      name: vendor.name,
      phoneNumber: vendor.phone_number,
      email: vendor.email,
      location: vendor.location
    } : {
      name: vendor.name,
      // Contact info visibility based on privacy settings would be implemented here
    },
    isVerified: vendor.user_verified
  };

  res.json({
    success: true,
    vendorProfile,
    publicView: !isOwnProfile,
    canEdit: isOwnProfile
  });
}));

// Update vendor profile
router.put('/profile', requireRole(['vendor']), asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const {
    businessInfo,
    specializations,
    culturalPreferences,
    operatingHours,
    serviceRadius,
    preferredPaymentMethods,
    deliveryOptions
  } = req.body;

  const pool = getPostgresPool();

  // Check if vendor profile exists
  const existingProfile = await pool.query(
    'SELECT vendor_id, business_info, market_presence FROM vendor_profiles WHERE vendor_id = $1',
    [req.user!.userId]
  );

  if (existingProfile.rows.length === 0) {
    throw createError('Vendor profile not found. Create a profile first.', 404);
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (businessInfo) {
    updates.push(`business_info = $${paramCount++}`);
    values.push(JSON.stringify(businessInfo));
  }

  if (specializations) {
    updates.push(`specializations = $${paramCount++}`);
    values.push(specializations);
  }

  if (culturalPreferences) {
    updates.push(`cultural_preferences = $${paramCount++}`);
    values.push(JSON.stringify(culturalPreferences));
  }

  // Update market presence if relevant fields are provided
  if (serviceRadius || preferredPaymentMethods || deliveryOptions) {
    const currentMarketPresence = existingProfile.rows[0].market_presence;
    const updatedMarketPresence = {
      ...currentMarketPresence,
      ...(serviceRadius && { serviceRadius }),
      ...(preferredPaymentMethods && { preferredPaymentMethods }),
      ...(deliveryOptions && { deliveryOptions })
    };
    updates.push(`market_presence = $${paramCount++}`);
    values.push(JSON.stringify(updatedMarketPresence));
  }

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updates.push(`updated_at = NOW()`);
  values.push(req.user!.userId);

  const query = `
    UPDATE vendor_profiles 
    SET ${updates.join(', ')}
    WHERE vendor_id = $${paramCount}
    RETURNING vendor_id, business_info, specializations, cultural_preferences, 
             market_presence, updated_at
  `;

  const result = await pool.query(query, values);
  const updatedProfile = result.rows[0];

  logger.info('Vendor profile updated', { 
    vendorId: req.user!.userId,
    updatedFields: Object.keys(req.body)
  });

  res.json({
    success: true,
    message: 'Vendor profile updated successfully',
    vendorProfile: {
      vendorId: updatedProfile.vendor_id,
      businessInfo: updatedProfile.business_info,
      specializations: updatedProfile.specializations,
      culturalPreferences: updatedProfile.cultural_preferences,
      marketPresence: updatedProfile.market_presence,
      updatedAt: updatedProfile.updated_at
    },
    changesApplied: Object.keys(req.body)
  });
}));

// Search vendors
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const {
    query,
    categories,
    location,
    radius = 10,
    minRating = 0,
    verificationLevel,
    sortBy = 'relevance',
    limit = 20,
    offset = 0
  } = req.query;

  const pool = getPostgresPool();

  // Build search query
  let searchQuery = `
    SELECT 
      vp.vendor_id,
      vp.business_info,
      vp.reputation,
      vp.specializations,
      vp.verification_status,
      vp.market_presence,
      u.name,
      u.location,
      u.is_verified,
      u.last_active
    FROM vendor_profiles vp
    JOIN users u ON vp.vendor_id = u.user_id
    WHERE 1=1
  `;

  const queryParams: any[] = [];
  let paramCount = 1;

  // Add search filters
  if (query) {
    searchQuery += ` AND (
      vp.business_info->>'businessName' ILIKE $${paramCount} OR
      array_to_string(vp.specializations, ' ') ILIKE $${paramCount}
    )`;
    queryParams.push(`%${query}%`);
    paramCount++;
  }

  if (categories && Array.isArray(categories)) {
    searchQuery += ` AND vp.business_info->'categories' ?| $${paramCount}`;
    queryParams.push(categories);
    paramCount++;
  }

  if (minRating > 0) {
    searchQuery += ` AND (vp.reputation->>'overall')::float >= $${paramCount}`;
    queryParams.push(minRating);
    paramCount++;
  }

  if (verificationLevel) {
    searchQuery += ` AND vp.verification_status->>'verificationLevel' = $${paramCount}`;
    queryParams.push(verificationLevel);
    paramCount++;
  }

  // Add sorting
  switch (sortBy) {
    case 'rating':
      searchQuery += ` ORDER BY (vp.reputation->>'overall')::float DESC`;
      break;
    case 'experience':
      searchQuery += ` ORDER BY (vp.market_presence->>'yearsActive')::int DESC`;
      break;
    case 'distance':
      // TODO: Implement distance-based sorting using PostGIS
      searchQuery += ` ORDER BY u.last_active DESC`;
      break;
    default:
      searchQuery += ` ORDER BY u.last_active DESC`;
  }

  // Add pagination
  searchQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  queryParams.push(parseInt(limit as string), parseInt(offset as string));

  const result = await pool.query(searchQuery, queryParams);

  // Get total count for pagination
  const countQuery = searchQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
  const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
  const totalCount = parseInt(countResult.rows[0].count);

  const vendors = result.rows.map(vendor => ({
    vendorId: vendor.vendor_id,
    businessName: vendor.business_info.businessName,
    categories: vendor.business_info.categories,
    reputation: vendor.reputation,
    verificationStatus: vendor.verification_status,
    location: vendor.location,
    specializations: vendor.specializations,
    isOnline: vendor.last_active && (Date.now() - new Date(vendor.last_active).getTime()) < 30 * 60 * 1000, // Online if active in last 30 minutes
    responseTime: 'Within 1 hour' // TODO: Calculate based on historical data
  }));

  res.json({
    success: true,
    vendors,
    totalCount,
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: (parseInt(offset as string) + parseInt(limit as string)) < totalCount
    },
    facets: {
      // TODO: Implement faceted search results
      categories: [],
      verificationLevels: [],
      ratings: [],
      locations: []
    }
  });
}));

// Submit vendor feedback
router.post('/:vendorId/feedback', requireRole(['buyer']), [
  body('transactionId').isUUID(),
  body('ratings.quality').isInt({ min: 1, max: 5 }),
  body('ratings.fairness').isInt({ min: 1, max: 5 }),
  body('ratings.service').isInt({ min: 1, max: 5 }),
  body('ratings.reliability').isInt({ min: 1, max: 5 }),
  body('wouldRecommend').isBoolean(),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { vendorId } = req.params;
  const { transactionId, ratings, comments, wouldRecommend } = req.body;
  const pool = getPostgresPool();

  // Verify transaction exists and buyer is authorized
  const transactionCheck = await pool.query(
    'SELECT vendor_id, buyer_id FROM transactions WHERE transaction_id = $1 AND buyer_id = $2',
    [transactionId, req.user!.userId]
  );

  if (transactionCheck.rows.length === 0) {
    throw createError('Transaction not found or unauthorized', 404);
  }

  if (transactionCheck.rows[0].vendor_id !== vendorId) {
    throw createError('Transaction does not match vendor', 400);
  }

  // Check if feedback already exists
  const existingFeedback = await pool.query(
    'SELECT feedback_id FROM vendor_feedback WHERE transaction_id = $1',
    [transactionId]
  );

  if (existingFeedback.rows.length > 0) {
    throw createError('Feedback already submitted for this transaction', 409);
  }

  // Create feedback record
  const feedbackResult = await pool.query(
    `INSERT INTO vendor_feedback (
      transaction_id, vendor_id, buyer_id, ratings, comments, 
      would_recommend, is_verified, submitted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING feedback_id, submitted_at`,
    [
      transactionId,
      vendorId,
      req.user!.userId,
      JSON.stringify(ratings),
      comments || null,
      wouldRecommend,
      true // Mark as verified since it's linked to a transaction
    ]
  );

  // Update vendor reputation
  await updateVendorReputation(vendorId, pool);

  logger.info('Vendor feedback submitted', {
    vendorId,
    buyerId: req.user!.userId,
    transactionId,
    overallRating: (ratings.quality + ratings.fairness + ratings.service + ratings.reliability) / 4
  });

  res.status(201).json({
    success: true,
    feedbackId: feedbackResult.rows[0].feedback_id,
    message: 'Feedback submitted successfully',
    reputationUpdated: true
  });
}));

// Get vendor feedback
router.get('/:vendorId/feedback', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { vendorId } = req.params;
  const {
    limit = 20,
    offset = 0,
    sortBy = 'newest',
    verified
  } = req.query;

  const pool = getPostgresPool();

  let query = `
    SELECT 
      vf.feedback_id,
      vf.ratings,
      vf.comments,
      vf.would_recommend,
      vf.is_verified,
      vf.submitted_at,
      u.name as buyer_name
    FROM vendor_feedback vf
    JOIN users u ON vf.buyer_id = u.user_id
    WHERE vf.vendor_id = $1
  `;

  const queryParams = [vendorId];
  let paramCount = 2;

  if (verified !== undefined) {
    query += ` AND vf.is_verified = $${paramCount}`;
    queryParams.push(verified === 'true');
    paramCount++;
  }

  // Add sorting
  switch (sortBy) {
    case 'oldest':
      query += ` ORDER BY vf.submitted_at ASC`;
      break;
    case 'rating_high':
      query += ` ORDER BY ((vf.ratings->>'quality')::int + (vf.ratings->>'fairness')::int + (vf.ratings->>'service')::int + (vf.ratings->>'reliability')::int) DESC`;
      break;
    case 'rating_low':
      query += ` ORDER BY ((vf.ratings->>'quality')::int + (vf.ratings->>'fairness')::int + (vf.ratings->>'service')::int + (vf.ratings->>'reliability')::int) ASC`;
      break;
    default:
      query += ` ORDER BY vf.submitted_at DESC`;
  }

  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  queryParams.push(parseInt(limit as string), parseInt(offset as string));

  const result = await pool.query(query, queryParams);

  // Get total count and average ratings
  const statsQuery = `
    SELECT 
      COUNT(*) as total_count,
      AVG((ratings->>'quality')::int) as avg_quality,
      AVG((ratings->>'fairness')::int) as avg_fairness,
      AVG((ratings->>'service')::int) as avg_service,
      AVG((ratings->>'reliability')::int) as avg_reliability,
      AVG(((ratings->>'quality')::int + (ratings->>'fairness')::int + (ratings->>'service')::int + (ratings->>'reliability')::int) / 4.0) as avg_overall
    FROM vendor_feedback 
    WHERE vendor_id = $1 ${verified !== undefined ? 'AND is_verified = $2' : ''}
  `;

  const statsParams = verified !== undefined ? [vendorId, verified === 'true'] : [vendorId];
  const statsResult = await pool.query(statsQuery, statsParams);
  const stats = statsResult.rows[0];

  const feedback = result.rows.map(row => ({
    feedbackId: row.feedback_id,
    ratings: row.ratings,
    comments: row.comments,
    wouldRecommend: row.would_recommend,
    isVerified: row.is_verified,
    submittedAt: row.submitted_at,
    buyerName: row.buyer_name
  }));

  res.json({
    success: true,
    feedback,
    totalCount: parseInt(stats.total_count),
    averageRatings: {
      overall: parseFloat(stats.avg_overall || 0).toFixed(1),
      quality: parseFloat(stats.avg_quality || 0).toFixed(1),
      fairness: parseFloat(stats.avg_fairness || 0).toFixed(1),
      service: parseFloat(stats.avg_service || 0).toFixed(1),
      reliability: parseFloat(stats.avg_reliability || 0).toFixed(1)
    },
    ratingDistribution: {
      // TODO: Calculate rating distribution
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    }
  });
}));

// Helper function to validate business hours
function validateBusinessHours(operatingHours: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const schedule = operatingHours[day];
    if (schedule?.isOpen) {
      if (!schedule.openTime || !schedule.closeTime) {
        errors.push(`${day}: Open and close times are required when the day is marked as open`);
        continue;
      }
      
      const openTime = new Date(`2000-01-01T${schedule.openTime}:00`);
      const closeTime = new Date(`2000-01-01T${schedule.closeTime}:00`);
      
      if (openTime >= closeTime) {
        errors.push(`${day}: Close time must be after open time`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to update vendor reputation
async function updateVendorReputation(vendorId: string, pool: any) {
  const feedbackResult = await pool.query(`
    SELECT 
      AVG((ratings->>'quality')::int) as avg_quality,
      AVG((ratings->>'fairness')::int) as avg_fairness,
      AVG((ratings->>'service')::int) as avg_service,
      AVG((ratings->>'reliability')::int) as avg_reliability,
      COUNT(*) as total_reviews,
      COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '30 days') as recent_reviews,
      COUNT(*) FILTER (WHERE is_verified = true) as verified_reviews
    FROM vendor_feedback 
    WHERE vendor_id = $1
  `, [vendorId]);

  const stats = feedbackResult.rows[0];
  const overall = (
    parseFloat(stats.avg_quality || 0) +
    parseFloat(stats.avg_fairness || 0) +
    parseFloat(stats.avg_service || 0) +
    parseFloat(stats.avg_reliability || 0)
  ) / 4;

  const updatedReputation = {
    overall: parseFloat(overall.toFixed(2)),
    quality: parseFloat((stats.avg_quality || 0).toFixed(2)),
    fairness: parseFloat((stats.avg_fairness || 0).toFixed(2)),
    service: parseFloat((stats.avg_service || 0).toFixed(2)),
    reliability: parseFloat((stats.avg_reliability || 0).toFixed(2)),
    totalReviews: parseInt(stats.total_reviews),
    recentReviews: parseInt(stats.recent_reviews),
    verifiedReviews: parseInt(stats.verified_reviews),
    lastUpdated: new Date()
  };

  await pool.query(
    'UPDATE vendor_profiles SET reputation = $1 WHERE vendor_id = $2',
    [JSON.stringify(updatedReputation), vendorId]
  );
}

export default router;