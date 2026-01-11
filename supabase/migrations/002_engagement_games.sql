-- SovereigntyIntroAlignment Interactive Dashboard
-- Migration 002: Engagement Tracking & Games

-- ============================================
-- ENGAGEMENT TRACKING
-- ============================================

-- Daily engagement sessions
CREATE TABLE engagement_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Streak tracking
    current_streak INT DEFAULT 1,
    longest_streak INT DEFAULT 1,

    -- Daily completion
    daily_game_completed BOOLEAN DEFAULT FALSE,
    daily_puzzle_completed BOOLEAN DEFAULT FALSE,
    articles_read INT DEFAULT 0,
    community_interactions INT DEFAULT 0,

    -- Points & levels
    points_earned_today INT DEFAULT 0,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,

    -- Timestamps
    first_activity_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, session_date)
);

-- ============================================
-- GAMES
-- ============================================

-- Game definitions
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_type VARCHAR(50) NOT NULL, -- 'would_you_rather', 'this_or_that', 'story_choice', 'first_impression', 'red_flag_green_flag', 'finish_sentence', 'picture_this'
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Scheduling
    is_daily BOOLEAN DEFAULT FALSE,
    available_date DATE, -- NULL = always available

    -- Extraction targets
    extracts_values BOOLEAN DEFAULT FALSE,
    extracts_personality BOOLEAN DEFAULT FALSE,
    extracts_attachment BOOLEAN DEFAULT FALSE,
    extracts_lifestyle BOOLEAN DEFAULT FALSE,
    extracts_dealbreakers BOOLEAN DEFAULT FALSE,

    points_value INT DEFAULT 10,
    estimated_seconds INT DEFAULT 60,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game questions/scenarios
CREATE TABLE game_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,

    -- Question content
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'binary', 'multiple_choice', 'open_ended', 'image_choice', 'slider', 'ranking'

    -- Options (JSON array)
    options JSONB, -- [{"id": "a", "text": "...", "image_url": "..."}, ...]

    -- What this question extracts
    extraction_targets JSONB NOT NULL,
    /* Example:
    {
        "big_five": {"dimension": "openness", "weight": 0.3},
        "values": {"category": "adventure_vs_security"},
        "attachment": {"indicator": "avoidance"},
        "custom": {"field": "risk_tolerance"}
    }
    */

    -- Scoring logic
    scoring_logic JSONB,
    /* Example:
    {
        "option_a": {"openness": +0.2, "risk_tolerance": +0.3},
        "option_b": {"openness": -0.1, "risk_tolerance": -0.2}
    }
    */

    sequence_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User game responses
CREATE TABLE game_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    question_id UUID REFERENCES game_questions(id) ON DELETE CASCADE,

    -- Response data
    selected_option VARCHAR(50), -- For choice questions
    response_text TEXT, -- For open-ended
    slider_value DECIMAL, -- For sliders
    ranking_order JSONB, -- For ranking questions

    -- Timing (tells us about decision style)
    response_time_ms INT, -- How long they took
    changed_answer BOOLEAN DEFAULT FALSE, -- Did they switch?

    -- Extracted insights (computed)
    extracted_data JSONB,
    confidence_score DECIMAL DEFAULT 0.5,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_engagement_sessions_user_date ON engagement_sessions(user_id, session_date);
CREATE INDEX idx_game_responses_user ON game_responses(user_id);
CREATE INDEX idx_game_responses_game ON game_responses(game_id);
CREATE INDEX idx_game_questions_game ON game_questions(game_id);
CREATE INDEX idx_games_type ON games(game_type);
CREATE INDEX idx_games_daily ON games(is_daily) WHERE is_daily = TRUE;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE engagement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_responses ENABLE ROW LEVEL SECURITY;

-- Users can view own engagement
CREATE POLICY "Users can view own engagement" ON engagement_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own engagement" ON engagement_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own engagement" ON engagement_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Anyone can view active games
CREATE POLICY "Anyone can view active games" ON games
    FOR SELECT USING (is_active = TRUE);

-- Anyone can view game questions
CREATE POLICY "Anyone can view game questions" ON game_questions
    FOR SELECT USING (is_active = TRUE);

-- Users can view own game responses
CREATE POLICY "Users can view own game responses" ON game_responses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own game responses
CREATE POLICY "Users can insert own game responses" ON game_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
