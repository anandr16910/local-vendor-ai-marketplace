import express from 'express';
import { query, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { getPostgresPool, getMongoDb } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// Collect market data from completed transactions
router.post('/collect', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const pool = getPostgresPool();
  const mongoDb = getMongoDb();

  // Get recent completed transactions for market data collection
  const transactions = await pool.query(`
    SELECT 
      t.transaction_id,
      t.vendor_id,
      t.buyer_id,
      t.product_id,
      t.amount,
      t.completed_at,
      t.location,
      t.metadata,
      p.category,
      p.subcategory,
      p.name as product_name,
      p.base_price,
      vp.reputation->>'overall' as vendor_reputation,
      u.location as vendor_location
    FROM transactions t
    JOIN products p ON t.product_id = p.product_id
    JOIN users u ON t.vendor_id = u.user_id
    LEFT JOIN vendor_profiles vp ON t.vendor_id = vp.vendor_id
    WHERE t.status = 'completed' 
    AND t.completed_at >= NOW() - INTERVAL '24 hours'
    AND t.product_id IS NOT NULL
  `);

  const marketDataPoints = [];

  for (const transaction of transactions.rows) {
    const location = transaction.location || transaction.vendor_location;
    
    if (!location || !location.city) continue;

    // Create market data point
    const marketDataPoint = {
      category: transaction.category,
      subcategory: transaction.subcategory,
      location: {
        city: location.city,
        state: location.state,
        coordinates: location.coordinates
      },
      pricePoints: [{
        price: parseFloat(transaction.amount),
        quantity: 1, // Default quantity
        vendorReputation: parseFloat(transaction.vendor_reputation || '0'),
        transactionVolume: 1,
        timeOfDay: new Date(transaction.completed_at).toTimeString().slice(0, 5),
        dayOfWeek: new Date(transaction.completed_at).toLocaleDateString('en-US', { weekday: 'long' }),
        quality: 'standard', // Default quality
        verified: true
      }],
      demandIndicators: [],
      seasonalFactors: [],
      competitorAnalysis: [],
      timestamp: new Date(),
      dataSource: 'transaction_data',
      reliability: 1.0
    };

    marketDataPoints.push(marketDataPoint);
  }

  // Insert market data into MongoDB
  if (marketDataPoints.length > 0) {
    await mongoDb.collection('market_data').insertMany(marketDataPoints);
  }

  logger.info('Market data collection completed', {
    transactionsProcessed: transactions.rows.length,
    dataPointsCreated: marketDataPoints.length
  });

  res.json({
    success: true,
    message: 'Market data collection completed',
    summary: {
      transactionsProcessed: transactions.rows.length,
      dataPointsCreated: marketDataPoints.length
    }
  });
}));

