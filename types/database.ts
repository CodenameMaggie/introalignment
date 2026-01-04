// Core Database Types for IntroAlignment

export type UserStatus = 'waitlist' | 'onboarding' | 'active' | 'paused' | 'inactive';
export type SubscriptionTier = 'free' | 'premium' | 'elite';
export type VerificationLevel = 'none' | 'email' | 'phone' | 'id' | 'video';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  status: UserStatus;
  subscription_tier: SubscriptionTier;
  verified: boolean;
  verification_level: VerificationLevel;
}

export interface BirthData {
  id: string;
  user_id: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_known: boolean;
  birth_city: string;
  birth_country: string;
  birth_latitude: number;
  birth_longitude: number;
  timezone: string;
  created_at: string;
}

export type ConversationStatus = 'in_progress' | 'completed' | 'abandoned';
export type MessageRole = 'assistant' | 'user';

export interface Conversation {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  status: ConversationStatus;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

// Psychometric Profile Data
export interface Profile {
  id: string;
  user_id: string;

  // Demographics
  age: number | null;
  gender: string | null;
  location_city: string | null;
  location_country: string | null;
  relationship_status: string | null;
  has_children: boolean | null;
  wants_children: string | null;

  // Big Five (0-100 scale)
  openness_score: number | null;
  conscientiousness_score: number | null;
  extraversion_score: number | null;
  agreeableness_score: number | null;
  neuroticism_score: number | null;
  big_five_confidence: number | null;

  // Attachment Style
  attachment_style: string | null;
  attachment_confidence: number | null;

  // Emotional Intelligence
  eq_self_awareness: number | null;
  eq_self_regulation: number | null;
  eq_motivation: number | null;
  eq_empathy: number | null;
  eq_social_skills: number | null;
  eq_overall: number | null;
  eq_confidence: number | null;

  // Cognitive Indicators
  cognitive_complexity: number | null;
  vocabulary_level: number | null;
  abstract_reasoning: number | null;
  iq_estimate_range: string | null;
  cognitive_confidence: number | null;

  // Enneagram
  enneagram_type: number | null;
  enneagram_wing: number | null;
  enneagram_health_level: number | null;
  enneagram_confidence: number | null;

  // MBTI
  mbti_type: string | null;
  mbti_confidence: number | null;

  // DISC
  disc_d: number | null;
  disc_i: number | null;
  disc_s: number | null;
  disc_c: number | null;
  disc_primary: string | null;
  disc_confidence: number | null;

  // Love Languages (ranked 1-5)
  love_lang_words: number | null;
  love_lang_acts: number | null;
  love_lang_gifts: number | null;
  love_lang_time: number | null;
  love_lang_touch: number | null;

  // Values & Vision
  core_values: string[] | null;
  life_vision_summary: string | null;
  career_trajectory: string | null;
  financial_philosophy: string | null;
  family_goals: string | null;
  lifestyle_preferences: Record<string, any> | null;
  geographic_flexibility: string | null;
  deal_breakers: string[] | null;

  // Raw Extracted Data
  raw_extractions: Record<string, any> | null;

  created_at: string;
  updated_at: string;
}

// Astrological Data
export interface AstroProfile {
  id: string;
  user_id: string;

  // BaZi (Chinese Four Pillars)
  bazi_year_stem: string | null;
  bazi_year_branch: string | null;
  bazi_month_stem: string | null;
  bazi_month_branch: string | null;
  bazi_day_stem: string | null;
  bazi_day_branch: string | null;
  bazi_hour_stem: string | null;
  bazi_hour_branch: string | null;
  bazi_day_master: string | null;
  bazi_element_balance: Record<string, number> | null;

  // Vedic (Jyotish)
  vedic_moon_sign: string | null;
  vedic_nakshatra: string | null;
  vedic_nakshatra_pada: number | null;
  vedic_manglik_status: boolean | null;
  vedic_guna_points: Record<string, any> | null;

  // Nine Star Ki
  nine_star_year: number | null;
  nine_star_month: number | null;
  nine_star_energy: number | null;
  nine_star_element: string | null;

  // Western (optional)
  western_sun_sign: string | null;
  western_moon_sign: string | null;
  western_rising_sign: string | null;

  created_at: string;
}

// Safety Screening
export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface SafetyScreening {
  id: string;
  user_id: string;

  // Married/Attached Indicators
  attached_risk_score: number | null;
  attached_signals: Record<string, any> | null;

  // Dark Triad Indicators
  narcissism_score: number | null;
  machiavellianism_score: number | null;
  psychopathy_score: number | null;
  dark_triad_risk: RiskLevel | null;
  dark_triad_signals: Record<string, any> | null;

  // Consistency Analysis
  inconsistency_count: number | null;
  inconsistency_details: Record<string, any> | null;

  // Overall Safety
  overall_risk_level: RiskLevel | null;
  flagged_for_review: boolean;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;

  created_at: string;
  updated_at: string;
}

// Matches
export type MatchStatus = 'pending' | 'introduced' | 'accepted' | 'declined' | 'connected';
export type MatchResponse = 'interested' | 'not_interested' | 'maybe';

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;

  // Compatibility Scores
  overall_score: number;
  psychological_score: number;
  intellectual_score: number;
  astrological_score: number;
  communication_score: number;
  life_alignment_score: number;

  // Score Breakdown
  score_details: Record<string, any> | null;

  // Match Status
  status: MatchStatus;
  introduced_at: string | null;

  // Responses
  user_a_response: MatchResponse | null;
  user_b_response: MatchResponse | null;
  user_a_responded_at: string | null;
  user_b_responded_at: string | null;

  created_at: string;
}

// Messages
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}
