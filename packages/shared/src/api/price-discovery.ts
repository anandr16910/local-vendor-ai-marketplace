export interface GetPriceRecommendationRequest {
  product: ProductInfo;
  vendor: VendorInfo;
  location: LocationInfo;
  quantity?: number;
  urgency?: 'low' | 'medium' | 'high';
  targetMargin?: number;
}

export interface ProductInfo {
  productId?: string;
  name: string;
  category: string;
  subcategory?: string;
  specifications: ProductSpecification[];
  quality: 'basic' | 'standard' | 'premium';
  brand?: string;
}

export interface VendorInfo {
  vendorId: string;
  reputation: number;
  specializations: string[];
  yearsActive: number;
  verificationLevel: 'basic' | 'standard' | 'premium';
}

export interface GetPriceRecommendationResponse {
  priceRecommendation: PriceRecommendation;
  marketAnalysis: MarketAnalysis;
  competitorInsights: CompetitorInsights;
  recommendations: string[];
}

export interface MarketAnalysis {
  marketSize: number;
  demandLevel: 'low' | 'medium' | 'high';
  supplyLevel: 'low' | 'medium' | 'high';
  marketTrend: 'growing' | 'stable' | 'declining';
  seasonalFactor: number;
  competitionLevel: 'low' | 'medium' | 'high';
}

export interface CompetitorInsights {
  competitorCount: number;
  averageCompetitorPrice: number;
  priceRange: { min: number; max: number };
  marketLeaders: CompetitorProfile[];
  pricingStrategies: string[];
}

export interface CompetitorProfile {
  vendorId: string;
  businessName: string;
  price: number;
  reputation: number;
  marketShare: number;
  strengths: string[];
}

export interface UpdateMarketDataRequest {
  transaction: TransactionData;
  verificationLevel: 'user_reported' | 'system_verified' | 'third_party_verified';
}

export interface TransactionData {
  productInfo: ProductInfo;
  price: number;
  quantity: number;
  location: LocationInfo;
  timestamp: Date;
  vendorId: string;
  buyerId: string;
  paymentMethod: string;
  negotiationDuration?: number;
  qualityRating?: number;
}

export interface UpdateMarketDataResponse {
  success: boolean;
  dataId: string;
  impactScore: number;
  message: string;
}

export interface GetMarketTrendsRequest {
  category: string;
  location: string;
  timeRange: TimeRange;
  granularity?: 'daily' | 'weekly' | 'monthly';
  includeForecasts?: boolean;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface GetMarketTrendsResponse {
  trends: MarketTrend[];
  insights: MarketInsight[];
  forecasts?: MarketForecast[];
  dataQuality: DataQualityMetrics;
}

export interface MarketForecast {
  timeframe: '1_week' | '1_month' | '3_months' | '6_months';
  predictedTrend: 'up' | 'down' | 'stable';
  confidence: number;
  priceRange: { min: number; max: number };
  keyFactors: string[];
  scenarios: ForecastScenario[];
}

export interface ForecastScenario {
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
  probability: number;
  priceChange: number;
  description: string;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  timeliness: number;
  consistency: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface ValidatePricingRequest {
  price: number;
  product: ProductInfo;
  vendor: VendorInfo;
  location: LocationInfo;
  context?: PricingContext;
}

export interface PricingContext {
  negotiationStage: 'initial' | 'counter' | 'final';
  buyerProfile?: BuyerProfile;
  urgency: 'low' | 'medium' | 'high';
  volume: number;
  relationship: 'new' | 'returning' | 'loyal';
}

export interface BuyerProfile {
  buyerId: string;
  reputation: number;
  purchaseHistory: number;
  preferredPriceRange?: { min: number; max: number };
  negotiationStyle: 'aggressive' | 'moderate' | 'passive';
}

export interface ValidatePricingResponse {
  priceValidation: PriceValidation;
  suggestions: PricingSuggestion[];
  marketPosition: MarketPosition;
  riskAssessment: PricingRiskAssessment;
}

export interface PricingSuggestion {
  type: 'increase' | 'decrease' | 'maintain' | 'bundle' | 'discount';
  suggestedPrice: number;
  reasoning: string;
  expectedOutcome: string;
  confidence: number;
}

export interface MarketPosition {
  percentile: number;
  position: 'budget' | 'competitive' | 'premium' | 'luxury';
  competitorComparison: CompetitorComparison;
  valueProposition: string[];
}

export interface PricingRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  risks: PricingRisk[];
  mitigationStrategies: string[];
}

export interface PricingRisk {
  type: 'market_rejection' | 'competitor_response' | 'margin_erosion' | 'demand_drop';
  probability: number;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

// Import types from other files
import { LocationInfo } from '../types/user';
import { ProductSpecification } from '../types/product';
import { PriceRecommendation, MarketTrend, MarketInsight, PriceValidation, CompetitorComparison } from '../types/market';