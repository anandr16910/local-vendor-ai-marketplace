import Joi from 'joi';
import { TRANSACTION_STATUS, PAYMENT_METHODS } from '../utils/constants';

// Transaction Record Schema
export const transactionRecordSchema = Joi.object({
  vendorId: Joi.string().uuid().required(),
  buyerId: Joi.string().uuid().required(),
  productInfo: Joi.object({
    productId: Joi.string().uuid().required(),
    name: Joi.string().min(1).max(255).required(),
    category: Joi.string().min(1).max(100).required(),
    quantity: Joi.number().min(0.01).required()
  }).required(),
  amount: Joi.number().min(0.01).required(),
  currency: Joi.string().length(3).default('INR'),
  paymentMethod: Joi.string().valid(...Object.values(PAYMENT_METHODS)).required(),
  location: Joi.object({
    address: Joi.string().min(5).max(500).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).optional()
  }).required(),
  timestamp: Joi.date().default(() => new Date()),
  metadata: Joi.object().optional()
});

// Transaction Filter Schema
export const transactionFilterSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  buyerId: Joi.string().uuid().optional(),
  status: Joi.array().items(Joi.string().valid(...Object.values(TRANSACTION_STATUS))).optional(),
  dateRange: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().min(Joi.ref('start')).required()
  }).optional(),
  amountRange: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(Joi.ref('min')).required()
  }).optional(),
  paymentMethod: Joi.array().items(Joi.string().valid(...Object.values(PAYMENT_METHODS))).optional(),
  category: Joi.string().min(1).max(100).optional(),
  limit: Joi.number().min(1).max(100).default(20),
  offset: Joi.number().min(0).default(0),
  sortBy: Joi.string().valid('timestamp', 'amount', 'status').default('timestamp'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Transaction Update Schema
export const transactionUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(TRANSACTION_STATUS)).optional(),
  paymentProof: Joi.object({
    type: Joi.string().valid('receipt', 'screenshot', 'bank_statement', 'gateway_confirmation').required(),
    fileUrl: Joi.string().uri().required(),
    description: Joi.string().max(500).optional(),
    uploadedAt: Joi.date().default(() => new Date())
  }).optional(),
  notes: Joi.string().max(1000).optional(),
  metadata: Joi.object().optional()
}).min(1);

// Transaction Dispute Schema
export const transactionDisputeSchema = Joi.object({
  transactionId: Joi.string().uuid().required(),
  reason: Joi.string().valid(
    'payment_not_received',
    'wrong_amount',
    'duplicate_payment',
    'unauthorized_payment',
    'service_not_provided',
    'quality_issue',
    'other'
  ).required(),
  description: Joi.string().min(10).max(1000).required(),
  evidence: Joi.array().items(Joi.object({
    type: Joi.string().valid('screenshot', 'receipt', 'communication', 'document', 'other').required(),
    description: Joi.string().max(500).required(),
    fileUrl: Joi.string().uri().required(),
    uploadedAt: Joi.date().default(() => new Date())
  })).min(1).max(10).required(),
  preferredResolution: Joi.string().valid('refund_full', 'refund_partial', 'replacement', 'mediation').optional()
});

// Transaction Analytics Schema
export const transactionAnalyticsSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  userType: Joi.string().valid('vendor', 'buyer').optional(),
  timeRange: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().min(Joi.ref('start')).required()
  }).required(),
  groupBy: Joi.string().valid('day', 'week', 'month').default('day'),
  metrics: Joi.array().items(Joi.string().valid(
    'count',
    'volume',
    'average_value',
    'success_rate',
    'payment_methods',
    'categories',
    'locations'
  )).default(['count', 'volume', 'success_rate']),
  includeComparisons: Joi.boolean().default(false),
  includeForecasts: Joi.boolean().default(false)
});

// Bulk Transaction Import Schema
export const bulkTransactionImportSchema = Joi.object({
  transactions: Joi.array().items(transactionRecordSchema).min(1).max(1000).required(),
  validateOnly: Joi.boolean().default(false),
  skipDuplicates: Joi.boolean().default(true),
  source: Joi.string().valid('manual', 'csv_import', 'api_sync', 'payment_gateway').default('manual')
});

// Transaction Export Schema
export const transactionExportSchema = Joi.object({
  filters: transactionFilterSchema.required(),
  format: Joi.string().valid('csv', 'excel', 'pdf', 'json').default('csv'),
  includeMetadata: Joi.boolean().default(false),
  includeAnalytics: Joi.boolean().default(false),
  emailTo: Joi.string().email().optional()
});

