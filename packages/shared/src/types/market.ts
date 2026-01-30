export interface MarketData {
  dataId: string;
  category: string;
  subcategory: string;
  location: LocationInfo;
  pricePoints: PricePoint[];
  demandIndicators: DemandIndicator[];
  seasonalFactors: SeasonalFactor[];
  competitorAnalysis: CompetitorData[];
  timestamp: Date;
  dataSource: string;
  reliability: number;
}

export interface PricePoint {
  price: number;
  quantity: number;
  vendorReputation: number;
  transactionVolume: number;
  timeOfDay: string;
  dayOfWeek: string;
  quality: 'basic' | 'standard' | 'premium';
  verified: boolean;
}

export interface DemandIndicator {
  indicator: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  timeframe: string;
}

export interface SeasonalFactor {
  factor: string;
  impact: number; // -1 to 1
  months: number[];
  description: string;
  historicalData: SeasonalDataPoint[];
}

export interface SeasonalDataPoint {
  month: number;
  year: number;
  multiplier: number;
  volume: number;
}

export interface CompetitorData {
  vendorId: string;
  averagePrice: number;
  marketShare: number;
  reputation: number;
  specializations: string[];
  priceStrategy: 'premium' | 'competitive' | 'budget';
}

export interface MarketTrend {
  trendId: string;
  category: string;
  location: string;
  trend: 'bullish' | 'bearish' | 'stable' | 'volatile';
  strength: number; // 0-100
  duration: string;
  factors: TrendFactor[];
  prediction: MarketPrediction;
  lastUpdated: Date;
}

export interface TrendFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface MarketPrediction {
  timeframe: '1_week' | '1_month' | '3_months' | '6_months';
  predictedTrend: 'up' | 'down' | 'stable';
  confidence: number;
  priceRange: { min: number; max: number };
  keyFactors: string[];
}

export interface PriceRecommendation {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  reasoning: string[];
  marketFactors: MarketFactor[];
  seasonalAdjustments: number;
  competitorComparison: CompetitorComparison;
  demandForecast: DemandForecast;
}

export interface MarketFactor {
  factor: string;
  impact: number; // -1 to 1
  description: string;
  source: string;
  reliability: number;
}

export interface CompetitorComparison {
  averageCompetitorPrice: number;
  pricePosition: 'below' | 'at' | 'above';
  percentageDifference: number;
  competitorCount: number;
  marketShare: number;
}

export interface DemandForecast {
  expectedDemand: 'low' | 'medium' | 'high';
  demandScore: number; // 0-100
  peakTimes: string[];
  seasonalImpact: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
}

export interface MarketInsight {
  insightId: string;
  type: 'price_opportunity' | 'demand_surge' | 'competition_alert' | 'seasonal_trend' | 'market_anomaly';
  title: string;
  description: string;
  category: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations: string[];
  validUntil: Date;
  createdAt: Date;
}

export interface MarketAnalytics {
  totalMarkets: number;
  activeVendors: number;
  totalTransactions: number;
  averageTransactionValue: number;
  marketGrowth: number;
  categoryBreakdown: CategoryAnalytics[];
  locationBreakdown: LocationAnalytics[];
  timeSeriesData: MarketTimeSeriesData[];
}

export interface CategoryAnalytics {
  category: string;
  transactionCount: number;
  totalValue: number;
  averagePrice: number;
  growth: number;
  topVendors: string[];
}

export interface LocationAnalytics {
  location: string;
  transactionCount: number;
  totalValue: number;
  averagePrice: number;
  vendorCount: number;
  growth: number;
}

export interface MarketTimeSeriesData {
  date: Date;
  transactionCount: number;
  totalValue: number;
  averagePrice: number;
  uniqueVendors: number;
  uniqueBuyers: number;
}

export interface PriceValidation {
  isValid: boolean;
  validationScore: number; // 0-100
  issues: PriceValidationIssue[];
  suggestions: string[];
  marketComparison: MarketComparison;
}

export interface PriceValidationIssue {
  type: 'too_high' | 'too_low' | 'unusual_pattern' | 'market_mismatch' | 'seasonal_inappropriate';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface MarketComparison {
  averageMarketPrice: number;
  pricePercentile: number;
  similarProducts: number;
  priceRange: { min: number; max: number };
  lastUpdated: Date;
}

// Import types from other files
import { LocationInfo } from './user';