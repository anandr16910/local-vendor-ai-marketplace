export interface InitiatePaymentRequest {
  paymentRequest: PaymentRequest;
  returnUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface InitiatePaymentResponse {
  paymentSession: PaymentSession;
  paymentUrl?: string;
  qrCode?: string;
  instructions: PaymentInstructions;
}

export interface PaymentInstructions {
  method: PaymentMethod;
  steps: string[];
  expiresAt: Date;
  supportContact?: string;
  troubleshooting?: string[];
}

export interface VerifyPaymentRequest {
  transactionId: string;
  gatewayTransactionId?: string;
  verificationCode?: string;
}

export interface VerifyPaymentResponse {
  paymentVerification: PaymentVerification;
  transactionDetails: TransactionDetails;
  nextSteps: string[];
}

export interface TransactionDetails {
  transactionId: string;
  amount: number;
  currency: string;
  fees: PaymentFee[];
  netAmount: number;
  processedAt: Date;
  settlementDate: Date;
  gatewayResponse: Record<string, any>;
}

export interface RecordTransactionRequest {
  transaction: TransactionRecord;
  paymentProof?: PaymentProof;
  verificationLevel: 'self_reported' | 'receipt_verified' | 'gateway_confirmed';
}

export interface PaymentProof {
  type: 'receipt' | 'screenshot' | 'bank_statement' | 'gateway_confirmation';
  fileUrl: string;
  description?: string;
  uploadedAt: Date;
}

export interface RecordTransactionResponse {
  success: boolean;
  transactionId: string;
  verificationStatus: 'pending' | 'verified' | 'disputed';
  message: string;
}

export interface GetTransactionHistoryRequest {
  userId: string;
  filters: TransactionFilter;
  includeMetadata?: boolean;
  exportFormat?: 'json' | 'csv' | 'pdf';
}

export interface GetTransactionHistoryResponse {
  transactions: TransactionHistoryItem[];
  totalCount: number;
  summary: TransactionSummary;
  exportUrl?: string;
}

export interface TransactionHistoryItem {
  transactionId: string;
  type: 'payment' | 'refund' | 'fee';
  amount: number;
  currency: string;
  status: PaymentStatus;
  counterparty: Counterparty;
  productInfo: ProductInfo;
  timestamp: Date;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface Counterparty {
  userId: string;
  name: string;
  type: 'vendor' | 'buyer';
  reputation?: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageTransactionValue: number;
  methodBreakdown: PaymentMethodBreakdown[];
}

export interface HandleDisputeRequest {
  transactionId: string;
  dispute: DisputeInfo;
  evidence: DisputeEvidence[];
  preferredResolution?: string;
}

export interface HandleDisputeResponse {
  disputeId: string;
  status: DisputeStatus;
  estimatedResolutionTime: string;
  nextSteps: string[];
  mediationAvailable: boolean;
}

export interface GetPaymentMethodsRequest {
  userId?: string;
  location?: LocationInfo;
  amount?: number;
  currency?: string;
}

export interface GetPaymentMethodsResponse {
  availableMethods: PaymentMethodInfo[];
  recommendedMethod: PaymentMethod;
  regionalPreferences: RegionalPaymentPreference[];
}

export interface PaymentMethodInfo {
  method: PaymentMethod;
  displayName: string;
  description: string;
  isAvailable: boolean;
  fees: PaymentFee[];
  limits: PaymentLimits;
  processingTime: string;
  supportedCurrencies: string[];
  icon: string;
}

export interface RegionalPaymentPreference {
  region: string;
  preferredMethods: PaymentMethod[];
  usage: number; // percentage
  culturalFactors: string[];
}

export interface ConvertCurrencyRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  provider?: string;
}

export interface ConvertCurrencyResponse {
  currencyConversion: CurrencyConversion;
  alternativeRates: AlternativeRate[];
  marketInfo: CurrencyMarketInfo;
}

export interface AlternativeRate {
  provider: string;
  rate: number;
  convertedAmount: number;
  fees: number;
  totalCost: number;
}

export interface CurrencyMarketInfo {
  trend: 'up' | 'down' | 'stable';
  volatility: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  historicalRates: HistoricalRate[];
}

export interface HistoricalRate {
  date: Date;
  rate: number;
  volume: number;
}

export interface GetPaymentAnalyticsRequest {
  userId?: string;
  dateRange: TimeRange;
  groupBy?: 'day' | 'week' | 'month';
  includeForecasts?: boolean;
}

export interface GetPaymentAnalyticsResponse {
  analytics: PaymentAnalytics;
  trends: PaymentTrend[];
  insights: PaymentInsight[];
  forecasts?: PaymentForecast[];
}

export interface PaymentTrend {
  metric: 'volume' | 'value' | 'success_rate' | 'method_preference';
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  timeframe: string;
}

export interface PaymentInsight {
  type: 'cost_optimization' | 'method_recommendation' | 'timing_suggestion' | 'risk_alert';
  title: string;
  description: string;
  actionable: boolean;
  potentialSavings?: number;
  recommendations: string[];
}

export interface PaymentForecast {
  timeframe: '1_week' | '1_month' | '3_months';
  predictedVolume: number;
  predictedValue: number;
  confidence: number;
  factors: string[];
}

// Import types from other files
import { PaymentRequest, PaymentSession, PaymentVerification, PaymentMethod, PaymentStatus, PaymentFee, PaymentLimits, PaymentMethodBreakdown, DisputeInfo, DisputeEvidence, DisputeStatus, CurrencyConversion, PaymentAnalytics } from '../types/payment';
import { TransactionRecord, TransactionFilter } from '../types/transaction';
import { ProductInfo } from './price-discovery';
import { LocationInfo } from '../types/user';
import { TimeRange } from './price-discovery';