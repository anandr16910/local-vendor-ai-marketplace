export interface StartNegotiationRequest {
  vendorId: string;
  buyerId: string;
  productId: string;
  initialOffer?: NegotiationOffer;
  culturalPreferences?: CulturalPreference[];
  negotiationGoals?: NegotiationGoals;
}

export interface NegotiationGoals {
  targetPrice?: number;
  maxPrice?: number;
  minPrice?: number;
  desiredQuantity: number;
  timeline?: string;
  priorities: NegotiationPriority[];
}

export interface NegotiationPriority {
  factor: 'price' | 'quality' | 'delivery_time' | 'payment_terms' | 'warranty';
  importance: 'low' | 'medium' | 'high';
  weight: number;
}

export interface StartNegotiationResponse {
  negotiationSession: NegotiationSession;
  culturalGuidance: CulturalGuidance;
  marketContext: MarketContext;
  recommendations: string[];
}

export interface MarketContext {
  fairPriceRange: { min: number; max: number };
  marketPosition: string;
  demandLevel: 'low' | 'medium' | 'high';
  competitorPricing: number[];
  seasonalFactors: string[];
}

export interface SubmitOfferRequest {
  sessionId: string;
  offer: NegotiationOffer;
  message?: string;
  culturalContext?: CulturalContext;
}

export interface SubmitOfferResponse {
  negotiationResponse: NegotiationResponse;
  updatedSession: NegotiationSession;
  aiAnalysis: OfferAnalysis;
  nextSteps: string[];
}

export interface OfferAnalysis {
  fairnessScore: number;
  acceptanceProbability: number;
  marketComparison: MarketComparison;
  strategicAdvice: string[];
  culturalConsiderations: string[];
}

export interface GetCulturalGuidanceRequest {
  sessionId: string;
  action: 'make_offer' | 'respond_to_offer' | 'negotiate_terms' | 'close_deal' | 'handle_rejection';
  context?: Record<string, any>;
}

export interface GetCulturalGuidanceResponse {
  culturalGuidance: CulturalGuidance;
  examples: CulturalExample[];
  warnings: CulturalWarning[];
}

export interface CulturalExample {
  situation: string;
  appropriateResponse: string;
  inappropriateResponse: string;
  explanation: string;
}

export interface CulturalWarning {
  type: 'language' | 'behavior' | 'timing' | 'gesture' | 'custom';
  warning: string;
  severity: 'low' | 'medium' | 'high';
  alternative: string;
}

export interface SuggestCompromiseRequest {
  sessionId: string;
  currentImpasse?: ImpasseDetails;
  priorities?: NegotiationPriority[];
}

export interface ImpasseDetails {
  stuckOn: 'price' | 'terms' | 'timing' | 'quality' | 'other';
  duration: number; // minutes
  lastOffers: NegotiationOffer[];
  emotionalTone: 'neutral' | 'frustrated' | 'impatient' | 'hostile';
}

export interface SuggestCompromiseResponse {
  compromiseSuggestions: CompromiseSuggestion[];
  alternativeApproaches: AlternativeApproach[];
  culturalMediationTips: string[];
}

export interface AlternativeApproach {
  approach: string;
  description: string;
  expectedOutcome: string;
  culturalFit: number;
  successProbability: number;
}

export interface FinalizeAgreementRequest {
  sessionId: string;
  terms: AgreementTerms;
  signatures: ParticipantSignature[];
}

export interface AgreementTerms {
  finalPrice: number;
  quantity: number;
  paymentTerms: PaymentTerms;
  deliveryTerms: DeliveryTerms;
  qualityStandards: QualityStandard[];
  warranties: Warranty[];
  additionalConditions: string[];
}

export interface QualityStandard {
  aspect: string;
  requirement: string;
  measurementMethod: string;
  acceptanceCriteria: string;
}

export interface Warranty {
  type: 'replacement' | 'repair' | 'refund' | 'service';
  duration: string;
  coverage: string;
  conditions: string[];
}

export interface ParticipantSignature {
  userId: string;
  signature: string; // Digital signature or agreement confirmation
  timestamp: Date;
  ipAddress: string;
}

export interface FinalizeAgreementResponse {
  agreement: Agreement;
  legalDocument: string; // URL to generated legal document
  nextSteps: string[];
  paymentInstructions?: PaymentInstructions;
}

export interface PaymentInstructions {
  method: string;
  amount: number;
  dueDate: Date;
  instructions: string;
  paymentLink?: string;
}

export interface GetNegotiationHistoryRequest {
  userId?: string;
  sessionId?: string;
  status?: NegotiationStatus[];
  dateRange?: TimeRange;
  limit?: number;
  offset?: number;
}

export interface GetNegotiationHistoryResponse {
  negotiations: NegotiationSummary[];
  totalCount: number;
  statistics: NegotiationStatistics;
}

export interface NegotiationSummary {
  sessionId: string;
  participants: Participant[];
  productName: string;
  status: NegotiationStatus;
  duration: number;
  finalPrice?: number;
  startedAt: Date;
  completedAt?: Date;
  successRate: number;
}

export interface NegotiationStatistics {
  totalNegotiations: number;
  successRate: number;
  averageDuration: number;
  averageDiscount: number;
  mostCommonOutcome: string;
  culturalAdaptations: number;
}

// Import types from other files
import { NegotiationSession, NegotiationOffer, NegotiationResponse, Agreement, CompromiseSuggestion, Participant, NegotiationStatus } from '../types/negotiation';
import { CulturalGuidance, CulturalContext, CulturalPreference } from '../types/cultural';
import { PaymentTerms, DeliveryTerms } from '../types/negotiation';
import { MarketComparison } from '../types/market';
import { TimeRange } from './price-discovery';