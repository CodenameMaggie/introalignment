-- =====================================================
-- MATCH GENERATION & INTRODUCTION SYSTEM
-- Migration 012: Enhanced match system with introduction reports
-- =====================================================

-- Introduction Reports (generated narratives for matches)
CREATE TABLE introduction_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,

    -- Report Content
    executive_summary TEXT NOT NULL,
    -- 2-3 paragraph narrative about why they'd be great together

    compatibility_narrative TEXT NOT NULL,
    -- Deep dive into their compatibility across dimensions

    growth_opportunities TEXT,
    -- Areas where they can help each other grow

    conversation_starters JSONB,
    -- Array of thoughtful conversation topics
    -- Example: ["topic": "shared love of...", "why": "because..."]

    potential_challenges TEXT,
    -- Honest assessment of areas to be aware of

    astrological_insights TEXT,
    -- BaZi, Vedic, Nine Star Ki compatibility notes

    -- Metadata
    generated_by TEXT DEFAULT 'claude', -- Which AI model generated this
    generation_tokens INT, -- Token usage for tracking costs
    regeneration_count INT DEFAULT 0, -- How many times this was regenerated

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match Generation Runs (batch processing tracking)
CREATE TABLE match_generation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Run Info
    initiated_by TEXT, -- 'cron', 'admin', 'user_request'
    initiated_for_user_id UUID REFERENCES users(id), -- NULL if batch run

    -- Results
    users_evaluated INT DEFAULT 0,
    matches_generated INT DEFAULT 0,
    reports_created INT DEFAULT 0,

    -- Performance
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INT,

    -- Errors
    errors JSONB,

    -- Status
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Match Preferences (optional refinement of match algorithm)
CREATE TABLE user_match_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Distance Preferences
    max_distance_miles INT, -- NULL means no limit
    require_same_city BOOLEAN DEFAULT FALSE,
    require_same_country BOOLEAN DEFAULT FALSE,

    -- Age Preferences
    min_age_preference INT,
    max_age_preference INT,

    -- Dealbreakers (specific)
    must_want_children BOOLEAN, -- NULL means no preference
    must_not_have_children BOOLEAN,
    must_be_pet_friendly BOOLEAN,

    -- Match Frequency
    max_matches_per_week INT DEFAULT 2,

    -- Notification Preferences
    notify_on_new_match BOOLEAN DEFAULT TRUE,
    notify_on_mutual_interest BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add introduction_report_id to matches table for easy reference
ALTER TABLE matches
ADD COLUMN introduction_report_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN report_generated_at TIMESTAMPTZ,
ADD COLUMN generation_run_id UUID REFERENCES match_generation_runs(id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_introduction_reports_match_id ON introduction_reports(match_id);
CREATE INDEX idx_match_generation_runs_status ON match_generation_runs(status);
CREATE INDEX idx_match_generation_runs_started_at ON match_generation_runs(started_at DESC);
CREATE INDEX idx_user_match_preferences_user_id ON user_match_preferences(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE introduction_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_match_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view introduction reports for their matches
CREATE POLICY "Users can view own match reports"
    ON introduction_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = introduction_reports.match_id
            AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
        )
    );

-- Users can view their own match preferences
CREATE POLICY "Users can view own match preferences"
    ON user_match_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own match preferences"
    ON user_match_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own match preferences"
    ON user_match_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view match generation runs
CREATE POLICY "Admins can view match generation runs"
    ON match_generation_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.subscription_tier = 'elite' -- Or add an admin flag
        )
    );

-- Service role can do everything (for API routes and cron jobs)
CREATE POLICY "Service role can manage introduction reports"
    ON introduction_reports FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage match generation runs"
    ON match_generation_runs FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage match preferences"
    ON user_match_preferences FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update match report status when report is created
CREATE OR REPLACE FUNCTION update_match_report_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE matches
    SET
        introduction_report_generated = TRUE,
        report_generated_at = NOW()
    WHERE id = NEW.match_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_match_report_status
    AFTER INSERT ON introduction_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_match_report_status();

-- Function to calculate match generation run duration
CREATE OR REPLACE FUNCTION finalize_match_generation_run()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INT;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_finalize_match_generation_run
    BEFORE UPDATE ON match_generation_runs
    FOR EACH ROW
    EXECUTE FUNCTION finalize_match_generation_run();

-- Add updated_at trigger to new tables
CREATE TRIGGER update_introduction_reports_updated_at
    BEFORE UPDATE ON introduction_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_match_preferences_updated_at
    BEFORE UPDATE ON user_match_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
