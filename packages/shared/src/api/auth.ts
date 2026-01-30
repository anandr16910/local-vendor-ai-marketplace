export interface RegisterRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  password: string;
  userType: 'vendor' | 'buyer' | 'intermediary';
  preferredLanguage?: string;
  location?: LocationInfo;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  message: string;
  user: UserProfile;
  token: string;
  requiresVerification: boolean;
  verificationMethod?: 'sms' | 'email';
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  message: string;
  user: UserProfile;
  token: string;
  refreshToken: string;
  requiresMFA?: boolean;
  mfaMethod?: 'sms' | 'email' | 'app';
}

export interface UserProfile {
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  userType: 'vendor' | 'buyer' | 'intermediary';
  preferredLanguage: string;
  isVerified: boolean;
  profileImage?: string;
  location?: LocationInfo;
  createdAt: Date;
  lastActive: Date;
}

export interface MFASetupRequest {
  method: 'sms' | 'email' | 'app';
  phoneNumber?: string;
  email?: string;
}

export interface MFASetupResponse {
  success: boolean;
  method: 'sms' | 'email' | 'app';
  qrCode?: string; // For app-based MFA
  backupCodes?: string[];
  message: string;
}

export interface MFAVerifyRequest {
  code: string;
  method: 'sms' | 'email' | 'app';
  token?: string; // Temporary token from login
}

export interface MFAVerifyResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  message: string;
}

export interface PasswordResetRequest {
  phoneNumber: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface PasswordResetConfirmRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetConfirmResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface VerifyPhoneRequest {
  phoneNumber: string;
  code: string;
}

export interface VerifyPhoneResponse {
  success: boolean;
  message: string;
  isVerified: boolean;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  isVerified: boolean;
}

// Import types from other files
import { LocationInfo } from '../types/user';