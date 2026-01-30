// User Types
export const USER_TYPES = {
  VENDOR: 'vendor',
  BUYER: 'buyer',
  INTERMEDIARY: 'intermediary'
} as const;

// Languages
export const SUPPORTED_LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
  BENGALI: 'bn',
  TELUGU: 'te',
  MARATHI: 'mr',
  TAMIL: 'ta',
  GUJARATI: 'gu',
  URDU: 'ur',
  KANNADA: 'kn',
  ODIA: 'or',
  MALAYALAM: 'ml',
  PUNJABI: 'pa'
} as const;

export const LANGUAGE_NAMES = {
  [SUPPORTED_LANGUAGES.ENGLISH]: 'English',
  [SUPPORTED_LANGUAGES.HINDI]: 'हिन्दी',
  [SUPPORTED_LANGUAGES.BENGALI]: 'বাংলা',
  [SUPPORTED_LANGUAGES.TELUGU]: 'తెలుగు',
  [SUPPORTED_LANGUAGES.MARATHI]: 'मराठी',
  [SUPPORTED_LANGUAGES.TAMIL]: 'தமிழ்',
  [SUPPORTED_LANGUAGES.GUJARATI]: 'ગુજરાતી',
  [SUPPORTED_LANGUAGES.URDU]: 'اردو',
  [SUPPORTED_LANGUAGES.KANNADA]: 'ಕನ್ನಡ',
  [SUPPORTED_LANGUAGES.ODIA]: 'ଓଡ଼ିଆ',
  [SUPPORTED_LANGUAGES.MALAYALAM]: 'മലയാളം',
  [SUPPORTED_LANGUAGES.PUNJABI]: 'ਪੰਜਾਬੀ'
} as const;

// Business Types
export const BUSINESS_TYPES = {
  INDIVIDUAL: 'individual',
  PARTNERSHIP: 'partnership',
  COMPANY: 'company',
  COOPERATIVE: 'cooperative'
} as const;

// Verification Levels
export const VERIFICATION_LEVELS = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium'
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  UPI: 'UPI',
  PAYTM: 'PAYTM',
  CASH: 'CASH',
  WALLET: 'WALLET',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD: 'CARD'
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  INITIATED: 'initiated',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed'
} as const;

// Transaction Status
export const TRANSACTION_STATUS = {
  INITIATED: 'initiated',
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded'
} as const;

// Negotiation Status
export const NEGOTIATION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

// Offer Status
export const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COUNTERED: 'countered',
  EXPIRED: 'expired'
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = {
  FOOD_BEVERAGES: 'food_beverages',
  CLOTHING_TEXTILES: 'clothing_textiles',
  ELECTRONICS: 'electronics',
  HOME_GARDEN: 'home_garden',
  HEALTH_BEAUTY: 'health_beauty',
  AUTOMOTIVE: 'automotive',
  BOOKS_MEDIA: 'books_media',
  SPORTS_RECREATION: 'sports_recreation',
  JEWELRY_ACCESSORIES: 'jewelry_accessories',
  HANDICRAFTS: 'handicrafts',
  SERVICES: 'services',
  OTHER: 'other'
} as const;

// Cultural Preferences
export const CULTURAL_CATEGORIES = {
  NEGOTIATION_STYLE: 'negotiation_style',
  COMMUNICATION: 'communication',
  BUSINESS_ETIQUETTE: 'business_etiquette',
  RELIGIOUS_CUSTOMS: 'religious_customs',
  FESTIVAL_PRACTICES: 'festival_practices',
  PAYMENT_PREFERENCES: 'payment_preferences',
  TIME_ORIENTATION: 'time_orientation'
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  NEGOTIATION_UPDATE: 'negotiation_update',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  PRICE_ALERT: 'price_alert',
  MARKET_INSIGHT: 'market_insight',
  VERIFICATION_UPDATE: 'verification_update',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Business Logic
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VENDOR_NOT_FOUND: 'VENDOR_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  NEGOTIATION_NOT_FOUND: 'NEGOTIATION_NOT_FOUND',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  
  // Translation
  TRANSLATION_FAILED: 'TRANSLATION_FAILED',
  UNSUPPORTED_LANGUAGE: 'UNSUPPORTED_LANGUAGE',
  TRANSLATION_CONFIDENCE_LOW: 'TRANSLATION_CONFIDENCE_LOW'
} as const;

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning'
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  MAX_IMAGES_PER_PRODUCT: 10
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  TRANSLATION: 24 * 60 * 60, // 24 hours
  MARKET_DATA: 5 * 60, // 5 minutes
  USER_PROFILE: 30 * 60, // 30 minutes
  PRODUCT_SEARCH: 10 * 60, // 10 minutes
  PRICE_RECOMMENDATION: 15 * 60 // 15 minutes
} as const;

// Rate Limits
export const RATE_LIMITS = {
  TRANSLATION_PER_MINUTE: 60,
  API_REQUESTS_PER_MINUTE: 100,
  NEGOTIATION_OFFERS_PER_HOUR: 50,
  FILE_UPLOADS_PER_HOUR: 20
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  TRANSLATION_REQUEST: 10000, // 10 seconds
  PAYMENT_VERIFICATION: 60000, // 60 seconds
  NEGOTIATION_OFFER_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  INDIAN_PHONE: /^(\+91|91)?[6-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PINCODE: /^[1-9][0-9]{5}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  UPI_ID: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
} as const;

// Default Values
export const DEFAULTS = {
  LANGUAGE: SUPPORTED_LANGUAGES.ENGLISH,
  CURRENCY: 'INR',
  TIMEZONE: 'Asia/Kolkata',
  COUNTRY: 'IN',
  REPUTATION_SCORE: 0,
  SERVICE_RADIUS: 10, // kilometers
  SESSION_TIMEOUT: 30 * 60, // 30 minutes
  MFA_CODE_EXPIRY: 5 * 60, // 5 minutes
  PASSWORD_RESET_EXPIRY: 60 * 60 // 1 hour
} as const;

// Feature Flags
export const FEATURES = {
  VOICE_TRANSLATION: true,
  CULTURAL_ADAPTATION: true,
  REAL_TIME_NEGOTIATION: true,
  PAYMENT_INTEGRATION: true,
  MARKET_ANALYTICS: true,
  MULTI_FACTOR_AUTH: true,
  OFFLINE_MODE: false, // To be implemented
  INTERNATIONAL_PAYMENTS: false // To be implemented
} as const;

// Environment
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
} as const;

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
] as const;

// Major Indian Cities
export const MAJOR_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
  'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
  'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar',
  'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar'
] as const;