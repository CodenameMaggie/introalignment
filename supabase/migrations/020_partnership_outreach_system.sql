-- =====================================================
-- PARTNERSHIP & OUTREACH SYSTEM
-- For recruiting lawyers, legal experts, and podcast guests
-- =====================================================

-- Professional Partners (Lawyers, Legal Experts, Educators)
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    linkedin_url TEXT,
    website_url TEXT,

    -- Professional Details
    professional_title VARCHAR(255), -- e.g., "Estate Planning Attorney", "Tax Attorney"
    firm_name VARCHAR(255),
    bar_number VARCHAR(100),
    licensed_states TEXT[], -- Array of states where licensed
    years_experience INTEGER,

    -- Specializations
    specializations TEXT[], -- e.g., ["Dynasty Trusts", "Asset Protection", "International Tax"]
    practice_areas TEXT[], -- e.g., ["Estate Planning", "Business Law", "Tax Law"]
    certifications TEXT[], -- e.g., ["CFP", "CPA", "LLM in Taxation"]

    -- Expertise & Credentials
    bio TEXT,
    notable_cases TEXT, -- Major cases or achievements
    publications TEXT[], -- Books, articles, papers
    speaking_engagements TEXT[], -- Conferences, seminars
    media_appearances TEXT[], -- TV, radio, podcast appearances

    -- Partnership Status
    partner_type VARCHAR(50) DEFAULT 'prospect', -- 'prospect', 'contacted', 'interested', 'active', 'inactive'
    partnership_tier VARCHAR(50), -- 'consultant', 'advisor', 'featured_partner', 'equity_partner'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'on_hold'

    -- Podcast Interest
    podcast_interest BOOLEAN DEFAULT FALSE,
    podcast_topics TEXT[], -- Topics they can speak about
    podcast_availability TEXT, -- Their availability for recording
    podcast_status VARCHAR(50), -- 'not_interested', 'interested', 'scheduled', 'recorded', 'published'

    -- Outreach Tracking
    source VARCHAR(100), -- 'inbound_application', 'directory_scrape', 'referral', 'manual_outreach'
    referred_by VARCHAR(255), -- Name of person who referred them
    initial_contact_date DATE,
    last_contact_date DATE,
    next_follow_up_date DATE,

    -- Engagement Metrics
    response_time_avg INTEGER, -- Average response time in hours
    meetings_held INTEGER DEFAULT 0,
    referrals_made INTEGER DEFAULT 0,
    clients_served INTEGER DEFAULT 0,

    -- Compensation & Terms
    consultation_rate DECIMAL(10, 2), -- Hourly or per-consultation rate
    commission_structure JSONB, -- Commission terms for referrals
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_url TEXT,
    contract_signed_date DATE,

    -- Notes & Communication
    internal_notes TEXT,
    strengths TEXT,
    concerns TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Search optimization
    search_vector TSVECTOR
);

-- Podcast Episodes & Guests
CREATE TABLE IF NOT EXISTS podcast_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Episode Details
    episode_number INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    topics TEXT[], -- Main topics covered

    -- Guest Info (can be a partner or external guest)
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    guest_name VARCHAR(255), -- If not a partner
    guest_email VARCHAR(255),
    guest_bio TEXT,

    -- Recording & Publishing
    recording_date DATE,
    recording_duration INTEGER, -- Minutes
    recording_url TEXT, -- Link to recording file
    transcript_url TEXT,

    publish_date DATE,
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'scheduled', 'recorded', 'editing', 'published'

    -- Distribution
    youtube_url TEXT,
    spotify_url TEXT,
    apple_podcasts_url TEXT,

    -- Engagement Metrics
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,

    -- SEO & Promotion
    seo_keywords TEXT[],
    show_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Campaign Details
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- 'email', 'linkedin', 'phone', 'conference'
    target_audience VARCHAR(100), -- 'estate_attorneys', 'tax_attorneys', 'all_lawyers'

    -- Content
    subject_line VARCHAR(255),
    email_template TEXT,
    email_variables JSONB, -- Variables for personalization

    -- Targeting
    criteria JSONB, -- Targeting criteria (years_experience, specializations, etc.)

    -- Campaign Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'

    -- Schedule
    start_date DATE,
    end_date DATE,

    -- Results
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_responded INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Messages (Individual messages sent)
CREATE TABLE IF NOT EXISTS outreach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Links
    campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,

    -- Message Details
    channel VARCHAR(50) NOT NULL, -- 'email', 'linkedin', 'phone', 'in_person'
    subject TEXT,
    message_body TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'bounced'

    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,

    -- Response
    response_text TEXT,
    response_sentiment VARCHAR(50), -- 'positive', 'neutral', 'negative'

    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer Directory Sources (for scraping)
