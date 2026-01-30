export interface TranslateTextRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: TranslationContext;
  priority?: 'low' | 'normal' | 'high';
  preserveFormatting?: boolean;
  culturalAdaptation?: boolean;
}

export interface TranslateTextResponse {
  translationResult: TranslationResult;
  cached: boolean;
  processingTime: number;
}

export interface TranslateVoiceRequest {
  audioData: string; // Base64 encoded audio
  sourceLang: string;
  targetLang: string;
  audioFormat: 'wav' | 'mp3' | 'ogg';
  context?: TranslationContext;
}

export interface TranslateVoiceResponse {
  voiceTranslationResult: VoiceTranslationResult;
  processingTime: number;
  audioProcessingTime: number;
}

export interface GetSupportedLanguagesResponse {
  languages: Language[];
  totalCount: number;
  lastUpdated: Date;
}

export interface ValidateTranslationRequest {
  translation: TranslationResult;
  originalContext?: TranslationContext;
}

export interface ValidateTranslationResponse {
  validationResult: ValidationResult;
  improvedTranslation?: string;
  confidence: number;
}

export interface BatchTranslateRequest {
  texts: BatchTranslationItem[];
  sourceLang: string;
  targetLang: string;
  context?: TranslationContext;
  priority?: 'low' | 'normal' | 'high';
}

export interface BatchTranslationItem {
  id: string;
  text: string;
  context?: TranslationContext;
}

export interface BatchTranslateResponse {
  results: BatchTranslationResult[];
  totalProcessingTime: number;
  successCount: number;
  failureCount: number;
}

export interface BatchTranslationResult {
  id: string;
  success: boolean;
  translationResult?: TranslationResult;
  error?: string;
}

export interface GetTranslationHistoryRequest {
  userId?: string;
  sourceLang?: string;
  targetLang?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

export interface GetTranslationHistoryResponse {
  translations: TranslationHistoryItem[];
  totalCount: number;
  statistics: TranslationStatistics;
}

export interface TranslationHistoryItem {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  confidence: number;
  timestamp: Date;
  context?: TranslationContext;
}

export interface TranslationStatistics {
  totalTranslations: number;
  averageConfidence: number;
  mostUsedLanguagePairs: LanguagePairUsage[];
  culturalAdaptations: number;
  voiceTranslations: number;
}

export interface LanguagePairUsage {
  sourceLang: string;
  targetLang: string;
  count: number;
  averageConfidence: number;
}

export interface ReportTranslationIssueRequest {
  translationId: string;
  issueType: 'incorrect_translation' | 'cultural_insensitivity' | 'context_mismatch' | 'technical_error';
  description: string;
  suggestedCorrection?: string;
}

export interface ReportTranslationIssueResponse {
  success: boolean;
  issueId: string;
  message: string;
  estimatedResolutionTime: string;
}

export interface GetTranslationQualityRequest {
  sourceLang: string;
  targetLang: string;
  domain?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface GetTranslationQualityResponse {
  qualityMetrics: TranslationQualityMetrics;
  recommendations: string[];
  providerComparison: ProviderQualityComparison[];
}

export interface TranslationQualityMetrics {
  averageConfidence: number;
  successRate: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  culturalAdaptationRate: number;
  issueReportRate: number;
}

export interface ProviderQualityComparison {
  provider: string;
  qualityScore: number;
  speed: number;
  reliability: number;
  culturalAccuracy: number;
  cost: number;
}

// Import types from other files
import { TranslationResult, VoiceTranslationResult, Language, ValidationResult, TranslationContext } from '../types/translation';