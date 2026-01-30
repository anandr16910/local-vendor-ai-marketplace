import Joi from 'joi';
import { SUPPORTED_LANGUAGES, USER_TYPES, INDIAN_STATES, REGEX_PATTERNS } from '../utils/constants';

// Location Schema
export const locationSchema = Joi.object({
  address: Joi.string().min(5).max(500).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().valid(...INDIAN_STATES).required(),
  pincode: Joi.string().pattern(REGEX_PATTERNS.PINCODE).required(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).optional()
});

// Personal Info Schema
export const personalInfoSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phoneNumber: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).required(),
  email: Joi.string().email().optional(),
  preferredLanguage: Joi.string().valid(...Object.values(SUPPORTED_LANGUAGES)).required(),
  location: locationSchema.required(),
  profileImage: Joi.string().uri().optional()
});

// Cultural Preference Schema
export const culturalPreferenceSchema = Joi.object({
  category: Joi.string().min(2).max(50).required(),
  preference: Joi.string().min(2).max(200).required(),
  importance: Joi.string().valid('low', 'medium', 'high').required(),
  description: Joi.string().max(500).optional()
});

// Notification Settings Schema
export const notificationSettingsSchema = Joi.object({
  email: Joi.boolean().required(),
  sms: Joi.boolean().required(),
  push: Joi.boolean().required(),
  negotiationUpdates: Joi.boolean().required(),
  priceAlerts: Joi.boolean().required(),
  marketInsights: Joi.boolean().required()
});

// Privacy Settings Schema
export const privacySettingsSchema = Joi.object({
  profileVisibility: Joi.string().valid('public', 'limited', 'private').required(),
  locationSharing: Joi.string().valid('exact', 'approximate', 'city_only', 'none').required(),
  transactionHistory: Joi.string().valid('public', 'limited', 'private').required(),
  contactInfo: Joi.string().valid('public', 'verified_only', 'private').required()
});

// User Preferences Schema
export const userPreferencesSchema = Joi.object({
  languages: Joi.array().items(Joi.string().valid(...Object.values(SUPPORTED_LANGUAGES))).min(1).max(5).required(),
  culturalSettings: Joi.array().items(culturalPreferenceSchema).max(20).required(),
  notificationSettings: notificationSettingsSchema.required(),
  privacySettings: privacySettingsSchema.required()
});

// Security Settings Schema
export const securitySettingsSchema = Joi.object({
  mfaEnabled: Joi.boolean().required(),
  mfaMethod: Joi.string().valid('sms', 'email', 'app').when('mfaEnabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  sessionTimeout: Joi.number().min(300).max(86400).required(), // 5 minutes to 24 hours
  loginNotifications: Joi.boolean().required()
});

// User Registration Schema
export const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phoneNumber: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).required(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  userType: Joi.string().valid(...Object.values(USER_TYPES)).required(),
  preferredLanguage: Joi.string().valid(...Object.values(SUPPORTED_LANGUAGES)).default(SUPPORTED_LANGUAGES.ENGLISH),
  location: locationSchema.optional(),
  acceptTerms: Joi.boolean().valid(true).required()
});

// User Login Schema
export const userLoginSchema = Joi.object({
  phoneNumber: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).required(),
  password: Joi.string().min(1).required(),
  rememberMe: Joi.boolean().default(false)
});

// User Profile Update Schema
export const userProfileUpdateSchema = Joi.object({
  personalInfo: personalInfoSchema.optional(),
  preferences: userPreferencesSchema.optional(),
  securitySettings: securitySettingsSchema.optional()
}).min(1);

// Password Reset Schema
export const passwordResetSchema = Joi.object({
  phoneNumber: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).required()
});

// Password Reset Confirm Schema
export const passwordResetConfirmSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

// MFA Setup Schema
export const mfaSetupSchema = Joi.object({
  method: Joi.string().valid('sms', 'email', 'app').required(),
  phoneNumber: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).when('method', {
    is: 'sms',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  email: Joi.string().email().when('method', {
    is: 'email',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// MFA Verify Schema
export const mfaVerifySchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  method: Joi.string().valid('sms', 'email', 'app').required(),
  token: Joi.string().optional()
});

// Phone Verification Schema
export const phoneVerificationSchema = Joi.object({
  phoneNumber: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required()
});

// Email Verification Schema
export const emailVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required()
});

// User Search Schema
export const userSearchSchema = Joi.object({
  query: Joi.string().min(2).max(100).optional(),
  userType: Joi.string().valid(...Object.values(USER_TYPES)).optional(),
  location: Joi.object({
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().valid(...INDIAN_STATES).optional(),
    radius: Joi.number().min(1).max(1000).optional() // in kilometers
  }).optional(),
  isVerified: Joi.boolean().optional(),
  limit: Joi.number().min(1).max(100).default(20),
  offset: Joi.number().min(0).default(0),
  sortBy: Joi.string().valid('name', 'created_at', 'last_active', 'reputation').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// Validation Functions
export function validateUserRegistration(data: any) {
  return userRegistrationSchema.validate(data, { abortEarly: false });
}

export function validateUserLogin(data: any) {
  return userLoginSchema.validate(data, { abortEarly: false });
}

export function validateUserProfileUpdate(data: any) {
  return userProfileUpdateSchema.validate(data, { abortEarly: false });
}

export function validatePasswordReset(data: any) {
  return passwordResetSchema.validate(data, { abortEarly: false });
}

export function validatePasswordResetConfirm(data: any) {
  return passwordResetConfirmSchema.validate(data, { abortEarly: false });
}

export function validateMFASetup(data: any) {
  return mfaSetupSchema.validate(data, { abortEarly: false });
}

export function validateMFAVerify(data: any) {
  return mfaVerifySchema.validate(data, { abortEarly: false });
}

export function validatePhoneVerification(data: any) {
  return phoneVerificationSchema.validate(data, { abortEarly: false });
}

export function validateEmailVerification(data: any) {
  return emailVerificationSchema.validate(data, { abortEarly: false });
}

export function validateUserSearch(data: any) {
  return userSearchSchema.validate(data, { abortEarly: false });
}