// Get market trends for a category and location
router.get('/trends', [
  query('category').notEmpty(),
  query('location').optional(),
  query('timeRange').optional().isIn(['1_week', '1_month', '3_months', '6_months']),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { category, location, timeRange = '1_month' } = req.query;
  const mongoDb = getMongoDb();

  // Calculate date range
  const timeRanges = {
    '1_week': 7,
    '1_month': 30,
    '3_months': 90,
    '6_months': 180
  };

  const daysBack = timeRanges[timeRange as keyof typeof timeRanges];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Build aggregation pipeline
  const pipeline: any[] = [
    {
      $match: {
        category: category,
        timestamp: { $gte: startDate },
        ...(location && { 'location.city': location })
      }
    },
    {
      $unwind: '$pricePoints'
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          category: '$category',
          location: '$location.city'
        },
        averagePrice: { $avg: '$pricePoints.price' },
        minPrice: { $min: '$pricePoints.price' },
        maxPrice: { $max: '$pricePoints.price' },
        transactionCount: { $sum: 1 },
        averageReputation: { $avg: '$pricePoints.vendorReputation' }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ];

  const trendData = await mongoDb.collection('market_data').aggregate(pipeline).toArray();

  // Calculate trend direction and strength
  let trendDirection = 'stable';
  let trendStrength = 0;

  if (trendData.length >= 2) {
    const firstWeek = trendData.slice(0, Math.min(7, trendData.length));
    const lastWeek = trendData.slice(-Math.min(7, trendData.length));

    const firstAvg = firstWeek.reduce((sum, item) => sum + item.averagePrice, 0) / firstWeek.length;
    const lastAvg = lastWeek.reduce((sum, item) => sum + item.averagePrice, 0) / lastWeek.length;

    const percentChange = ((lastAvg - firstAvg) / firstAvg) * 100;
    
    if (percentChange > 5) {
      trendDirection = 'bullish';
      trendStrength = Math.min(Math.abs(percentChange), 100);
    } else if (percentChange < -5) {
      trendDirection = 'bearish';
      trendStrength = Math.min(Math.abs(percentChange), 100);
    } else {
      trendDirection = 'stable';
      trendStrength = Math.abs(percentChange);
    }
  }

  // Generate market prediction
  const prediction = {
    timeframe: timeRange,
    predictedTrend: trendDirection === 'bullish' ? 'up' : trendDirection === 'bearish' ? 'down' : 'stable',
    confidence: Math.min(trendStrength / 10 * 100, 95), // Convert to confidence percentage
    priceRange: trendData.length > 0 ? {
      min: Math.min(...trendData.map(d => d.minPrice)),
      max: Math.max(...trendData.map(d => d.maxPrice))
    } : { min: 0, max: 0 },
    keyFactors: [
      'Historical transaction data',
      'Vendor reputation trends',
      'Market volume patterns'
    ]
  };

  res.json({
    success: true,
    trend: {
      trendId: `${category}_${location || 'all'}_${Date.now()}`,
      category: category as string,
      location: location as string || 'all',
      trend: trendDirection,
      strength: trendStrength,
      duration: timeRange,
      factors: [
        {
          factor: 'Price Movement',
          impact: trendDirection === 'stable' ? 'neutral' : trendDirection === 'bullish' ? 'positive' : 'negative',
          weight: 0.7,
          description: `Price trend over ${timeRange}`
        },
        {
          factor: 'Transaction Volume',
          impact: 'neutral',
          weight: 0.3,
          description: 'Market activity level'
        }
      ],
      prediction,
      lastUpdated: new Date()
    },
    data: trendData
  });
}));

