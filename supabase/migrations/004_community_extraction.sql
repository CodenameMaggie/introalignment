-- SovereigntyIntroAlignment Interactive Dashboard
-- Migration 004: Community & Profile Extraction

-- ============================================
-- COMMUNITY & SOCIAL
-- ============================================

-- Discussion topics/prompts
CREATE TABLE discussion_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content
    prompt_text TEXT NOT NULL,
    description TEXT,

    -- Categorization
    category VARCHAR(100),

    -- What we extract from responses
    extraction_targets JSONB,
    /* Example:
    {
        "values": ["family", "career", "relationships"],
        "personality": ["extraversion", "agreeableness"],
        "lifestyle": ["social_preferences"]
    }
    */

    -- Scheduling
    featured_date DATE,
    is_daily_prompt BOOLEAN DEFAULT FALSE,

    response_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User discussion responses
CREATE TABLE discussion_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES discussion_topics(id) ON DELETE CASCADE,
    parent_response_id UUID REFERENCES discussion_responses(id), -- For replies

    -- Response content
    response_text TEXT NOT NULL,

    -- Analysis (computed by LLM)
    sentiment_score DECIMAL, -- -1 to 1
    word_count INT,
    vocabulary_complexity DECIMAL,
    emotional_indicators JSONB,
    extracted_values JSONB,
    extracted_personality JSONB,

    -- Engagement
    upvotes INT DEFAULT 0,
    reply_count INT DEFAULT 0,

    is_flagged BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Polls
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    question_text TEXT NOT NULL,
    poll_type VARCHAR(50) DEFAULT 'single_choice', -- 'single_choice', 'multiple_choice', 'ranking'

    options JSONB NOT NULL, -- [{"id": "a", "text": "..."}, ...]

    -- Extraction
    extraction_targets JSONB,

    -- Results
    total_votes INT DEFAULT 0,
    results JSONB DEFAULT '{}', -- {"a": 45, "b": 32, ...}

    -- Scheduling
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll votes
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,

    selected_options JSONB NOT NULL, -- ["a"] or ["a", "c"] for multiple

    -- Analysis
    is_majority_vote BOOLEAN, -- Did they vote with majority?
    extracted_data JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, poll_id)
);

-- ============================================
-- PROFILE BUILDING (EXPLICIT)
-- ============================================

-- Vision board items
CREATE TABLE vision_board_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    item_type VARCHAR(50) NOT NULL, -- 'image', 'text', 'goal'

    -- Content
    image_url TEXT,
    text_content TEXT,

    -- Categorization
    category VARCHAR(100), -- 'lifestyle', 'relationship', 'career', 'home', 'travel', 'family'

    -- Position on board
    position_x INT,
    position_y INT,

    -- Extracted meaning
    extracted_values JSONB,
    extracted_goals JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal breaker items (swipe interface)
CREATE TABLE dealbreaker_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    extraction_targets JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal breaker responses
CREATE TABLE dealbreaker_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- The item
    item_text TEXT NOT NULL,
    item_category VARCHAR(100), -- 'lifestyle', 'values', 'habits', 'relationship_style', 'life_goals'

    -- Response
    response VARCHAR(50) NOT NULL, -- 'must_have', 'nice_to_have', 'neutral', 'prefer_not', 'dealbreaker'

    response_time_ms INT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, item_text)
);

-- ============================================
-- BADGES & GAMIFICATION
-- ============================================

-- Badge definitions
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,

    -- Earning criteria
    badge_type VARCHAR(50) NOT NULL, -- 'streak', 'completion', 'engagement', 'personality', 'special'
    criteria JSONB NOT NULL,
    /* Examples:
    {"type": "streak", "days": 7}
    {"type": "games_completed", "count": 50}
    {"type": "personality_trait", "trait": "openness", "threshold": 0.8}
    */

    points_value INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,

    earned_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, badge_id)
);

-- ============================================
-- AGGREGATED PROFILE EXTRACTIONS
-- ============================================

