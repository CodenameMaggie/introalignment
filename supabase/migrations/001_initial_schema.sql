-- IntroAlignment Database Schema
-- Migration 001: Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'waitlist' CHECK (status IN ('waitlist', 'onboarding', 'active', 'paused', 'inactive')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'elite')),
  verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'none' CHECK (verification_level IN ('none', 'email', 'phone', 'id', 'video'))
);

-- Birth Data (for astrological calculations)
CREATE TABLE birth_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE,
  birth_time TIME,
  birth_time_known BOOLEAN DEFAULT FALSE,
  birth_city TEXT,
  birth_country TEXT,
  birth_latitude DECIMAL,
  birth_longitude DECIMAL,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation History (the onboarding chat)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Extracted Profile Data
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Demographics
  age INTEGER,
  gender TEXT,
  location_city TEXT,
  location_country TEXT,
  relationship_status TEXT,
  has_children BOOLEAN,
  wants_children TEXT,

  -- Big Five (0-100 scale)
  openness_score INTEGER CHECK (openness_score >= 0 AND openness_score <= 100),
  conscientiousness_score INTEGER CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 100),
  extraversion_score INTEGER CHECK (extraversion_score >= 0 AND extraversion_score <= 100),
  agreeableness_score INTEGER CHECK (agreeableness_score >= 0 AND agreeableness_score <= 100),
  neuroticism_score INTEGER CHECK (neuroticism_score >= 0 AND neuroticism_score <= 100),
  big_five_confidence DECIMAL CHECK (big_five_confidence >= 0 AND big_five_confidence <= 1),

  -- Attachment Style
  attachment_style TEXT,
  attachment_confidence DECIMAL CHECK (attachment_confidence >= 0 AND attachment_confidence <= 1),

  -- Emotional Intelligence
  eq_self_awareness INTEGER CHECK (eq_self_awareness >= 0 AND eq_self_awareness <= 100),
  eq_self_regulation INTEGER CHECK (eq_self_regulation >= 0 AND eq_self_regulation <= 100),
  eq_motivation INTEGER CHECK (eq_motivation >= 0 AND eq_motivation <= 100),
  eq_empathy INTEGER CHECK (eq_empathy >= 0 AND eq_empathy <= 100),
  eq_social_skills INTEGER CHECK (eq_social_skills >= 0 AND eq_social_skills <= 100),
  eq_overall INTEGER CHECK (eq_overall >= 0 AND eq_overall <= 100),
  eq_confidence DECIMAL CHECK (eq_confidence >= 0 AND eq_confidence <= 1),

  -- Cognitive Indicators
  cognitive_complexity INTEGER CHECK (cognitive_complexity >= 0 AND cognitive_complexity <= 100),
  vocabulary_level INTEGER CHECK (vocabulary_level >= 0 AND vocabulary_level <= 100),
  abstract_reasoning INTEGER CHECK (abstract_reasoning >= 0 AND abstract_reasoning <= 100),
  iq_estimate_range TEXT,
  cognitive_confidence DECIMAL CHECK (cognitive_confidence >= 0 AND cognitive_confidence <= 1),

  -- Enneagram
  enneagram_type INTEGER CHECK (enneagram_type >= 1 AND enneagram_type <= 9),
  enneagram_wing INTEGER CHECK (enneagram_wing >= 1 AND enneagram_wing <= 9),
  enneagram_health_level INTEGER CHECK (enneagram_health_level >= 1 AND enneagram_health_level <= 9),
  enneagram_confidence DECIMAL CHECK (enneagram_confidence >= 0 AND enneagram_confidence <= 1),

  -- MBTI
  mbti_type TEXT,
  mbti_confidence DECIMAL CHECK (mbti_confidence >= 0 AND mbti_confidence <= 1),

  -- DISC
  disc_d INTEGER CHECK (disc_d >= 0 AND disc_d <= 100),
  disc_i INTEGER CHECK (disc_i >= 0 AND disc_i <= 100),
  disc_s INTEGER CHECK (disc_s >= 0 AND disc_s <= 100),
  disc_c INTEGER CHECK (disc_c >= 0 AND disc_c <= 100),
  disc_primary TEXT,
  disc_confidence DECIMAL CHECK (disc_confidence >= 0 AND disc_confidence <= 1),

  -- Love Languages (ranked 1-5)
  love_lang_words INTEGER CHECK (love_lang_words >= 1 AND love_lang_words <= 5),
  love_lang_acts INTEGER CHECK (love_lang_acts >= 1 AND love_lang_acts <= 5),
  love_lang_gifts INTEGER CHECK (love_lang_gifts >= 1 AND love_lang_gifts <= 5),
  love_lang_time INTEGER CHECK (love_lang_time >= 1 AND love_lang_time <= 5),
  love_lang_touch INTEGER CHECK (love_lang_touch >= 1 AND love_lang_touch <= 5),

  -- Values (top 5, ranked)
  core_values JSONB,

  -- Life Vision
  life_vision_summary TEXT,
  career_trajectory TEXT,
  financial_philosophy TEXT,
  family_goals TEXT,
  lifestyle_preferences JSONB,
  geographic_flexibility TEXT,

  -- Deal Breakers
  deal_breakers JSONB,

  -- Raw Extracted Data
  raw_extractions JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Astrological Data (calculated from birth_data)
