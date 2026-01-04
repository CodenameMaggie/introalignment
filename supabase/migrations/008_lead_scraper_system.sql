-- =====================================================
-- LEAD SCRAPER & OUTREACH SYSTEM
-- Automated pipeline: Scrape → Enrich → Score → Outreach
-- =====================================================

-- Lead sources configuration
CREATE TABLE lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source info
    source_type VARCHAR(50) NOT NULL, -- 'reddit', 'twitter', 'forum', 'facebook', 'manual'
    source_name VARCHAR(255) NOT NULL,
    source_url TEXT,

    -- Scraping config
    scrape_config JSONB DEFAULT '{}',

    -- Schedule
    scrape_frequency VARCHAR(50) DEFAULT 'daily',
    last_scraped_at TIMESTAMPTZ,
    next_scrape_at TIMESTAMPTZ,

    -- Stats
    total_leads_found INT DEFAULT 0,
    leads_converted INT DEFAULT 0,
    conversion_rate DECIMAL,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source tracking
    source_id UUID REFERENCES lead_sources(id),
    source_type VARCHAR(50) NOT NULL,
    source_identifier TEXT,
    source_url TEXT,

    -- Basic info
    username VARCHAR(255),
    display_name VARCHAR(255),
    bio TEXT,

    -- Extracted info
    estimated_age_range VARCHAR(50),
    estimated_gender VARCHAR(50),
    location_mentioned TEXT,
    interests JSONB DEFAULT '[]',
    relationship_goal VARCHAR(100),

    -- Content that triggered scrape
    trigger_content TEXT,
    trigger_keywords JSONB DEFAULT '[]',

    -- Enrichment
    email VARCHAR(255),
    email_confidence DECIMAL,
    email_source VARCHAR(100),

    phone VARCHAR(50),
    phone_confidence DECIMAL,

    linkedin_url TEXT,
    twitter_url TEXT,
    instagram_url TEXT,

    full_name VARCHAR(255),
    company VARCHAR(255),
    job_title VARCHAR(255),

    enrichment_status VARCHAR(50) DEFAULT 'pending',
    enriched_at TIMESTAMPTZ,

    -- Scoring
    fit_score DECIMAL,
    fit_score_breakdown JSONB,
    priority VARCHAR(20) DEFAULT 'medium',

    -- Status
    status VARCHAR(50) DEFAULT 'new',

    -- Outreach tracking
    outreach_status VARCHAR(50) DEFAULT 'pending',
    current_sequence_id UUID,
    emails_sent INT DEFAULT 0,
    emails_opened INT DEFAULT 0,
    emails_clicked INT DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    last_response_at TIMESTAMPTZ,

    -- Conversion
    converted_at TIMESTAMPTZ,
    converted_user_id UUID REFERENCES users(id),

    -- Notes
    notes TEXT,
    tags JSONB DEFAULT '[]',

    -- Dedup
    fingerprint VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape runs log
CREATE TABLE scrape_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES lead_sources(id),

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'running',

    items_scraped INT DEFAULT 0,
    leads_found INT DEFAULT 0,
    leads_new INT DEFAULT 0,
    leads_duplicate INT DEFAULT 0,

    error_message TEXT,
    error_details JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email sequences
CREATE TABLE outreach_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Targeting
    target_source_types JSONB DEFAULT '[]',
    target_fit_score_min DECIMAL DEFAULT 50,
    target_relationship_goals JSONB DEFAULT '[]',

    -- Sequence config
    total_emails INT DEFAULT 3,

    -- Stats
    leads_enrolled INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    emails_opened INT DEFAULT 0,
    emails_clicked INT DEFAULT 0,
    responses INT DEFAULT 0,
    conversions INT DEFAULT 0,
    unsubscribes INT DEFAULT 0,

    open_rate DECIMAL,
    click_rate DECIMAL,
    response_rate DECIMAL,
    conversion_rate DECIMAL,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual emails in sequence