// Transaction Reconciliation Schema
export const transactionReconciliationSchema = Joi.object({
  dateRange: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().min(Joi.ref('start')).required()
  }).required(),
  paymentGateway: Joi.string().optional(),
  autoResolve: Joi.boolean().default(false),
  includeManualTransactions: Joi.boolean().default(true)
});

// Validation Functions
export function validateTransactionRecord(data: any) {
  return transactionRecordSchema.validate(data, { abortEarly: false });
}

export function validateTransactionFilter(data: any) {
  return transactionFilterSchema.validate(data, { abortEarly: false });
}

export function validateTransactionUpdate(data: any) {
  return transactionUpdateSchema.validate(data, { abortEarly: false });
}

export function validateTransactionDispute(data: any) {
  return transactionDisputeSchema.validate(data, { abortEarly: false });
}

export function validateTransactionAnalytics(data: any) {
  return transactionAnalyticsSchema.validate(data, { abortEarly: false });
}

export function validateBulkTransactionImport(data: any) {
  return bulkTransactionImportSchema.validate(data, { abortEarly: false });
}

export function validateTransactionExport(data: any) {
  return transactionExportSchema.validate(data, { abortEarly: false });
}

export function validateTransactionReconciliation(data: any) {
  return transactionReconciliationSchema.validate(data, { abortEarly: false });
}

// Transaction Validation Helpers
export function validateTransactionFlow(currentStatus: string, newStatus: string): { isValid: boolean; error?: string } {
  const validTransitions: Record<string, string[]> = {
    [TRANSACTION_STATUS.INITIATED]: [TRANSACTION_STATUS.PENDING_PAYMENT, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.PENDING_PAYMENT]: [TRANSACTION_STATUS.PAYMENT_CONFIRMED, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.PAYMENT_CONFIRMED]: [TRANSACTION_STATUS.IN_PROGRESS, TRANSACTION_STATUS.DISPUTED],
    [TRANSACTION_STATUS.IN_PROGRESS]: [TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.DISPUTED, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.COMPLETED]: [TRANSACTION_STATUS.DISPUTED],
    [TRANSACTION_STATUS.CANCELLED]: [], // Terminal state
    [TRANSACTION_STATUS.DISPUTED]: [TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.REFUNDED, TRANSACTION_STATUS.CANCELLED],
    [TRANSACTION_STATUS.REFUNDED]: [] // Terminal state
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      isValid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`
    };
  }

  return { isValid: true };
}

export function validateTransactionAmount(amount: number, paymentMethod: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Payment method specific limits
  const methodLimits: Record<string, { min: number; max: number; dailyLimit?: number }> = {
    [PAYMENT_METHODS.UPI]: { min: 1, max: 100000, dailyLimit: 100000 },
    [PAYMENT_METHODS.CASH]: { min: 1, max: 200000 },
    [PAYMENT_METHODS.CARD]: { min: 1, max: 500000 },
    [PAYMENT_METHODS.BANK_TRANSFER]: { min: 1, max: 1000000 },
    [PAYMENT_METHODS.WALLET]: { min: 1, max: 50000 }
  };

  const limits = methodLimits[paymentMethod];
  if (limits) {
    if (amount < limits.min) {
      return {
        isValid: false,
        warnings: [`Amount ₹${amount} is below minimum limit of ₹${limits.min} for ${paymentMethod}`]
      };
    }
    
    if (amount > limits.max) {
      return {
        isValid: false,
        warnings: [`Amount ₹${amount} exceeds maximum limit of ₹${limits.max} for ${paymentMethod}`]
      };
    }
    
    if (limits.dailyLimit && amount > limits.dailyLimit * 0.8) {
      warnings.push(`Amount ₹${amount} is close to daily limit of ₹${limits.dailyLimit} for ${paymentMethod}`);
    }
  }

  return {
    isValid: true,
    warnings
  };
}

export function detectDuplicateTransaction(newTransaction: any, existingTransactions: any[]): { isDuplicate: boolean; matchedTransaction?: any } {
  const threshold = 5 * 60 * 1000; // 5 minutes
  
  for (const existing of existingTransactions) {
    const timeDiff = Math.abs(new Date(newTransaction.timestamp).getTime() - new Date(existing.timestamp).getTime());
    
    if (
      existing.vendorId === newTransaction.vendorId &&
      existing.buyerId === newTransaction.buyerId &&
      existing.amount === newTransaction.amount &&
      existing.paymentMethod === newTransaction.paymentMethod &&
      timeDiff < threshold
    ) {
      return {
        isDuplicate: true,
        matchedTransaction: existing
      };
    }
  }
  
  return { isDuplicate: false };
}