export interface User {
  userId: string;
  userType: 'vendor' | 'buyer' | 'intermediary';
  personalInfo: PersonalInfo;
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
  createdAt: Date;
  lastActive: Date;
}

export interface PersonalInfo {
  name: string;
  phoneNumber: string;
  email?: string;
  preferredLanguage: string;
  location: LocationInfo;
  profileImage?: string;
}

export interface LocationInfo {
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  languages: string[];
  culturalSettings: CulturalPreference[];
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
}

export interface CulturalPreference {
  category: string;
  preference: string;
  importance: 'low' | 'medium' | 'high';
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  negotiationUpdates: boolean;
  priceAlerts: boolean;
  marketInsights: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'limited' | 'private';
  locationSharing: 'exact' | 'approximate' | 'city_only' | 'none';
  transactionHistory: 'public' | 'limited' | 'private';
  contactInfo: 'public' | 'verified_only' | 'private';
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  mfaMethod: 'sms' | 'email' | 'app';
  sessionTimeout: number;
  loginNotifications: boolean;
}