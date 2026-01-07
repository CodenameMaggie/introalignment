-- IntroAlignment Interactive Dashboard
-- Migration 003: Puzzles & Content

-- ============================================
-- PUZZLES
-- ============================================

-- Puzzle definitions
CREATE TABLE puzzles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    puzzle_type VARCHAR(50) NOT NULL, -- 'word', 'logic', 'memory', 'trivia', 'pattern', 'spot_difference'
    title VARCHAR(255) NOT NULL,

    -- Content
    puzzle_data JSONB NOT NULL, -- Type-specific puzzle content
    solution JSONB NOT NULL,
    difficulty_level INT DEFAULT 1, -- 1-5

    -- Scheduling
    available_date DATE, -- NULL = always available

    -- What we extract
    measures_vocabulary BOOLEAN DEFAULT FALSE,
    measures_logic BOOLEAN DEFAULT FALSE,
    measures_memory BOOLEAN DEFAULT FALSE,
    measures_persistence BOOLEAN DEFAULT FALSE,
    measures_pattern_recognition BOOLEAN DEFAULT FALSE,
    measures_values BOOLEAN DEFAULT FALSE,
    measures_personality BOOLEAN DEFAULT FALSE,

    points_value INT DEFAULT 15,
    time_limit_seconds INT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User puzzle attempts
CREATE TABLE puzzle_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,

    -- Attempt data
    attempt_number INT DEFAULT 1,
    user_solution JSONB,
    is_correct BOOLEAN,
    partial_score DECIMAL, -- 0-1 for partial credit

    -- Behavioral data
    time_taken_seconds INT,
    hints_used INT DEFAULT 0,
    gave_up BOOLEAN DEFAULT FALSE,

    -- Extracted insights
    extracted_data JSONB,
    /* Example:
    {
        "persistence": 0.8, -- Kept trying
        "vocabulary_level": "advanced",
        "logical_reasoning": 0.7,
        "patience": 0.6
    }
    */

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT & NEWS
-- ============================================

-- Content articles
CREATE TABLE content_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content
    title VARCHAR(500) NOT NULL,
    subtitle TEXT,
    body_html TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,

    -- Categorization
    category VARCHAR(100) NOT NULL, -- 'relationships', 'lifestyle', 'news', 'advice', 'success_stories', 'self_improvement'
    tags JSONB DEFAULT '[]', -- ["dating", "communication", "travel"]

    -- Interest mapping
    interest_signals JSONB,
    /* Example:
    {
        "topics": ["travel", "adventure"],
        "values": ["spontaneity", "experiences"],
        "lifestyle": ["active", "outdoors"]
    }
    */

    -- Source
    source_type VARCHAR(50), -- 'original', 'curated', 'user_submitted'
    source_url TEXT,
    author VARCHAR(255),

    -- Publishing
    published_at TIMESTAMPTZ,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User content interactions
CREATE TABLE content_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES content_articles(id) ON DELETE CASCADE,

    -- Interaction types
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,

    read_started BOOLEAN DEFAULT FALSE,
    read_started_at TIMESTAMPTZ,

    read_completed BOOLEAN DEFAULT FALSE,
    read_completed_at TIMESTAMPTZ,
    read_time_seconds INT,
    scroll_depth_percent INT, -- How far they scrolled

    saved BOOLEAN DEFAULT FALSE,
    saved_at TIMESTAMPTZ,

    shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMPTZ,

    -- Reactions
    reaction VARCHAR(50), -- 'love', 'insightful', 'relatable', 'disagree'

    -- Extracted interests
    extracted_interests JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, article_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_puzzle_attempts_user ON puzzle_attempts(user_id);
CREATE INDEX idx_puzzle_attempts_puzzle ON puzzle_attempts(puzzle_id);
CREATE INDEX idx_puzzles_type ON puzzles(puzzle_type);
CREATE INDEX idx_puzzles_date ON puzzles(available_date);
CREATE INDEX idx_content_interactions_user ON content_interactions(user_id);
CREATE INDEX idx_content_articles_category ON content_articles(category);
CREATE INDEX idx_content_articles_published ON content_articles(published_at);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active puzzles
CREATE POLICY "Anyone can view active puzzles" ON puzzles
    FOR SELECT USING (is_active = TRUE);

-- Users can view own puzzle attempts
CREATE POLICY "Users can view own puzzle attempts" ON puzzle_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own puzzle attempts
CREATE POLICY "Users can insert own puzzle attempts" ON puzzle_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view published articles
CREATE POLICY "Anyone can view published articles" ON content_articles
    FOR SELECT USING (is_active = TRUE AND published_at IS NOT NULL);

-- Users can view own content interactions
CREATE POLICY "Users can view own content interactions" ON content_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own content interactions
CREATE POLICY "Users can insert own content interactions" ON content_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own content interactions
CREATE POLICY "Users can update own content interactions" ON content_interactions
    FOR UPDATE USING (auth.uid() = user_id);
