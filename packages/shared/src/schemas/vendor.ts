import Joi from 'joi';
import { BUSINESS_TYPES, VERIFICATION_LEVELS, REGEX_PATTERNS } from '../utils/constants';
import { locationSchema, culturalPreferenceSchema } from './user';

// Operating Hours Schema
export const dayScheduleSchema = Joi.object({
  isOpen: Joi.boolean().required(),
  openTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  closeTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  breaks: Joi.array().items(Joi.object({
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  })).max(3).optional()
});

export const operatingHoursSchema = Joi.object({
  monday: dayScheduleSchema.required(),
  tuesday: dayScheduleSchema.required(),
  wednesday: dayScheduleSchema.required(),
  thursday: dayScheduleSchema.required(),
  friday: dayScheduleSchema.required(),
  saturday: dayScheduleSchema.required(),
  sunday: dayScheduleSchema.required()
});

// Social Media Schema
export const socialMediaLinksSchema = Joi.object({
  facebook: Joi.string().uri().optional(),
  instagram: Joi.string().uri().optional(),
  whatsapp: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).optional(),
  telegram: Joi.string().optional()
});

// Business Contact Info Schema
export const businessContactInfoSchema = Joi.object({
  primaryPhone: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).required(),
  secondaryPhone: Joi.string().pattern(REGEX_PATTERNS.INDIAN_PHONE).optional(),
  email: Joi.string().email().optional(),
  website: Joi.string().uri().optional(),
  socialMedia: socialMediaLinksSchema.optional()
});

// Business Info Schema
export const businessInfoSchema = Joi.object({
  businessName: Joi.string().min(2).max(200).required(),
  businessType: Joi.string().valid(...Object.values(BUSINESS_TYPES)).required(),
  registrationNumber: Joi.string().min(5).max(50).optional(),
  taxId: Joi.string().when('businessType', {
    is: Joi.valid('company', 'partnership'),
    then: Joi.string().pattern(REGEX_PATTERNS.GSTIN).optional(),
    otherwise: Joi.string().pattern(REGEX_PATTERNS.PAN).optional()
  }),
  establishedYear: Joi.number().min(1900).max(new Date().getFullYear()).required(),
  description: Joi.string().min(10).max(1000).required(),
  categories: Joi.array().items(Joi.string().min(2).max(100)).min(1).max(10).required(),
  operatingHours: operatingHoursSchema.required(),
  contactInfo: businessContactInfoSchema.required()
});

// Reputation Score Schema
export const reputationScoreSchema = Joi.object({
  overall: Joi.number().min(0).max(5).required(),
  quality: Joi.number().min(0).max(5).required(),
  fairness: Joi.number().min(0).max(5).required(),
  service: Joi.number().min(0).max(5).required(),
  reliability: Joi.number().min(0).max(5).required(),
  totalReviews: Joi.number().min(0).required(),
  recentReviews: Joi.number().min(0).required(),
  verifiedReviews: Joi.number().min(0).required(),
  lastUpdated: Joi.date().required()
});

// Verification Status Schema
export const verificationStatusSchema = Joi.object({
  isVerified: Joi.boolean().required(),
  verificationLevel: Joi.string().valid(...Object.values(VERIFICATION_LEVELS)).required(),
  documentsVerified: Joi.array().items(Joi.string()).required(),
  verificationDate: Joi.date().optional(),
  verificationExpiry: Joi.date().optional(),
  verifiedBy: Joi.string().optional()
});

// Market Presence Schema
export const marketPresenceSchema = Joi.object({
  yearsActive: Joi.number().min(0).max(100).required(),
  totalTransactions: Joi.number().min(0).required(),
  monthlyTransactions: Joi.number().min(0).required(),
  averageTransactionValue: Joi.number().min(0).required(),
  preferredPaymentMethods: Joi.array().items(Joi.string()).min(1).max(10).required(),
  deliveryOptions: Joi.array().items(Joi.string()).min(1).max(10).required(),
  serviceRadius: Joi.number().min(1).max(1000).required() // in kilometers
});

// Vendor Profile Creation Schema
export const vendorProfileCreationSchema = Joi.object({
  businessInfo: businessInfoSchema.required(),
  specializations: Joi.array().items(Joi.string().min(2).max(100)).min(1).max(20).required(),
  culturalPreferences: Joi.array().items(culturalPreferenceSchema).max(20).default([]),
  operatingHours: operatingHoursSchema.required(),
  serviceRadius: Joi.number().min(1).max(1000).default(10),
  preferredPaymentMethods: Joi.array().items(Joi.string()).min(1).max(10).required(),
  deliveryOptions: Joi.array().items(Joi.string()).min(1).max(10).required()
});

