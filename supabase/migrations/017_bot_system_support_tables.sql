-- =====================================================
-- BOT SYSTEM SUPPORT TABLES
-- Creates 12 missing tables that the 6-bot system depends on
-- =====================================================

-- =====================================================
-- HENRY BOT TABLES (Onboarding)
-- =====================================================

-- User onboarding tracking
CREATE TABLE IF NOT EXISTS user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,
    automated_by VARCHAR(50), -- 'henry', 'manual', etc.
    current_step VARCHAR(100),
    next_action VARCHAR(100),
    next_action_at TIMESTAMPTZ,

    -- Onboarding milestones
    welcome_email_sent BOOLEAN DEFAULT FALSE,
    welcome_email_sent_at TIMESTAMPTZ,
    account_created BOOLEAN DEFAULT FALSE,
    account_created_at TIMESTAMPTZ,
    profile_completed BOOLEAN DEFAULT FALSE,
    profile_completed_at TIMESTAMPTZ,
    preferences_completed BOOLEAN DEFAULT FALSE,
    preferences_completed_at TIMESTAMPTZ,
    first_login BOOLEAN DEFAULT FALSE,
    first_login_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMPTZ,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User health checks for engagement monitoring
CREATE TABLE IF NOT EXISTS user_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    -- Engagement metrics
    last_login_days_ago INT,
    messages_sent INT DEFAULT 0,
    matches_viewed INT DEFAULT 0,
    engagement_score INT,
    engagement_status VARCHAR(50), -- 'healthy', 'at_risk', 'churned'

    -- AI analysis
    ai_analysis TEXT,
    recommended_actions JSONB DEFAULT '[]',

    checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANNIE BOT TABLES (Conversations & Support)
-- =====================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    subject VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'technical', 'billing', 'matchmaking', 'escalation'
    priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'

    source VARCHAR(50), -- 'ai_bot', 'user_request', 'system'
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    escalation_reason TEXT,

    assigned_to UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extended)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    tenant_id UUID,

    bio TEXT,
    interests JSONB DEFAULT '[]',
    hobbies JSONB DEFAULT '[]',
    values JSONB DEFAULT '[]',

    profile_completion_percentage INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    tenant_id UUID,

    -- Communication preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT TRUE,
    match_notifications BOOLEAN DEFAULT TRUE,
    message_notifications BOOLEAN DEFAULT TRUE,

    -- Matching preferences
    match_distance_miles INT DEFAULT 25,
    age_range_min INT DEFAULT 25,
    age_range_max INT DEFAULT 45,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DAN BOT TABLES (Marketing)
-- =====================================================

-- Email tracking
CREATE TABLE IF NOT EXISTS email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    email_type VARCHAR(100), -- 'welcome', 'promotional', 'match_notification', etc.
    campaign_id VARCHAR(100),
    sequence_id UUID,

    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    complained_at TIMESTAMPTZ,

    sent_by VARCHAR(100), -- 'dan', 'system', 'admin'

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    referred_email VARCHAR(255) NOT NULL,
    referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    referral_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'signed_up', 'converted'

    reward_amount INT, -- Credits or currency amount
    reward_credited BOOLEAN DEFAULT FALSE,
    reward_credited_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Marketing campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(100), -- 'email', 'promotional', 'reactivation'

    scheduled_for TIMESTAMPTZ,
    target_audience JSONB, -- Criteria for who receives it

    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'cancelled'

    -- Stats
    total_sent INT DEFAULT 0,
    total_opened INT DEFAULT 0,
    total_clicked INT DEFAULT 0,

    created_by VARCHAR(100), -- 'dan', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- =====================================================
-- JORDAN BOT TABLES (Safety & Compliance)
-- =====================================================

-- User reports
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    reason VARCHAR(255), -- 'harassment', 'inappropriate_content', 'spam', 'fake_profile'
    description TEXT,
    evidence_urls JSONB DEFAULT '[]',

    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'dismissed'
    priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,

    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety violations
CREATE TABLE IF NOT EXISTS safety_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    content_type VARCHAR(100), -- 'profile', 'message', 'photo'
    content_id UUID,

    violations JSONB, -- Array of violation types detected
    severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'

    reasoning TEXT,
    automated_action VARCHAR(100), -- 'flag', 'suspend', 'ban', 'require_review'

    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy requests (GDPR, CCPA)
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    request_type VARCHAR(100), -- 'data_export', 'data_deletion', 'opt_out', 'rectification'
    request_details TEXT,

    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'

    processed_by UUID,
    completion_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- User blocks
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID,

    reason VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(blocker_user_id, blocked_user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_status ON user_onboarding(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_next_action ON user_onboarding(next_action_at);

CREATE INDEX IF NOT EXISTS idx_user_health_checks_user ON user_health_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_checks_status ON user_health_checks(engagement_status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority, status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_email_tracking_user ON email_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign ON email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent ON email_tracking(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled ON marketing_campaigns(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_user_id);

CREATE INDEX IF NOT EXISTS idx_safety_violations_user ON safety_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_violations_reviewed ON safety_violations(reviewed);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all bot tables
CREATE POLICY "Service role full access to user_onboarding"
    ON user_onboarding FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to user_health_checks"
    ON user_health_checks FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to support_tickets"
    ON support_tickets FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to email_tracking"
    ON email_tracking FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to marketing_campaigns"
    ON marketing_campaigns FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to safety_violations"
    ON safety_violations FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Users can view and update their own profile
CREATE POLICY "Users view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view and update their own preferences
CREATE POLICY "Users view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own referrals
CREATE POLICY "Users view own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users create referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_user_id);

-- Users can create reports
CREATE POLICY "Users create reports"
    ON user_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users view own reports"
    ON user_reports FOR SELECT
    USING (auth.uid() = reporter_user_id);

-- Users can create privacy requests
CREATE POLICY "Users create privacy requests"
    ON privacy_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own privacy requests"
    ON privacy_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create and view their own blocks
CREATE POLICY "Users create blocks"
    ON user_blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_user_id);

CREATE POLICY "Users view own blocks"
    ON user_blocks FOR SELECT
    USING (auth.uid() = blocker_user_id);

CREATE POLICY "Users delete own blocks"
    ON user_blocks FOR DELETE
    USING (auth.uid() = blocker_user_id);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Create default preferences for existing users (if any)
-- This will only run if there are existing users without preferences
INSERT INTO user_preferences (user_id, tenant_id)
SELECT id, tenant_id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Verify tables created
SELECT 'Bot support tables created:' as status,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_name IN (
         'user_onboarding', 'user_health_checks', 'support_tickets',
         'user_profiles', 'user_preferences', 'email_tracking',
         'referrals', 'marketing_campaigns', 'user_reports',
         'safety_violations', 'privacy_requests', 'user_blocks'
     )) as table_count;