CREATE TABLE astro_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- BaZi (Chinese Four Pillars)
  bazi_year_stem TEXT,
  bazi_year_branch TEXT,
  bazi_month_stem TEXT,
  bazi_month_branch TEXT,
  bazi_day_stem TEXT,
  bazi_day_branch TEXT,
  bazi_hour_stem TEXT,
  bazi_hour_branch TEXT,
  bazi_day_master TEXT,
  bazi_element_balance JSONB,

  -- Vedic (Jyotish)
  vedic_moon_sign TEXT,
  vedic_nakshatra TEXT,
  vedic_nakshatra_pada INTEGER,
  vedic_manglik_status BOOLEAN,
  vedic_guna_points JSONB,

  -- Nine Star Ki
  nine_star_year INTEGER CHECK (nine_star_year >= 1 AND nine_star_year <= 9),
  nine_star_month INTEGER CHECK (nine_star_month >= 1 AND nine_star_month <= 9),
  nine_star_energy INTEGER CHECK (nine_star_energy >= 1 AND nine_star_energy <= 9),
  nine_star_element TEXT,

  -- Western (optional)
  western_sun_sign TEXT,
  western_moon_sign TEXT,
  western_rising_sign TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety Screening
CREATE TABLE safety_screening (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Married/Attached Indicators
  attached_risk_score INTEGER CHECK (attached_risk_score >= 0 AND attached_risk_score <= 100),
  attached_signals JSONB,

  -- Dark Triad Indicators
  narcissism_score INTEGER CHECK (narcissism_score >= 0 AND narcissism_score <= 100),
  machiavellianism_score INTEGER CHECK (machiavellianism_score >= 0 AND machiavellianism_score <= 100),
  psychopathy_score INTEGER CHECK (psychopathy_score >= 0 AND psychopathy_score <= 100),
  dark_triad_risk TEXT CHECK (dark_triad_risk IN ('green', 'yellow', 'orange', 'red')),
  dark_triad_signals JSONB,

  -- Consistency Analysis
  inconsistency_count INTEGER DEFAULT 0,
  inconsistency_details JSONB,

  -- Overall Safety
  overall_risk_level TEXT CHECK (overall_risk_level IN ('green', 'yellow', 'orange', 'red')),
  flagged_for_review BOOLEAN DEFAULT FALSE,
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Compatibility Scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  psychological_score INTEGER CHECK (psychological_score >= 0 AND psychological_score <= 100),
  intellectual_score INTEGER CHECK (intellectual_score >= 0 AND intellectual_score <= 100),
  astrological_score INTEGER CHECK (astrological_score >= 0 AND astrological_score <= 100),
  communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
  life_alignment_score INTEGER CHECK (life_alignment_score >= 0 AND life_alignment_score <= 100),

  -- Score Breakdown
  score_details JSONB,

  -- Match Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'introduced', 'accepted', 'declined', 'connected')),
  introduced_at TIMESTAMPTZ,

  -- Responses
  user_a_response TEXT CHECK (user_a_response IN ('interested', 'not_interested', 'maybe')),
  user_b_response TEXT CHECK (user_b_response IN ('interested', 'not_interested', 'maybe')),
  user_a_responded_at TIMESTAMPTZ,
  user_b_responded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure users don't match with themselves
  CONSTRAINT different_users CHECK (user_a_id != user_b_id),
  -- Ensure no duplicate matches (A-B is same as B-A)
  CONSTRAINT unique_match UNIQUE (user_a_id, user_b_id)
);

-- Messages (after match connection)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_astro_profiles_user_id ON astro_profiles(user_id);
CREATE INDEX idx_safety_screening_user_id ON safety_screening(user_id);
CREATE INDEX idx_safety_screening_flagged ON safety_screening(flagged_for_review);
CREATE INDEX idx_matches_user_a_id ON matches(user_a_id);
CREATE INDEX idx_matches_user_b_id ON matches(user_b_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_screening_updated_at BEFORE UPDATE ON safety_screening
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE astro_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Birth data policies
CREATE POLICY "Users can view own birth data" ON birth_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own birth data" ON birth_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own birth data" ON birth_data
    FOR UPDATE USING (auth.uid() = user_id);

-- Conversation policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Astro profile policies
CREATE POLICY "Users can view own astro profile" ON astro_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Match policies (users can see matches they're part of)
CREATE POLICY "Users can view own matches" ON matches
    FOR SELECT USING (
        auth.uid() = user_a_id OR auth.uid() = user_b_id
    );

CREATE POLICY "Users can update own match responses" ON matches
    FOR UPDATE USING (
        auth.uid() = user_a_id OR auth.uid() = user_b_id
    );

-- Message policies
CREATE POLICY "Users can view messages in their matches" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = messages.match_id
            AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their matches" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = match_id
            AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
            AND matches.status = 'connected'
        )
    );