-- Running profile scores (updated after each interaction)
CREATE TABLE profile_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Big Five (0-1 scale, running average)
    openness DECIMAL DEFAULT 0.5,
    openness_confidence DECIMAL DEFAULT 0,
    openness_data_points INT DEFAULT 0,

    conscientiousness DECIMAL DEFAULT 0.5,
    conscientiousness_confidence DECIMAL DEFAULT 0,
    conscientiousness_data_points INT DEFAULT 0,

    extraversion DECIMAL DEFAULT 0.5,
    extraversion_confidence DECIMAL DEFAULT 0,
    extraversion_data_points INT DEFAULT 0,

    agreeableness DECIMAL DEFAULT 0.5,
    agreeableness_confidence DECIMAL DEFAULT 0,
    agreeableness_data_points INT DEFAULT 0,

    neuroticism DECIMAL DEFAULT 0.5,
    neuroticism_confidence DECIMAL DEFAULT 0,
    neuroticism_data_points INT DEFAULT 0,

    -- Attachment style scores
    attachment_secure DECIMAL DEFAULT 0.5,
    attachment_anxious DECIMAL DEFAULT 0.5,
    attachment_avoidant DECIMAL DEFAULT 0.5,
    attachment_confidence DECIMAL DEFAULT 0,

    -- Cognitive indicators
    vocabulary_level VARCHAR(50), -- 'basic', 'intermediate', 'advanced', 'exceptional'
    analytical_thinking DECIMAL DEFAULT 0.5,
    creativity_score DECIMAL DEFAULT 0.5,
    persistence_score DECIMAL DEFAULT 0.5,
    decision_speed VARCHAR(50), -- 'impulsive', 'quick', 'deliberate', 'slow'

    -- Values (ranked list)
    values_hierarchy JSONB DEFAULT '[]', -- ["family", "adventure", "security", ...]

    -- Interests (with strength)
    interests JSONB DEFAULT '{}', -- {"travel": 0.8, "cooking": 0.6, ...}

    -- Lifestyle indicators
    lifestyle_indicators JSONB DEFAULT '{}',
    /* {
        "social_preference": "small_groups",
        "activity_level": "moderate",
        "home_vs_out": "balanced",
        "planning_style": "spontaneous"
    } */

    -- Relationship patterns
    relationship_indicators JSONB DEFAULT '{}',
    /* {
        "conflict_style": "collaborative",
        "communication_preference": "direct",
        "affection_style": "physical",
        "independence_level": "moderate"
    } */

    -- Risk indicators
    risk_tolerance DECIMAL DEFAULT 0.5,

    -- Engagement metrics
    total_games_played INT DEFAULT 0,
    total_puzzles_solved INT DEFAULT 0,
    total_articles_read INT DEFAULT 0,
    total_discussions_joined INT DEFAULT 0,

    -- Profile completeness
    profile_completeness DECIMAL DEFAULT 0, -- 0-1

    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_discussion_responses_user ON discussion_responses(user_id);
CREATE INDEX idx_discussion_responses_topic ON discussion_responses(topic_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);
CREATE INDEX idx_profile_extractions_user ON profile_extractions(user_id);
CREATE INDEX idx_vision_board_items_user ON vision_board_items(user_id);
CREATE INDEX idx_dealbreaker_responses_user ON dealbreaker_responses(user_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealbreaker_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealbreaker_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_extractions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active discussion topics
CREATE POLICY "Anyone can view active discussion topics" ON discussion_topics
    FOR SELECT USING (is_active = TRUE);

-- Anyone can view active discussion responses
CREATE POLICY "Anyone can view active discussion responses" ON discussion_responses
    FOR SELECT USING (is_active = TRUE);

-- Users can insert own discussion responses
CREATE POLICY "Users can insert own discussion responses" ON discussion_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view active polls
CREATE POLICY "Anyone can view active polls" ON polls
    FOR SELECT USING (is_active = TRUE);

-- Users can view own poll votes
CREATE POLICY "Users can view own poll votes" ON poll_votes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own poll votes
CREATE POLICY "Users can insert own poll votes" ON poll_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view own vision board
CREATE POLICY "Users can view own vision board" ON vision_board_items
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own vision board items
CREATE POLICY "Users can insert own vision board items" ON vision_board_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own vision board items
CREATE POLICY "Users can update own vision board items" ON vision_board_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own vision board items
CREATE POLICY "Users can delete own vision board items" ON vision_board_items
    FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view active dealbreaker items
CREATE POLICY "Anyone can view active dealbreaker items" ON dealbreaker_items
    FOR SELECT USING (is_active = TRUE);

-- Users can view own dealbreaker responses
CREATE POLICY "Users can view own dealbreaker responses" ON dealbreaker_responses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own dealbreaker responses
CREATE POLICY "Users can insert own dealbreaker responses" ON dealbreaker_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view active badges
CREATE POLICY "Anyone can view active badges" ON badges
    FOR SELECT USING (is_active = TRUE);

-- Users can view own badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view own profile extractions
CREATE POLICY "Users can view own profile extractions" ON profile_extractions
    FOR SELECT USING (auth.uid() = user_id);