CREATE TABLE sequence_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES outreach_sequences(id) ON DELETE CASCADE,

    step_number INT NOT NULL,
    delay_days INT DEFAULT 0,

    subject_line TEXT NOT NULL,
    subject_line_variants JSONB DEFAULT '[]',

    body_html TEXT NOT NULL,
    body_text TEXT,
    body_variants JSONB DEFAULT '[]',

    times_sent INT DEFAULT 0,
    times_opened INT DEFAULT 0,
    times_clicked INT DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead enrollment in sequences
CREATE TABLE sequence_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES outreach_sequences(id) ON DELETE CASCADE,

    current_step INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',

    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    next_email_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    emails_sent INT DEFAULT 0,
    emails_opened INT DEFAULT 0,
    emails_clicked INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(lead_id, sequence_id)
);

-- Individual email sends
CREATE TABLE email_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES outreach_sequences(id),
    sequence_email_id UUID REFERENCES sequence_emails(id),
    enrollment_id UUID REFERENCES sequence_enrollments(id),

    to_email VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,

    provider VARCHAR(50) DEFAULT 'resend',
    provider_message_id VARCHAR(255),

    status VARCHAR(50) DEFAULT 'pending',

    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    open_count INT DEFAULT 0,
    clicked_at TIMESTAMPTZ,
    click_count INT DEFAULT 0,
    clicked_links JSONB DEFAULT '[]',

    error_message TEXT,
    bounce_type VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach responses
CREATE TABLE outreach_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    email_send_id UUID REFERENCES email_sends(id),

    response_type VARCHAR(50),
    response_content TEXT,

    sentiment VARCHAR(50),
    interest_level VARCHAR(50),

    action_taken VARCHAR(100),
    notes TEXT,

    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_leads_source ON leads(source_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_outreach_status ON leads(outreach_status);
CREATE INDEX idx_leads_fit_score ON leads(fit_score DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_fingerprint ON leads(fingerprint);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

CREATE INDEX idx_scrape_runs_source ON scrape_runs(source_id);
CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);

CREATE INDEX idx_enrollments_lead ON sequence_enrollments(lead_id);
CREATE INDEX idx_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX idx_enrollments_next_email ON sequence_enrollments(next_email_at);

CREATE INDEX idx_email_sends_lead ON email_sends(lead_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_sent ON email_sends(sent_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_responses ENABLE ROW LEVEL SECURITY;

-- Admin only access
CREATE POLICY "Admin full access to lead_sources"
    ON lead_sources FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admin full access to leads"
    ON leads FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admin full access to scrape_runs"
    ON scrape_runs FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admin full access to sequences"
    ON outreach_sequences FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admin full access to sequence_emails"
    ON sequence_emails FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admin full access to enrollments"
    ON sequence_enrollments FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admin full access to email_sends"
    ON email_sends FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admin full access to responses"
    ON outreach_responses FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Increment lead opens
CREATE OR REPLACE FUNCTION increment_lead_opens(enrollment_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE leads
    SET emails_opened = emails_opened + 1
    WHERE id = (SELECT lead_id FROM sequence_enrollments WHERE id = enrollment_id);
END;
$$ LANGUAGE plpgsql;

-- Increment lead clicks
CREATE OR REPLACE FUNCTION increment_lead_clicks(enrollment_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE leads
    SET emails_clicked = emails_clicked + 1
    WHERE id = (SELECT lead_id FROM sequence_enrollments WHERE id = enrollment_id);
END;
$$ LANGUAGE plpgsql;

-- Increment source leads
CREATE OR REPLACE FUNCTION increment_source_leads(source_id UUID, new_leads INT)
RETURNS VOID AS $$
BEGIN
    UPDATE lead_sources
    SET total_leads_found = total_leads_found + new_leads
    WHERE id = source_id;
END;
$$ LANGUAGE plpgsql;