// Get price recommendations for a product
router.get('/price-recommendation', [
  query('category').notEmpty(),
  query('basePrice').isFloat({ min: 0.01 }),
  query('location').optional(),
  query('vendorReputation').optional().isFloat({ min: 0, max: 5 }),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { 
    category, 
    basePrice, 
    location, 
    vendorReputation = 0,
    subcategory 
  } = req.query;

  const mongoDb = getMongoDb();
  const pool = getPostgresPool();

  // Get recent market data for the category
  const marketData = await mongoDb.collection('market_data').aggregate([
    {
      $match: {
        category: category,
        ...(subcategory && { subcategory }),
        ...(location && { 'location.city': location }),
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    },
    {
      $unwind: '$pricePoints'
    },
    {
      $group: {
        _id: null,
        averagePrice: { $avg: '$pricePoints.price' },
        minPrice: { $min: '$pricePoints.price' },
        maxPrice: { $max: '$pricePoints.price' },
        medianPrice: { $avg: '$pricePoints.price' }, // Simplified median
        transactionCount: { $sum: 1 },
        averageReputation: { $avg: '$pricePoints.vendorReputation' }
      }
    }
  ]).toArray();

  const marketStats = marketData[0] || {
    averagePrice: parseFloat(basePrice as string),
    minPrice: parseFloat(basePrice as string) * 0.8,
    maxPrice: parseFloat(basePrice as string) * 1.2,
    transactionCount: 0,
    averageReputation: 0
  };

  // Get competitor data
  const competitors = await pool.query(`
    SELECT 
      p.vendor_id,
      AVG(p.base_price) as average_price,
      COUNT(*) as product_count,
      AVG((vp.reputation->>'overall')::float) as reputation
    FROM products p
    LEFT JOIN vendor_profiles vp ON p.vendor_id = vp.vendor_id
    WHERE p.category = $1
    ${subcategory ? 'AND p.subcategory = $2' : ''}
    GROUP BY p.vendor_id
    ORDER BY reputation DESC
    LIMIT 10
  `, subcategory ? [category, subcategory] : [category]);

  const competitorAnalysis = {
    averageCompetitorPrice: competitors.rows.length > 0 
      ? competitors.rows.reduce((sum, c) => sum + parseFloat(c.average_price), 0) / competitors.rows.length
      : marketStats.averagePrice,
    competitorCount: competitors.rows.length,
    marketShare: 0, // Would need more complex calculation
    pricePosition: 'at' as 'below' | 'at' | 'above',
    percentageDifference: 0
  };

  const basePriceNum = parseFloat(basePrice as string);
  const priceDiff = ((basePriceNum - competitorAnalysis.averageCompetitorPrice) / competitorAnalysis.averageCompetitorPrice) * 100;
  
  competitorAnalysis.percentageDifference = Math.abs(priceDiff);
  competitorAnalysis.pricePosition = priceDiff > 5 ? 'above' : priceDiff < -5 ? 'below' : 'at';

  // Calculate reputation adjustment
  const reputationAdjustment = (parseFloat(vendorReputation as string) - marketStats.averageReputation) * 0.1;
  
  // Generate price recommendation
  const suggestedPrice = marketStats.averagePrice * (1 + reputationAdjustment);
  const priceRange = {
    min: Math.max(marketStats.minPrice, suggestedPrice * 0.9),
    max: Math.min(marketStats.maxPrice, suggestedPrice * 1.1)
  };

  const confidence = Math.min(
    (marketStats.transactionCount / 10) * 100, // More transactions = higher confidence
    95
  );

  const reasoning = [
    `Based on ${marketStats.transactionCount} recent transactions in ${category}`,
    `Market average price: ₹${marketStats.averagePrice.toFixed(2)}`,
    `Your reputation adjustment: ${reputationAdjustment > 0 ? '+' : ''}${(reputationAdjustment * 100).toFixed(1)}%`,
    `Competitor analysis: ${competitors.rows.length} similar vendors found`
  ];

  res.json({
    success: true,
    recommendation: {
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      priceRange,
      confidence: Math.round(confidence),
      reasoning,
      marketFactors: [
        {
          factor: 'Market Average',
          impact: 0.6,
          description: `Average price in ${category} category`,
          source: 'transaction_data',
          reliability: 0.9
        },
        {
          factor: 'Vendor Reputation',
          impact: reputationAdjustment,
          description: 'Reputation-based price adjustment',
          source: 'vendor_profiles',
          reliability: 0.8
        },
        {
          factor: 'Competition Level',
          impact: competitorAnalysis.competitorCount > 5 ? -0.1 : 0.1,
          description: `${competitorAnalysis.competitorCount} competitors in market`,
          source: 'competitor_analysis',
          reliability: 0.7
        }
      ],
      seasonalAdjustments: 0, // Would need seasonal data
      competitorComparison: competitorAnalysis,
      demandForecast: {
        expectedDemand: marketStats.transactionCount > 20 ? 'high' : marketStats.transactionCount > 10 ? 'medium' : 'low',
        demandScore: Math.min(marketStats.transactionCount * 5, 100),
        peakTimes: ['09:00-11:00', '15:00-17:00'], // Default peak times
        seasonalImpact: 0,
        trendDirection: 'stable'
      }
    },
    marketData: {
      averagePrice: marketStats.averagePrice,
      priceRange: {
        min: marketStats.minPrice,
        max: marketStats.maxPrice
      },
      transactionCount: marketStats.transactionCount,
      lastUpdated: new Date()
    }
  });
}));

