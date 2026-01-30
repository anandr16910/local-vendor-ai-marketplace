export interface PaymentRequest {
  amount: number;
  currency: string;
  vendorId: string;
  buyerId: string;
  productInfo: ProductInfo;
  paymentMethod: PaymentMethod;
  negotiationSessionId?: string;
  metadata?: Record<string, any>;
}

export interface ProductInfo {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'UPI' | 'PAYTM' | 'CASH' | 'WALLET' | 'BANK_TRANSFER' | 'CARD';

export interface PaymentSession {
  sessionId: string;
  paymentRequest: PaymentRequest;
  status: PaymentStatus;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt: Date;
  createdAt: Date;
  metadata: PaymentSessionMetadata;
}

export interface PaymentSessionMetadata {
  gatewayTransactionId?: string;
  gatewayProvider: string;
  retryCount: number;
  lastError?: string;
  ipAddress: string;
  userAgent: string;
}

export type PaymentStatus = 
  | 'initiated'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'disputed';

export interface PaymentVerification {
  isVerified: boolean;
  transactionId: string;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  verifiedAt: Date;
  gatewayResponse: Record<string, any>;
}

export interface PaymentGatewayConfig {
  provider: string;
  isActive: boolean;
  supportedMethods: PaymentMethod[];
  configuration: Record<string, any>;
  fees: PaymentFee[];
  limits: PaymentLimits;
}

export interface PaymentFee {
  method: PaymentMethod;
  type: 'fixed' | 'percentage' | 'tiered';
  value: number;
  minimumFee?: number;
  maximumFee?: number;
}

export interface PaymentLimits {
  minimumAmount: number;
  maximumAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface DisputeInfo {
  disputeId: string;
  transactionId: string;
  raisedBy: string;
  reason: DisputeReason;
  description: string;
  evidence: DisputeEvidence[];
  status: DisputeStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: DisputeResolution;
}

export type DisputeReason = 
  | 'payment_not_received'
  | 'wrong_amount'
  | 'duplicate_payment'
  | 'unauthorized_payment'
  | 'service_not_provided'
  | 'quality_issue'
  | 'other';

export interface DisputeEvidence {
  type: 'screenshot' | 'receipt' | 'communication' | 'document' | 'other';
  description: string;
  fileUrl: string;
  uploadedAt: Date;
}

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed' | 'escalated';

export interface DisputeResolution {
  resolution: 'refund_full' | 'refund_partial' | 'no_refund' | 'mediation' | 'escalated';
  amount?: number;
  description: string;
  resolvedBy: string;
  resolvedAt: Date;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  amount: number;
  convertedAmount: number;
  provider: string;
  timestamp: Date;
  expiresAt: Date;
}

export interface PaymentAnalytics {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  averageTransactionValue: number;
  methodBreakdown: PaymentMethodBreakdown[];
  timeSeriesData: PaymentTimeSeriesData[];
  disputeRate: number;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  count: number;
  amount: number;
  successRate: number;
  averageProcessingTime: number;
}

export interface PaymentTimeSeriesData {
  date: Date;
  transactionCount: number;
  totalAmount: number;
  successRate: number;
}