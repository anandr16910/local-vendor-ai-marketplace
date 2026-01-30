export interface CulturalContext {
  region: string;
  language: string;
  customsLevel: 'traditional' | 'modern' | 'mixed';
  negotiationStyle: 'direct' | 'indirect' | 'relationship_based';
  timeOrientation: 'punctual' | 'flexible' | 'event_based';
  communicationStyle: 'high_context' | 'low_context' | 'mixed';
  festivals: FestivalInfo[];
  marketTraditions: MarketTradition[];
}

export interface FestivalInfo {
  name: string;
  date: Date;
  duration: number; // in days
  significance: 'high' | 'medium' | 'low';
  marketImpact: 'increased_demand' | 'decreased_activity' | 'special_pricing' | 'closed';
  culturalPractices: string[];
}

export interface MarketTradition {
  practice: string;
  description: string;
  applicableCategories: string[];
  importance: 'high' | 'medium' | 'low';
  modernAdaptation?: string;
}

export interface CulturalPreference {
  category: string;
  preference: string;
  importance: 'low' | 'medium' | 'high';
  description?: string;
}

export interface CulturalGuidance {
  situation: string;
  guidance: string;
  dosList: string[];
  dontsList: string[];
  culturalReasoning: string;
  modernAlternatives?: string[];
}

export interface CulturalAdaptation {
  originalText: string;
  adaptedText: string;
  adaptationReason: string;
  culturalFactors: string[];
  confidence: number;
}

export interface CulturalSensitivityRule {
  ruleId: string;
  category: string;
  description: string;
  conditions: CulturalCondition[];
  actions: CulturalAction[];
  priority: number;
  isActive: boolean;
}

export interface CulturalCondition {
  type: 'festival' | 'region' | 'language' | 'user_preference' | 'time' | 'category';
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

export interface CulturalAction {
  type: 'modify_text' | 'adjust_pricing' | 'change_timing' | 'add_guidance' | 'require_approval';
  parameters: Record<string, any>;
}