// Vendor Profile Update Schema
export const vendorProfileUpdateSchema = Joi.object({
  businessInfo: businessInfoSchema.optional(),
  specializations: Joi.array().items(Joi.string().min(2).max(100)).min(1).max(20).optional(),
  culturalPreferences: Joi.array().items(culturalPreferenceSchema).max(20).optional(),
  operatingHours: operatingHoursSchema.optional(),
  serviceRadius: Joi.number().min(1).max(1000).optional(),
  preferredPaymentMethods: Joi.array().items(Joi.string()).min(1).max(10).optional(),
  deliveryOptions: Joi.array().items(Joi.string()).min(1).max(10).optional()
}).min(1);

// Verification Document Schema
export const verificationDocumentSchema = Joi.object({
  documentType: Joi.string().valid('business_license', 'tax_certificate', 'identity_proof', 'address_proof', 'bank_details').required(),
  fileName: Joi.string().min(1).max(255).required(),
  fileData: Joi.string().base64().required(),
  description: Joi.string().max(500).optional()
});

// Verification Submission Schema
export const verificationSubmissionSchema = Joi.object({
  documents: Joi.array().items(verificationDocumentSchema).min(1).max(10).required(),
  additionalInfo: Joi.object().optional()
});

// Vendor Feedback Schema
export const vendorFeedbackSchema = Joi.object({
  transactionId: Joi.string().uuid().required(),
  vendorId: Joi.string().uuid().required(),
  ratings: Joi.object({
    quality: Joi.number().min(1).max(5).required(),
    fairness: Joi.number().min(1).max(5).required(),
    service: Joi.number().min(1).max(5).required(),
    reliability: Joi.number().min(1).max(5).required()
  }).required(),
  comments: Joi.string().max(1000).optional(),
  wouldRecommend: Joi.boolean().required()
});

// Vendor Search Schema
export const vendorSearchSchema = Joi.object({
  query: Joi.string().min(2).max(100).optional(),
  categories: Joi.array().items(Joi.string().min(2).max(100)).max(10).optional(),
  location: locationSchema.optional(),
  radius: Joi.number().min(1).max(1000).default(10),
  minRating: Joi.number().min(0).max(5).optional(),
  verificationLevel: Joi.string().valid(...Object.values(VERIFICATION_LEVELS)).optional(),
  sortBy: Joi.string().valid('relevance', 'rating', 'distance', 'experience').default('relevance'),
  limit: Joi.number().min(1).max(100).default(20),
  offset: Joi.number().min(0).default(0)
});

// Vendor Feedback Query Schema
export const vendorFeedbackQuerySchema = Joi.object({
  vendorId: Joi.string().uuid().required(),
  limit: Joi.number().min(1).max(100).default(20),
  offset: Joi.number().min(0).default(0),
  sortBy: Joi.string().valid('newest', 'oldest', 'rating_high', 'rating_low').default('newest'),
  verified: Joi.boolean().optional()
});

// Vendor Analytics Schema
export const vendorAnalyticsSchema = Joi.object({
  vendorId: Joi.string().uuid().required(),
  timeRange: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().min(Joi.ref('start')).required()
  }).required(),
  includeCompetitorAnalysis: Joi.boolean().default(false),
  includeMarketPosition: Joi.boolean().default(false)
});

// Validation Functions
export function validateVendorProfileCreation(data: any) {
  return vendorProfileCreationSchema.validate(data, { abortEarly: false });
}

export function validateVendorProfileUpdate(data: any) {
  return vendorProfileUpdateSchema.validate(data, { abortEarly: false });
}

export function validateVerificationSubmission(data: any) {
  return verificationSubmissionSchema.validate(data, { abortEarly: false });
}

export function validateVendorFeedback(data: any) {
  return vendorFeedbackSchema.validate(data, { abortEarly: false });
}

export function validateVendorSearch(data: any) {
  return vendorSearchSchema.validate(data, { abortEarly: false });
}

export function validateVendorFeedbackQuery(data: any) {
  return vendorFeedbackQuerySchema.validate(data, { abortEarly: false });
}

export function validateVendorAnalytics(data: any) {
  return vendorAnalyticsSchema.validate(data, { abortEarly: false });
}

// Business Hours Validation Helper
export function validateBusinessHours(operatingHours: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const schedule = operatingHours[day];
    if (schedule?.isOpen) {
      if (!schedule.openTime || !schedule.closeTime) {
        errors.push(`${day}: Open and close times are required when the day is marked as open`);
        continue;
      }
      
      const openTime = new Date(`2000-01-01T${schedule.openTime}:00`);
      const closeTime = new Date(`2000-01-01T${schedule.closeTime}:00`);
      
      if (openTime >= closeTime) {
        errors.push(`${day}: Close time must be after open time`);
      }
      
      // Validate breaks
      if (schedule.breaks) {
        for (const breakTime of schedule.breaks) {
          const breakStart = new Date(`2000-01-01T${breakTime.startTime}:00`);
          const breakEnd = new Date(`2000-01-01T${breakTime.endTime}:00`);
          
          if (breakStart >= breakEnd) {
            errors.push(`${day}: Break end time must be after break start time`);
          }
          
          if (breakStart < openTime || breakEnd > closeTime) {
            errors.push(`${day}: Break times must be within operating hours`);
          }
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}