// Get market insights
router.get('/insights', [
  query('category').optional(),
  query('location').optional(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const { category, location, limit = 10 } = req.query;
  const mongoDb = getMongoDb();

  // Generate insights based on market data patterns
  const pipeline: any[] = [
    {
      $match: {
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        ...(category && { category }),
        ...(location && { 'location.city': location })
      }
    },
    {
      $unwind: '$pricePoints'
    },
    {
      $group: {
        _id: {
          category: '$category',
          location: '$location.city'
        },
        averagePrice: { $avg: '$pricePoints.price' },
        transactionCount: { $sum: 1 },
        priceVariation: { $stdDevPop: '$pricePoints.price' }
      }
    },
    {
      $match: {
        transactionCount: { $gte: 3 } // Only categories with sufficient data
      }
    },
    {
      $sort: { transactionCount: -1 }
    },
    {
      $limit: parseInt(limit as string)
    }
  ];

  const marketStats = await mongoDb.collection('market_data').aggregate(pipeline).toArray();

  const insights = marketStats.map((stat, index) => {
    const isHighVariation = stat.priceVariation > stat.averagePrice * 0.2;
    const isHighActivity = stat.transactionCount > 10;

    let type: 'price_opportunity' | 'demand_surge' | 'competition_alert' | 'seasonal_trend' | 'market_anomaly';
    let severity: 'low' | 'medium' | 'high';
    let title: string;
    let description: string;
    let recommendations: string[];

    if (isHighActivity) {
      type = 'demand_surge';
      severity = 'high';
      title = `High Demand in ${stat._id.category}`;
      description = `${stat._id.category} in ${stat._id.location} is experiencing high transaction volume (${stat.transactionCount} transactions this week)`;
      recommendations = [
        'Consider increasing inventory for this category',
        'Optimize pricing to capture demand',
        'Expand product offerings in this category'
      ];
    } else if (isHighVariation) {
      type = 'market_anomaly';
      severity = 'medium';
      title = `Price Volatility in ${stat._id.category}`;
      description = `High price variation detected in ${stat._id.category} (±₹${stat.priceVariation.toFixed(2)})`;
      recommendations = [
        'Monitor competitor pricing closely',
        'Consider price stabilization strategies',
        'Review market positioning'
      ];
    } else {
      type = 'price_opportunity';
      severity = 'low';
      title = `Stable Market in ${stat._id.category}`;
      description = `${stat._id.category} shows stable pricing around ₹${stat.averagePrice.toFixed(2)}`;
      recommendations = [
        'Good opportunity for consistent pricing',
        'Focus on quality differentiation',
        'Build customer loyalty'
      ];
    }

    return {
      insightId: `insight_${Date.now()}_${index}`,
      type,
      title,
      description,
      category: stat._id.category,
      location: stat._id.location,
      severity,
      actionable: true,
      recommendations,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 1 week
      createdAt: new Date()
    };
  });

  res.json({
    success: true,
    insights,
    summary: {
      totalInsights: insights.length,
      highSeverity: insights.filter(i => i.severity === 'high').length,
      mediumSeverity: insights.filter(i => i.severity === 'medium').length,
      lowSeverity: insights.filter(i => i.severity === 'low').length
    }
  });
}));

// Get market analytics dashboard data
router.get('/analytics', asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const pool = getPostgresPool();
  const mongoDb = getMongoDb();

  // Get overall market statistics
  const [transactionStats, vendorStats, productStats] = await Promise.all([
    pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_value,
        AVG(amount) as average_value,
        COUNT(DISTINCT vendor_id) as active_vendors,
        COUNT(DISTINCT buyer_id) as active_buyers
      FROM transactions 
      WHERE status = 'completed' 
      AND completed_at >= NOW() - INTERVAL '30 days'
    `),
    pool.query(`
      SELECT COUNT(*) as total_vendors
      FROM vendor_profiles
    `),
    pool.query(`
      SELECT 
        category,
        COUNT(*) as product_count,
        AVG(base_price) as average_price
      FROM products 
      GROUP BY category
      ORDER BY product_count DESC
    `)
  ]);

  // Get market data from MongoDB
  const marketDataStats = await mongoDb.collection('market_data').aggregate([
    {
      $match: {
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: null,
        totalDataPoints: { $sum: 1 },
        categories: { $addToSet: '$category' },
        locations: { $addToSet: '$location.city' }
      }
    }
  ]).toArray();

  const stats = transactionStats.rows[0];
  const marketData = marketDataStats[0] || { totalDataPoints: 0, categories: [], locations: [] };

  res.json({
    success: true,
    analytics: {
      totalMarkets: marketData.locations.length,
      activeVendors: parseInt(stats.active_vendors || '0'),
      totalTransactions: parseInt(stats.total_transactions || '0'),
      averageTransactionValue: parseFloat(stats.average_value || '0'),
      marketGrowth: 0, // Would need historical comparison
      categoryBreakdown: productStats.rows.map(row => ({
        category: row.category,
        transactionCount: 0, // Would need to join with transactions
        totalValue: 0,
        averagePrice: parseFloat(row.average_price || '0'),
        growth: 0,
        topVendors: []
      })),
      locationBreakdown: marketData.locations.map((location: string) => ({
        location,
        transactionCount: 0,
        totalValue: 0,
        averagePrice: 0,
        vendorCount: 0,
        growth: 0
      })),
      dataQuality: {
        totalDataPoints: marketData.totalDataPoints,
        categoriesCovered: marketData.categories.length,
        locationsCovered: marketData.locations.length,
        lastUpdated: new Date()
      }
    }
  });
}));

export default router;