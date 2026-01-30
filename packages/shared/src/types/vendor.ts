export interface VendorProfile {
  vendorId: string;
  businessInfo: BusinessInfo;
  reputation: ReputationScore;
  specializations: string[];
  verificationStatus: VerificationStatus;
  marketPresence: MarketPresence;
  culturalPreferences: CulturalPreference[];
}

export interface BusinessInfo {
  businessName: string;
  businessType: 'individual' | 'partnership' | 'company' | 'cooperative';
  registrationNumber?: string;
  taxId?: string;
  establishedYear: number;
  description: string;
  categories: string[];
  operatingHours: OperatingHours;
  contactInfo: BusinessContactInfo;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface BusinessContactInfo {
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
}

export interface ReputationScore {
  overall: number; // 0-5 scale
  quality: number;
  fairness: number;
  service: number;
  reliability: number;
  totalReviews: number;
  recentReviews: number; // last 30 days
  verifiedReviews: number;
  lastUpdated: Date;
}

export interface VerificationStatus {
  isVerified: boolean;
  verificationLevel: 'basic' | 'standard' | 'premium';
  documentsVerified: string[];
  verificationDate?: Date;
  verificationExpiry?: Date;
  verifiedBy?: string;
}

export interface MarketPresence {
  yearsActive: number;
  totalTransactions: number;
  monthlyTransactions: number;
  averageTransactionValue: number;
  preferredPaymentMethods: string[];
  deliveryOptions: string[];
  serviceRadius: number; // in kilometers
}

export interface CulturalPreference {
  category: string;
  preference: string;
  importance: 'low' | 'medium' | 'high';
}

export interface VendorFeedback {
  feedbackId: string;
  transactionId: string;
  buyerId: string;
  vendorId: string;
  ratings: {
    quality: number;
    fairness: number;
    service: number;
    reliability: number;
  };
  comments?: string;
  isVerified: boolean;
  submittedAt: Date;
}

export interface VerificationDocument {
  documentId: string;
  documentType: 'business_license' | 'tax_certificate' | 'identity_proof' | 'address_proof' | 'bank_details';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface VerificationResult {
  success: boolean;
  verificationLevel: 'basic' | 'standard' | 'premium';
  documentsApproved: string[];
  documentsRejected: string[];
  nextSteps?: string[];
  expiryDate?: Date;
}