CREATE TABLE IF NOT EXISTS lawyer_directories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Directory Info
    directory_name VARCHAR(255) NOT NULL,
    directory_url TEXT NOT NULL,
    directory_type VARCHAR(50), -- 'state_bar', 'avvo', 'martindale', 'super_lawyers'

    -- Scraping Config
    scrape_config JSONB DEFAULT '{}',
    scrape_frequency VARCHAR(50) DEFAULT 'weekly',
    last_scraped_at TIMESTAMPTZ,
    next_scrape_at TIMESTAMPTZ,

    -- Focus
    target_specializations TEXT[], -- What specializations to focus on
    target_states TEXT[], -- What states to target
    min_years_experience INTEGER, -- Minimum experience filter

    -- Stats
    total_lawyers_found INTEGER DEFAULT 0,
    total_contacted INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partnership Notes & Activity Log
CREATE TABLE IF NOT EXISTS partner_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,

    -- Activity Details
    activity_type VARCHAR(50) NOT NULL, -- 'email', 'call', 'meeting', 'contract', 'referral'
    activity_title VARCHAR(255),
    activity_description TEXT,

    -- Participants
    participants TEXT[], -- Names/emails of other participants

    -- Outcome
    outcome VARCHAR(50), -- 'positive', 'neutral', 'negative', 'action_required'
    next_steps TEXT,

    -- Timestamps
    activity_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_partner_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_specializations ON partners USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_partners_licensed_states ON partners USING GIN(licensed_states);
CREATE INDEX IF NOT EXISTS idx_partners_podcast_interest ON partners(podcast_interest);
CREATE INDEX IF NOT EXISTS idx_partners_search_vector ON partners USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_podcast_episodes_status ON podcast_episodes(status);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_partner_id ON podcast_episodes(partner_id);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_publish_date ON podcast_episodes(publish_date);

CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON outreach_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_partner_id ON outreach_messages(partner_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_campaign_id ON outreach_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_status ON outreach_messages(status);

CREATE INDEX IF NOT EXISTS idx_partner_activities_partner_id ON partner_activities(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_activities_activity_type ON partner_activities(activity_type);

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION update_partner_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.specializations, ' '), '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.practice_areas, ' '), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_search_vector_update
    BEFORE INSERT OR UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_search_vector();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER podcast_episodes_updated_at
    BEFORE UPDATE ON podcast_episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER outreach_campaigns_updated_at
    BEFORE UPDATE ON outreach_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed initial lawyer directories
INSERT INTO lawyer_directories (directory_name, directory_url, directory_type, target_specializations, target_states, is_active) VALUES
('State Bar of California', 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch', 'state_bar', ARRAY['Estate Planning', 'Tax Law', 'Business Law'], ARRAY['California'], true),
('State Bar of New York', 'https://iapps.courts.state.ny.us/attorney/AttorneySearch', 'state_bar', ARRAY['Estate Planning', 'Tax Law', 'Business Law'], ARRAY['New York'], true),
('State Bar of Texas', 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer', 'state_bar', ARRAY['Estate Planning', 'Tax Law', 'Business Law'], ARRAY['Texas'], true),
('Delaware Bar Association', 'https://www.dsba.org/for-the-public/find-a-lawyer/', 'state_bar', ARRAY['Business Law', 'Corporate Law'], ARRAY['Delaware'], true),
('Wyoming Bar', 'https://www.wyomingbar.org/for-the-public/find-a-lawyer/', 'state_bar', ARRAY['Business Law', 'Asset Protection'], ARRAY['Wyoming'], true),
('Avvo - Estate Planning Attorneys', 'https://www.avvo.com/estate-planning-lawyer.html', 'avvo', ARRAY['Estate Planning', 'Trusts'], ARRAY['all'], true),
('Martindale-Hubbell - Tax Attorneys', 'https://www.martindale.com/by-practice-area/tax-law-lawyers/', 'martindale', ARRAY['Tax Law', 'International Tax'], ARRAY['all'], true),
('Super Lawyers - Estate Planning', 'https://www.superlawyers.com/estate-planning', 'super_lawyers', ARRAY['Estate Planning', 'Wealth Management'], ARRAY['all'], true);

-- Success message
SELECT 'Partnership & Outreach System created successfully!' as message;
