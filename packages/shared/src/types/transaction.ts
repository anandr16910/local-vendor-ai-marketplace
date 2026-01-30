export interface Transaction {
  transactionId: string;
  vendorId: string;
  buyerId: string;
  productId: string;
  negotiationSessionId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: TransactionStatus;
  timestamps: TransactionTimestamps;
  metadata: TransactionMetadata;
}

export interface TransactionTimestamps {
  initiated: Date;
  confirmed?: Date;
  completed?: Date;
  cancelled?: Date;
}

export interface TransactionMetadata {
  location: LocationInfo;
  negotiationDuration?: number;
  culturalContext: CulturalContext;
  priceDiscoveryData: PriceDiscoveryData;
  feedbackSubmitted: boolean;
}

export interface PriceDiscoveryData {
  suggestedPrice: number;
  finalPrice: number;
  priceRange: { min: number; max: number };
  marketFactors: string[];
  confidence: number;
}

export type TransactionStatus = 
  | 'initiated'
  | 'pending_payment'
  | 'payment_confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export interface TransactionFilter {
  userId?: string;
  vendorId?: string;
  buyerId?: string;
  status?: TransactionStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  paymentMethod?: string[];
  category?: string;
}

export interface TransactionRecord {
  transactionId: string;
  vendorId: string;
  buyerId: string;
  productInfo: {
    productId: string;
    name: string;
    category: string;
    quantity: number;
  };
  amount: number;
  currency: string;
  paymentMethod: string;
  location: LocationInfo;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Import types from other files
import { LocationInfo } from './user';
import { CulturalContext } from './cultural';