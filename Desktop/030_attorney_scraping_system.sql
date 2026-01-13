-- =====================================================
-- AUTOMATED ATTORNEY SCRAPING SYSTEM
-- =====================================================
-- Creates infrastructure for automated attorney discovery
-- Scrapes ACTEC and WealthCounsel directories continuously
-- Auto-scores and auto-enrolls qualified prospects

-- =====================================================
-- 1. CREATE ATTORNEY SOURCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS attorney_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL, -- 'actec', 'wealthcounsel', 'linkedin', 'state_bar'
    source_url VARCHAR(500),
    description TEXT,

    -- Scraping configuration
    scrape_config JSONB DEFAULT '{}'::jsonb,
    scrape_frequency VARCHAR(50) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
    is_active BOOLEAN DEFAULT true,

    -- Statistics
    total_attorneys_found INTEGER DEFAULT 0,
    total_attorneys_created INTEGER DEFAULT 0,
    last_scraped_at TIMESTAMPTZ,
    next_scrape_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default sources
INSERT INTO attorney_sources (source_name, source_type, source_url, description, scrape_config, scrape_frequency, is_active) VALUES
(
    'ACTEC Fellows Directory',
    'actec',
    'https://www.actec.org/find-a-fellow/',
    'American College of Trust and Estate Counsel - invitation-only membership of top-tier estate planning attorneys (~2,600 Fellows)',
    '{"target_specializations": ["Dynasty Trusts", "Asset Protection", "Tax Planning"], "target_states": ["California", "New York", "Texas", "Florida", "Illinois", "Washington"], "min_years_experience": 10, "max_results_per_run": 50}',
    'daily',
    true
),
(
    'WealthCounsel Members Directory',
    'wealthcounsel',
    'https://www.wealthcounsel.com/find-a-member',
    'WealthCounsel - national network of estate planning attorneys focused on business ownership and entrepreneurial clients (~4,000 members)',
    '{"target_specializations": ["Asset Protection", "Business Succession", "Dynasty Trusts"], "target_states": ["California", "New York", "Texas", "Florida", "Illinois", "Washington"], "min_years_experience": 5, "max_results_per_run": 50}',
    'daily',
    true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CREATE SCRAPING ACTIVITY LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS attorney_scraping_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES attorney_sources(id) ON DELETE CASCADE,
    scrape_started_at TIMESTAMPTZ NOT NULL,
    scrape_completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Results
    attorneys_found INTEGER DEFAULT 0,
    attorneys_created INTEGER DEFAULT 0,
    duplicates_skipped INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed'
    error_message TEXT,

    -- Metadata
    scraper_version VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_scraping_log_source ON attorney_scraping_log(source_id);
CREATE INDEX IF NOT EXISTS idx_scraping_log_status ON attorney_scraping_log(status);
CREATE INDEX IF NOT EXISTS idx_scraping_log_started ON attorney_scraping_log(scrape_started_at DESC);

-- =====================================================
-- 3. CREATE ATTORNEY SCRAPING STATS VIEW
-- =====================================================

CREATE OR REPLACE VIEW attorney_scraping_stats AS
SELECT
    s.source_name,
    s.source_type,
    s.is_active,
    s.total_attorneys_found,
    s.total_attorneys_created,
    s.last_scraped_at,

    -- Last 24 hours stats
    (SELECT COUNT(*) FROM attorney_scraping_log l
     WHERE l.source_id = s.id
     AND l.scrape_started_at >= NOW() - INTERVAL '24 hours'
     AND l.status = 'completed') as scrapes_last_24h,

    (SELECT COALESCE(SUM(l.attorneys_created), 0) FROM attorney_scraping_log l
     WHERE l.source_id = s.id
     AND l.scrape_started_at >= NOW() - INTERVAL '24 hours'
     AND l.status = 'completed') as attorneys_created_last_24h,

    -- Last 7 days stats
    (SELECT COALESCE(SUM(l.attorneys_created), 0) FROM attorney_scraping_log l
     WHERE l.source_id = s.id
     AND l.scrape_started_at >= NOW() - INTERVAL '7 days'
     AND l.status = 'completed') as attorneys_created_last_7d,

    -- Error rate
    (SELECT COUNT(*) FROM attorney_scraping_log l
     WHERE l.source_id = s.id
     AND l.status = 'failed') as total_failures
FROM attorney_sources s
ORDER BY s.source_name;

-- =====================================================
-- 4. CREATE FUNCTION TO GET SCRAPING SUMMARY
-- =====================================================

CREATE OR REPLACE FUNCTION get_scraping_summary()
RETURNS TABLE(
    total_sources INTEGER,
    active_sources INTEGER,
    total_attorneys_scraped BIGINT,
    attorneys_created_today BIGINT,
    attorneys_created_this_week BIGINT,
    scrapes_today BIGINT,
    recent_failures BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM attorney_sources) as total_sources,
        (SELECT COUNT(*)::INTEGER FROM attorney_sources WHERE is_active = true) as active_sources,
        (SELECT COALESCE(SUM(total_attorneys_created), 0)::BIGINT FROM attorney_sources) as total_attorneys_scraped,

        (SELECT COALESCE(SUM(attorneys_created), 0)::BIGINT FROM attorney_scraping_log
         WHERE scrape_started_at >= CURRENT_DATE
         AND status = 'completed') as attorneys_created_today,

        (SELECT COALESCE(SUM(attorneys_created), 0)::BIGINT FROM attorney_scraping_log
         WHERE scrape_started_at >= CURRENT_DATE - INTERVAL '7 days'
         AND status = 'completed') as attorneys_created_this_week,

        (SELECT COUNT(*)::BIGINT FROM attorney_scraping_log
         WHERE scrape_started_at >= CURRENT_DATE
         AND status = 'completed') as scrapes_today,

        (SELECT COUNT(*)::BIGINT FROM attorney_scraping_log
         WHERE scrape_started_at >= NOW() - INTERVAL '24 hours'
         AND status = 'failed') as recent_failures;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- View attorney sources
SELECT * FROM attorney_sources;

-- View scraping stats
SELECT * FROM attorney_scraping_stats;

-- Get scraping summary
SELECT * FROM get_scraping_summary();

-- Check recent attorney scrapes
SELECT
    p.full_name,
    p.email,
    p.source,
    p.actec_fellow,
    p.wealthcounsel_member,
    p.licensed_states,
    p.specializations,
    p.podcast_status,
    p.initial_contact_date
FROM partners p
WHERE p.source IN ('actec_directory', 'wealthcounsel_directory')
ORDER BY p.initial_contact_date DESC
LIMIT 20;

-- =====================================================
-- SYSTEM SUMMARY
-- =====================================================

/*
AUTOMATED ATTORNEY SCRAPING SYSTEM

ARCHITECTURE:
1. Cron job runs every 6 hours: /api/cron/scrape-attorneys
2. Scrapes ACTEC directory (~2,600 Fellows)
3. Scrapes WealthCounsel directory (~4,000 members)
4. Auto-scores each attorney (business_builder + expertise)
5. Inserts into partners table as 'prospect'
6. Podcast outreach cron (every 10 min) auto-enrolls qualified prospects (fit_score >= 12)
7. Auto-sends invitations, follow-ups, tracks responses

SOURCES:
- ACTEC: Top-tier, invitation-only, 10+ years experience
- WealthCounsel: Practice owners, entrepreneurial, business-focused

TARGET: 10,000 estate planning attorneys
THROTTLE: Auto-stops at 10,000

CONFIGURATION:
- ATTORNEY_SCRAPING_ENABLED=true (default)
- target_states: Focus on high-value markets (CA, NY, TX, FL)
- max_results_per_run: 50 per source per run
- scrape_frequency: daily

MONITORING:
- View stats: SELECT * FROM attorney_scraping_stats;
- View summary: SELECT * FROM get_scraping_summary();
- Check recent scrapes: SELECT * FROM attorney_scraping_log ORDER BY scrape_started_at DESC LIMIT 10;

FLOW:
Scrape → Score → Insert → Auto-enroll → Auto-send → Track → Follow-up

ZERO MANUAL WORK REQUIRED.
*/
