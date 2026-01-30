export interface NegotiationSession {
  sessionId: string;
  participants: Participant[];
  productId: string;
  currentOffer: NegotiationOffer;
  negotiationHistory: NegotiationEvent[];
  culturalContext: CulturalContext;
  status: NegotiationStatus;
  startedAt: Date;
  lastActivity: Date;
  expiresAt?: Date;
  finalAgreement?: Agreement;
}

export interface Participant {
  userId: string;
  role: 'vendor' | 'buyer';
  name: string;
  isOnline: boolean;
  joinedAt: Date;
  lastSeen: Date;
}

export interface NegotiationOffer {
  offerId: string;
  fromUserId: string;
  toUserId: string;
  price: number;
  quantity: number;
  conditions: OfferCondition[];
  message?: string;
  timestamp: Date;
  expiresAt?: Date;
  status: OfferStatus;
}

export interface OfferCondition {
  type: 'delivery' | 'payment' | 'quality' | 'timing' | 'warranty' | 'custom';
  description: string;
  value?: string;
  isNegotiable: boolean;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';

export type NegotiationStatus = 'active' | 'paused' | 'completed' | 'cancelled' | 'expired';

export interface NegotiationEvent {
  eventId: string;
  sessionId: string;
  type: NegotiationEventType;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
  message?: string;
}

export type NegotiationEventType = 
  | 'session_started'
  | 'offer_made'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'counter_offer'
  | 'message_sent'
  | 'cultural_guidance'
  | 'compromise_suggested'
  | 'session_paused'
  | 'session_resumed'
  | 'agreement_reached'
  | 'session_cancelled';

export interface Agreement {
  agreementId: string;
  sessionId: string;
  finalPrice: number;
  quantity: number;
  conditions: OfferCondition[];
  paymentTerms: PaymentTerms;
  deliveryTerms: DeliveryTerms;
  agreedAt: Date;
  signedBy: string[];
  isBinding: boolean;
}

export interface PaymentTerms {
  method: string;
  schedule: 'immediate' | 'on_delivery' | 'installments';
  installmentPlan?: InstallmentPlan;
  currency: string;
}

export interface InstallmentPlan {
  numberOfInstallments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'monthly';
  startDate: Date;
}

export interface DeliveryTerms {
  method: 'pickup' | 'delivery' | 'shipping';
  location?: string;
  estimatedTime: string;
  cost: number;
  responsibility: 'vendor' | 'buyer' | 'shared';
}

export interface NegotiationResponse {
  success: boolean;
  session: NegotiationSession;
  suggestions?: string[];
  culturalGuidance?: CulturalGuidance;
  fairnessAssessment?: FairnessAssessment;
}

export interface FairnessAssessment {
  isFair: boolean;
  score: number; // 0-100
  factors: FairnessFactor[];
  marketComparison: MarketComparison;
  recommendation: string;
}

export interface FairnessFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface MarketComparison {
  averagePrice: number;
  priceRange: { min: number; max: number };
  percentile: number;
  similarOffers: number;
}

export interface CompromiseSuggestion {
  suggestionId: string;
  type: 'price_split' | 'condition_adjustment' | 'alternative_offer' | 'package_deal';
  description: string;
  proposedTerms: Partial<NegotiationOffer>;
  reasoning: string;
  culturalConsiderations: string[];
  acceptanceProbability: number;
}

// Import types from other files
import { CulturalContext, CulturalGuidance } from './cultural';