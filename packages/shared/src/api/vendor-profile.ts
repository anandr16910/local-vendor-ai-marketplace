export interface CreateVendorProfileRequest {
  businessInfo: BusinessInfoRequest;
  specializations: string[];
  culturalPreferences: CulturalPreference[];
  operatingHours: OperatingHours;
  serviceRadius: number;
  preferredPaymentMethods: string[];
  deliveryOptions: string[];
}

export interface BusinessInfoRequest {
  businessName: string;
  businessType: 'individual' | 'partnership' | 'company' | 'cooperative';
  registrationNumber?: string;
  taxId?: string;
  establishedYear: number;
  description: string;
  categories: string[];
  contactInfo: BusinessContactInfoRequest;
}

export interface BusinessContactInfoRequest {
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;
}

export interface CreateVendorProfileResponse {
  success: boolean;
  vendorProfile: VendorProfile;
  message: string;
  nextSteps: string[];
}

export interface UpdateVendorProfileRequest {
  businessInfo?: Partial<BusinessInfoRequest>;
  specializations?: string[];
  culturalPreferences?: CulturalPreference[];
  operatingHours?: OperatingHours;
  serviceRadius?: number;
  preferredPaymentMethods?: string[];
  deliveryOptions?: string[];
}

export interface UpdateVendorProfileResponse {
  success: boolean;
  vendorProfile: VendorProfile;
  message: string;
  changesApplied: string[];
}

export interface GetVendorProfileResponse {
  vendorProfile: VendorProfile;
  publicView: boolean;
  canEdit: boolean;
}

export interface SubmitVerificationRequest {
  documents: VerificationDocumentUpload[];
  additionalInfo?: Record<string, any>;
}

export interface VerificationDocumentUpload {
  documentType: 'business_license' | 'tax_certificate' | 'identity_proof' | 'address_proof' | 'bank_details';
  fileName: string;
  fileData: string; // Base64 encoded
  description?: string;
}

export interface SubmitVerificationResponse {
  success: boolean;
  submissionId: string;
  documentsReceived: string[];
  estimatedProcessingTime: string;
  message: string;
}

export interface GetVerificationStatusResponse {
  verificationStatus: VerificationStatus;
  submittedDocuments: VerificationDocument[];
  pendingRequirements: string[];
  estimatedCompletionDate?: Date;
}

export interface SubmitFeedbackRequest {
  transactionId: string;
  vendorId: string;
  ratings: {
    quality: number;
    fairness: number;
    service: number;
    reliability: number;
  };
  comments?: string;
  wouldRecommend: boolean;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  feedbackId: string;
  message: string;
  reputationUpdated: boolean;
}

export interface GetVendorFeedbackRequest {
  vendorId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low';
  verified?: boolean;
}

export interface GetVendorFeedbackResponse {
  feedback: VendorFeedback[];
  totalCount: number;
  averageRatings: {
    overall: number;
    quality: number;
    fairness: number;
    service: number;
    reliability: number;
  };
  ratingDistribution: RatingDistribution;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface SearchVendorsRequest {
  query?: string;
  categories?: string[];
  location?: LocationInfo;
  radius?: number;
  minRating?: number;
  verificationLevel?: 'basic' | 'standard' | 'premium';
  sortBy?: 'relevance' | 'rating' | 'distance' | 'experience';
  limit?: number;
  offset?: number;
}

export interface SearchVendorsResponse {
  vendors: VendorSearchResult[];
  totalCount: number;
  facets: VendorSearchFacets;
}

export interface VendorSearchResult {
  vendorId: string;
  businessName: string;
  categories: string[];
  reputation: ReputationScore;
  verificationStatus: VerificationStatus;
  location: LocationInfo;
  distance?: number;
  profileImage?: string;
  specializations: string[];
  isOnline: boolean;
  responseTime: string;
}

export interface VendorSearchFacets {
  categories: FacetCount[];
  verificationLevels: FacetCount[];
  ratings: FacetCount[];
  locations: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
  selected?: boolean;
}

// Import types from other files
import { VendorProfile, VendorFeedback, VerificationStatus, VerificationDocument, ReputationScore, CulturalPreference, OperatingHours, SocialMediaLinks } from '../types/vendor';
import { LocationInfo } from '../types/user';