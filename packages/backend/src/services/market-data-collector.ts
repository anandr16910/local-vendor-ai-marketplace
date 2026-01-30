import { getPostgresPool, getMongoDb } from '../config/database';
import { logger } from '../utils/logger';

export class MarketDataCollector {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private intervalMinutes: number = 60) {} // Default: collect every hour

  start() {
    if (this.isRunning) {
      logger.warn('Market data collector is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting market data collector', { intervalMinutes: this.intervalMinutes });

    // Run immediately on start
    this.collectMarketData();

    // Schedule regular collection
    this.intervalId = setInterval(() => {
      this.collectMarketData();
    }, this.intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Market data collector stopped');
  }

  async collectMarketData() {
    try {
      logger.info('Starting market data collection cycle');
      
      const pool = getPostgresPool();
      const mongoDb = getMongoDb();

      // Get recent completed transactions
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
          p.specifications,
          vp.reputation->>'overall' as vendor_reputation,
          u.location as vendor_location
        FROM transactions t
        JOIN products p ON t.product_id = p.product_id
        JOIN users u ON t.vendor_id = u.user_id
        LEFT JOIN vendor_profiles vp ON t.vendor_id = vp.vendor_id
        WHERE t.status = 'completed' 
        AND t.completed_at >= NOW() - INTERVAL '2 hours'
        AND t.product_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM market_data_processed mdp 
          WHERE mdp.transaction_id = t.transaction_id
        )
      `);

      const marketDataPoints = [];
      const processedTransactionIds = [];

      for (const transaction of transactions.rows) {
        const location = transaction.location || transaction.vendor_location;
        
        if (!location || !location.city) continue;

        // Determine quality based on price vs base price
        let quality: 'basic' | 'standard' | 'premium' = 'standard';
        const priceRatio = parseFloat(transaction.amount) / parseFloat(transaction.base_price);
        if (priceRatio < 0.8) quality = 'basic';
        else if (priceRatio > 1.2) quality = 'premium';

        // Extract demand indicators from transaction metadata
        const demandIndicators = [];
        if (transaction.metadata?.negotiationDuration) {
          demandIndicators.push({
            indicator: 'negotiation_duration',
            value: transaction.metadata.negotiationDuration,
            trend: transaction.metadata.negotiationDuration < 300 ? 'increasing' : 'decreasing', // 5 minutes threshold
            confidence: 0.8,
            timeframe: 'transaction'
          });
        }

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
            quantity: 1, // Default quantity - could be extracted from metadata
            vendorReputation: parseFloat(transaction.vendor_reputation || '0'),
            transactionVolume: 1,
            timeOfDay: new Date(transaction.completed_at).toTimeString().slice(0, 5),
            dayOfWeek: new Date(transaction.completed_at).toLocaleDateString('en-US', { weekday: 'long' }),
            quality,
            verified: true
          }],
          demandIndicators,
          seasonalFactors: this.calculateSeasonalFactors(transaction.category, new Date(transaction.completed_at)),
          competitorAnalysis: [], // Will be populated in aggregation phase
          timestamp: new Date(),
          dataSource: 'transaction_data',
          reliability: 1.0
        };

        marketDataPoints.push(marketDataPoint);
        processedTransactionIds.push(transaction.transaction_id);
      }

      // Insert market data into MongoDB
      if (marketDataPoints.length > 0) {
        await mongoDb.collection('market_data').insertMany(marketDataPoints);
        
        // Mark transactions as processed
        if (processedTransactionIds.length > 0) {
          await pool.query(`
            INSERT INTO market_data_processed (transaction_id, processed_at)
            SELECT unnest($1::uuid[]), NOW()
            ON CONFLICT (transaction_id) DO NOTHING
          `, [processedTransactionIds]);
        }
      }

      // Aggregate competitor analysis
      await this.updateCompetitorAnalysis();

      // Clean up old market data (keep last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      await mongoDb.collection('market_data').deleteMany({
        timestamp: { $lt: sixMonthsAgo }
      });

      logger.info('Market data collection completed', {
        transactionsProcessed: transactions.rows.length,
        dataPointsCreated: marketDataPoints.length
      });

    } catch (error) {
      logger.error('Market data collection failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private calculateSeasonalFactors(category: string, date: Date) {
    const month = date.getMonth() + 1; // 1-12
    const seasonalFactors = [];

    // Define seasonal patterns for different categories
    const seasonalPatterns: Record<string, { months: number[], impact: number, description: string }[]> = {
      'food_beverages': [
        { months: [6, 7, 8], impact: 0.2, description: 'Summer beverage demand increase' },
        { months: [10, 11], impact: 0.15, description: 'Festival season food demand' },
        { months: [12, 1], impact: -0.1, description: 'Winter seasonal adjustment' }
      ],
      'clothing_textiles': [
        { months: [10, 11, 12], impact: 0.3, description: 'Festival and winter clothing demand' },
        { months: [3, 4, 5], impact: 0.1, description: 'Summer clothing preparation' },
        { months: [6, 7, 8], impact: -0.2, description: 'Monsoon season reduced demand' }
      ],
      'electronics': [
        { months: [10, 11], impact: 0.25, description: 'Festival electronics purchases' },
        { months: [3, 4], impact: 0.1, description: 'New year electronics upgrade' },
        { months: [6, 7], impact: -0.1, description: 'Monsoon electronics caution' }
      ]
    };

    const patterns = seasonalPatterns[category] || [];
    
    for (const pattern of patterns) {
      if (pattern.months.includes(month)) {
        seasonalFactors.push({
          factor: pattern.description,
          impact: pattern.impact,
          months: pattern.months,
          description: pattern.description,
          historicalData: [] // Would be populated with historical data
        });
      }
    }

    return seasonalFactors;
  }

  private async updateCompetitorAnalysis() {
    try {
      const mongoDb = getMongoDb();
      const pool = getPostgresPool();

      // Get categories that need competitor analysis update
      const categories = await mongoDb.collection('market_data').distinct('category', {
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      for (const category of categories) {
        // Get competitor data from PostgreSQL
        const competitors = await pool.query(`
          SELECT 
            p.vendor_id,
            AVG(p.base_price) as average_price,
            COUNT(*) as product_count,
            AVG((vp.reputation->>'overall')::float) as reputation,
            vp.specializations
          FROM products p
          LEFT JOIN vendor_profiles vp ON p.vendor_id = vp.vendor_id
          WHERE p.category = $1
          GROUP BY p.vendor_id, vp.specializations
          HAVING COUNT(*) >= 3 -- Only vendors with multiple products
          ORDER BY reputation DESC
          LIMIT 20
        `, [category]);

        const competitorAnalysis = competitors.rows.map(comp => ({
          vendorId: comp.vendor_id,
          averagePrice: parseFloat(comp.average_price || '0'),
          marketShare: 0, // Would need more complex calculation
          reputation: parseFloat(comp.reputation || '0'),
          specializations: comp.specializations || [],
          priceStrategy: this.determinePriceStrategy(parseFloat(comp.average_price || '0'), category)
        }));

        // Update recent market data with competitor analysis
        await mongoDb.collection('market_data').updateMany(
          {
            category: category,
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            competitorAnalysis: { $size: 0 } // Only update if empty
          },
          {
            $set: { competitorAnalysis }
          }
        );
      }

      logger.info('Competitor analysis updated', { categoriesProcessed: categories.length });

    } catch (error) {
      logger.error('Competitor analysis update failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private determinePriceStrategy(averagePrice: number, category: string): 'premium' | 'competitive' | 'budget' {
    // This is a simplified strategy determination
    // In a real system, this would use more sophisticated analysis
    
    const categoryAverages: Record<string, number> = {
      'food_beverages': 100,
      'clothing_textiles': 500,
      'electronics': 2000,
      'jewelry_accessories': 1500,
      'handicrafts': 300
    };

    const categoryAverage = categoryAverages[category] || 500;
    
    if (averagePrice > categoryAverage * 1.3) return 'premium';
    if (averagePrice < categoryAverage * 0.7) return 'budget';
    return 'competitive';
  }
}

// Create and export singleton instance
export const marketDataCollector = new MarketDataCollector(60); // Collect every hour