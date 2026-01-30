import { ERROR_CODES } from './constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      details: this.details,
      stack: this.stack
    };
  }
}

// Authentication Errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, ERROR_CODES.UNAUTHORIZED, true, details);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials provided', details?: any) {
    super(message, 401, ERROR_CODES.INVALID_CREDENTIALS, true, details);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', details?: any) {
    super(message, 401, ERROR_CODES.TOKEN_EXPIRED, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', details?: any) {
    super(message, 403, ERROR_CODES.FORBIDDEN, true, details);
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, true, details);
  }
}

export class RequiredFieldError extends AppError {
  constructor(field: string, details?: any) {
    super(`${field} is required`, 400, ERROR_CODES.REQUIRED_FIELD, true, details);
  }
}

export class InvalidFormatError extends AppError {
  constructor(field: string, expectedFormat: string, details?: any) {
    super(`${field} has invalid format. Expected: ${expectedFormat}`, 400, ERROR_CODES.INVALID_FORMAT, true, details);
  }
}

// Resource Not Found Errors
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string, details?: any) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, `${resource.toUpperCase()}_NOT_FOUND`, true, details);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(identifier?: string, details?: any) {
    super('User', identifier, details);
  }
}

export class VendorNotFoundError extends NotFoundError {
  constructor(identifier?: string, details?: any) {
    super('Vendor', identifier, details);
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor(identifier?: string, details?: any) {
    super('Product', identifier, details);
  }
}

export class NegotiationNotFoundError extends NotFoundError {
  constructor(identifier?: string, details?: any) {
    super('Negotiation', identifier, details);
  }
}

export class TransactionNotFoundError extends NotFoundError {
  constructor(identifier?: string, details?: any) {
    super('Transaction', identifier, details);
  }
}

// Business Logic Errors
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', true, details);
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(resource: string, field: string, value: string, details?: any) {
    super(`${resource} with ${field} '${value}' already exists`, details);
  }
}

// Payment Errors
export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed', details?: any) {
    super(message, 402, ERROR_CODES.PAYMENT_FAILED, true, details);
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(message: string = 'Insufficient funds', details?: any) {
    super(message, 402, ERROR_CODES.INSUFFICIENT_FUNDS, true, details);
  }
}

export class PaymentGatewayError extends PaymentError {
  constructor(message: string = 'Payment gateway error', details?: any) {
    super(message, 502, ERROR_CODES.PAYMENT_GATEWAY_ERROR, true, details);
  }
}

// Translation Errors
export class TranslationError extends AppError {
  constructor(message: string = 'Translation failed', details?: any) {
    super(message, 422, ERROR_CODES.TRANSLATION_FAILED, true, details);
  }
}

export class UnsupportedLanguageError extends TranslationError {
  constructor(language: string, details?: any) {
    super(`Language '${language}' is not supported`, details);
    this.code = ERROR_CODES.UNSUPPORTED_LANGUAGE;
  }
}

export class LowConfidenceTranslationError extends TranslationError {
  constructor(confidence: number, details?: any) {
    super(`Translation confidence too low: ${confidence}%`, details);
    this.code = ERROR_CODES.TRANSLATION_CONFIDENCE_LOW;
  }
}

// System Errors
export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: any) {
    super(`${service} service is currently unavailable`, 503, ERROR_CODES.SERVICE_UNAVAILABLE, true, details);
  }
}

export class RateLimitExceededError extends AppError {
  constructor(limit: string, details?: any) {
    super(`Rate limit exceeded: ${limit}`, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED, true, details);
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeout: number, details?: any) {
    super(`Operation '${operation}' timed out after ${timeout}ms`, 408, 'TIMEOUT_ERROR', true, details);
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', false, details);
  }
}

export class ConnectionError extends DatabaseError {
  constructor(database: string, details?: any) {
    super(`Failed to connect to ${database} database`, details);
    this.code = 'DATABASE_CONNECTION_ERROR';
  }
}

// File Upload Errors
export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed', details?: any) {
    super(message, 400, 'FILE_UPLOAD_ERROR', true, details);
  }
}

export class FileSizeExceededError extends FileUploadError {
  constructor(maxSize: number, actualSize: number, details?: any) {
    super(`File size ${actualSize} bytes exceeds maximum allowed size of ${maxSize} bytes`, details);
    this.code = 'FILE_SIZE_EXCEEDED';
  }
}

export class UnsupportedFileTypeError extends FileUploadError {
  constructor(fileType: string, allowedTypes: string[], details?: any) {
    super(`File type '${fileType}' is not supported. Allowed types: ${allowedTypes.join(', ')}`, details);
    this.code = 'UNSUPPORTED_FILE_TYPE';
  }
}

// Error Factory Functions
export function createValidationError(errors: Array<{ field: string; message: string }>): ValidationError {
  const message = errors.map(e => `${e.field}: ${e.message}`).join(', ');
  return new ValidationError(`Validation failed: ${message}`, { errors });
}

export function createNotFoundError(resource: string, identifier?: string): NotFoundError {
  return new NotFoundError(resource, identifier);
}

export function createBusinessLogicError(message: string, context?: any): BusinessLogicError {
  return new BusinessLogicError(message, context);
}

// Error Handler Utility
export class ErrorHandler {
  static handle(error: Error): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, { originalError: error });
    }

    if (error.name === 'CastError') {
      return new ValidationError('Invalid data format', { originalError: error });
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return new DatabaseError(error.message, { originalError: error });
    }

    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token', { originalError: error });
    }

    if (error.name === 'TokenExpiredError') {
      return new TokenExpiredError('Token has expired', { originalError: error });
    }

    // Default to internal server error
    return new AppError(
      'An unexpected error occurred',
      500,
      ERROR_CODES.INTERNAL_ERROR,
      false,
      { originalError: error }
    );
  }

  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  static formatErrorResponse(error: AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        ...(error.details && { details: error.details })
      }
    };
  }
}

// Type Guards
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: any): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isNotFoundError(error: any): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isPaymentError(error: any): error is PaymentError {
  return error instanceof PaymentError;
}

export function isTranslationError(error: any): error is TranslationError {
  return error instanceof TranslationError;
}