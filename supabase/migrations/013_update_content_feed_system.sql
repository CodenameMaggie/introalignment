-- IntroAlignment Content Feed System
-- Migration 014: Update content_articles and content_interactions for new feed system

-- ============================================
-- UPDATE content_articles TABLE
-- ============================================

-- Add new required fields
ALTER TABLE content_articles
ADD COLUMN IF NOT EXISTS slug VARCHAR(500) UNIQUE,
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS read_time_minutes INT,
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Make old body_html column nullable (transitioning to 'content' column)
ALTER TABLE content_articles
ALTER COLUMN body_html DROP NOT NULL;

-- Create slug index for fast lookups
CREATE INDEX IF NOT EXISTS idx_content_articles_slug ON content_articles(slug);

-- Update existing data to work with new schema
-- Set slug from title if not exists
UPDATE content_articles
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Map old fields to new fields
UPDATE content_articles
SET
    excerpt = COALESCE(summary, subtitle),
    content = body_html,
    cover_image_url = image_url,
    author_name = COALESCE(author, 'IntroAlignment Team'),
    is_published = (is_active = TRUE AND published_at IS NOT NULL),
    read_time_minutes = GREATEST(1, LENGTH(body_html) / 1000) -- Estimate: ~200 words per minute, ~5 chars per word
WHERE excerpt IS NULL OR content IS NULL;

-- ============================================
-- UPDATE content_interactions TABLE
-- ============================================

-- Drop old table and recreate with new schema
DROP TABLE IF EXISTS content_interactions CASCADE;

CREATE TABLE content_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES content_articles(id) ON DELETE CASCADE,

    -- Simple interaction type field
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'read', 'like', 'save')),

    -- Reading time tracking
    reading_time_seconds INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one interaction type per user per article
    UNIQUE(user_id, article_id, interaction_type)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_content_interactions_user_article ON content_interactions(user_id, article_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type ON content_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_content_articles_published ON content_articles(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_content_articles_category_published ON content_articles(category, is_published);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own content interactions" ON content_interactions;
DROP POLICY IF EXISTS "Users can insert own content interactions" ON content_interactions;
DROP POLICY IF EXISTS "Users can update own content interactions" ON content_interactions;
DROP POLICY IF EXISTS "Users can delete own content interactions" ON content_interactions;

-- Users can view own interactions
CREATE POLICY "Users can view own content interactions" ON content_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own interactions
CREATE POLICY "Users can insert own content interactions" ON content_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own interactions
CREATE POLICY "Users can update own content interactions" ON content_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own interactions (for unlike/unsave)
CREATE POLICY "Users can delete own content interactions" ON content_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Update article RLS policy to use is_published
DROP POLICY IF EXISTS "Anyone can view published articles" ON content_articles;
CREATE POLICY "Anyone can view published articles" ON content_articles
    FOR SELECT USING (is_published = TRUE);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_interaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_content_interactions_updated_at ON content_interactions;
CREATE TRIGGER update_content_interactions_updated_at
    BEFORE UPDATE ON content_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_content_interaction_timestamp();

-- ============================================
-- ADD interests_from_content to profile_extractions
-- ============================================

-- Add field to track content-based interests
ALTER TABLE profile_extractions
ADD COLUMN IF NOT EXISTS interests_from_content JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "Communication": 5,
--   "Dating": 3,
--   "Growth": 8
-- }

COMMENT ON COLUMN profile_extractions.interests_from_content IS 'Category engagement counts from content interactions';
