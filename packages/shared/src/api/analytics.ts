export interface GetMarketAnalyticsRequest {
  location?: LocationInfo;
  category?: string;
  timeRange: TimeRange;
  granularity?: 'daily' | 'weekly' | 'monthly';
  includeForecasts?: boolean;
  includeComparisons?: boolean;
}

export interface GetMarketAnalyticsResponse {
  analytics: MarketAnalytics;
  insights: MarketInsight[];
  comparisons?: MarketComparison[];
  forecasts?: MarketForecast[];
  dataQuality: DataQualityMetrics;
}

export interface MarketComparison {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface GetUserAnalyticsRequest {
  userId: string;
  timeRange: TimeRange;
  includePersonalInsights?: boolean;
  includeBenchmarks?: boolean;
}

export interface GetUserAnalyticsResponse {
  userAnalytics: UserAnalytics;
  personalInsights: PersonalInsight[];
  benchmarks?: UserBenchmark[];
  recommendations: UserRecommendation[];
}

export interface UserAnalytics {
  totalTransactions: number;
  totalValue: number;
  averageTransactionValue: number;
  successRate: number;
  negotiationStats: NegotiationStats;
  paymentStats: PaymentStats;
  categoryBreakdown: CategoryBreakdown[];
  timeSeriesData: UserTimeSeriesData[];
}

export interface NegotiationStats {
  totalNegotiations: number;
  successfulNegotiations: number;
  averageDiscount: number;
  averageDuration: number;
  culturalAdaptations: number;
}

export interface PaymentStats {
  preferredMethods: PaymentMethodUsage[];
  averageProcessingTime: number;
  disputeRate: number;
  onTimePaymentRate: number;
}

export interface PaymentMethodUsage {
  method: PaymentMethod;
  count: number;
  percentage: number;
  averageAmount: number;
}

export interface CategoryBreakdown {
  category: string;
  transactionCount: number;
  totalValue: number;
  averagePrice: number;
  growth: number;
}

export interface UserTimeSeriesData {
  date: Date;
  transactionCount: number;
  totalValue: number;
  averageValue: number;
  successRate: number;
}

export interface PersonalInsight {
  type: 'spending_pattern' | 'negotiation_improvement' | 'payment_optimization' | 'market_opportunity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations: string[];
  potentialSavings?: number;
}

export interface UserBenchmark {
  metric: string;
  userValue: number;
  benchmarkValue: number;
  percentile: number;
  comparison: 'above' | 'at' | 'below';
  category: string;
}

export interface UserRecommendation {
  type: 'cost_saving' | 'efficiency' | 'market_timing' | 'negotiation_strategy';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedBenefit: string;
  actionSteps: string[];
  validUntil?: Date;
}

export interface GetVendorAnalyticsRequest {
  vendorId: string;
  timeRange: TimeRange;
  includeCompetitorAnalysis?: boolean;
  includeMarketPosition?: boolean;
}

export interface GetVendorAnalyticsResponse {
  vendorAnalytics: VendorAnalytics;
  marketPosition: VendorMarketPosition;
  competitorAnalysis?: CompetitorAnalysis;
  growthOpportunities: GrowthOpportunity[];
}

export interface VendorAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerRetentionRate: number;
  reputationTrend: ReputationTrend;
  productPerformance: ProductPerformance[];
  customerSegments: CustomerSegment[];
  seasonalPatterns: SeasonalPattern[];
}

export interface ReputationTrend {
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'stable' | 'declining';
  factors: ReputationFactor[];
}

export interface ReputationFactor {
  factor: 'quality' | 'service' | 'pricing' | 'reliability';
  score: number;
  change: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  salesCount: number;
  revenue: number;
  averageRating: number;
  profitMargin: number;
  marketShare: number;
}

export interface CustomerSegment {
  segment: string;
  customerCount: number;
  averageOrderValue: number;
  retentionRate: number;
  growthRate: number;
  characteristics: string[];
}

export interface SeasonalPattern {
  period: string;
  salesMultiplier: number;
  revenueMultiplier: number;
  topProducts: string[];
  marketFactors: string[];
}

export interface VendorMarketPosition {
  overallRanking: number;
  categoryRanking: number;
  marketShare: number;
  competitiveAdvantages: string[];
  improvementAreas: string[];
  threatLevel: 'low' | 'medium' | 'high';
}

export interface CompetitorAnalysis {
  directCompetitors: CompetitorProfile[];
  marketLeaders: CompetitorProfile[];
  pricingComparison: PricingComparison;
  strengthsWeaknesses: CompetitorSWOT;
}

export interface CompetitorProfile {
  vendorId: string;
  businessName: string;
  marketShare: number;
  averagePrice: number;
  reputation: number;
  strengths: string[];
  weaknesses: string[];
}

export interface PricingComparison {
  yourAveragePrice: number;
  marketAveragePrice: number;
  competitorPrices: CompetitorPrice[];
  pricePosition: 'premium' | 'competitive' | 'budget';
  pricingRecommendations: string[];
}

export interface CompetitorPrice {
  vendorId: string;
  businessName: string;
  averagePrice: number;
  priceStrategy: string;
}

export interface CompetitorSWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface GrowthOpportunity {
  type: 'market_expansion' | 'product_diversification' | 'pricing_optimization' | 'customer_acquisition';
  title: string;
  description: string;
  potentialImpact: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: string;
  requiredActions: string[];
  estimatedROI?: number;
}

export interface GenerateReportRequest {
  reportType: 'market_overview' | 'user_summary' | 'vendor_performance' | 'transaction_analysis';
  parameters: ReportParameters;
  format: 'pdf' | 'excel' | 'json';
  includeCharts?: boolean;
  includeRawData?: boolean;
}

export interface ReportParameters {
  userId?: string;
  vendorId?: string;
  location?: LocationInfo;
  category?: string;
  timeRange: TimeRange;
  customFilters?: Record<string, any>;
}

export interface GenerateReportResponse {
  reportId: string;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  estimatedCompletionTime?: Date;
  message: string;
}

export interface GetReportStatusRequest {
  reportId: string;
}

export interface GetReportStatusResponse {
  reportId: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

// Import types from other files
import { LocationInfo } from '../types/user';
import { MarketAnalytics, MarketInsight, MarketForecast } from '../types/market';
import { PaymentMethod } from '../types/payment';
import { DataQualityMetrics } from './price-discovery';
import { TimeRange } from './price-discovery';