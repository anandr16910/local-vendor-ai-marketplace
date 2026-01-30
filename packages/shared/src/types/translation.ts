export interface TranslationResult {
  translatedText: string;
  confidence: number;
  culturalAdaptations: string[];
  alternativeTranslations: string[];
  requiresVerification: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  translationProvider: string;
  timestamp: Date;
}

export interface VoiceTranslationResult extends TranslationResult {
  audioUrl?: string;
  speechConfidence: number;
  audioQuality: 'high' | 'medium' | 'low';
  backgroundNoise: boolean;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  isSupported: boolean;
  voiceSupported: boolean;
  culturalVariants: string[];
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
  culturalFlags: CulturalFlag[];
}

export interface ValidationIssue {
  type: 'grammar' | 'context' | 'cultural' | 'technical' | 'ambiguous';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
  position?: { start: number; end: number };
}

export interface CulturalFlag {
  type: 'sensitive_content' | 'cultural_reference' | 'local_idiom' | 'religious_context';
  description: string;
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: TranslationContext;
  priority: 'low' | 'normal' | 'high';
  preserveFormatting: boolean;
  culturalAdaptation: boolean;
}

export interface TranslationContext {
  domain: 'general' | 'business' | 'negotiation' | 'product' | 'cultural';
  userType: 'vendor' | 'buyer' | 'intermediary';
  situation: 'greeting' | 'negotiation' | 'complaint' | 'inquiry' | 'agreement';
  culturalBackground: string;
  formalityLevel: 'casual' | 'formal' | 'respectful';
}

export interface TranslationCache {
  key: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
  expiresAt: Date;
}

export interface TranslationProvider {
  name: string;
  isActive: boolean;
  supportedLanguages: string[];
  features: TranslationFeature[];
  priority: number;
  rateLimits: RateLimit;
  costPerRequest: number;
}

export interface TranslationFeature {
  feature: 'text' | 'voice' | 'cultural_adaptation' | 'context_awareness' | 'batch_processing';
  isSupported: boolean;
  quality: 'basic' | 'good' | 'excellent';
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  charactersPerRequest: number;
}

export interface TranslationMetrics {
  totalTranslations: number;
  averageConfidence: number;
  languagePairs: LanguagePairMetric[];
  providerUsage: ProviderUsageMetric[];
  culturalAdaptations: number;
  userSatisfaction: number;
}

export interface LanguagePairMetric {
  sourceLanguage: string;
  targetLanguage: string;
  count: number;
  averageConfidence: number;
  successRate: number;
}

export interface ProviderUsageMetric {
  provider: string;
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  cost: number;
}