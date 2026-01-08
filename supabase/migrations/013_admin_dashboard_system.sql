-- =====================================================
-- ADMIN DASHBOARD SYSTEM
-- Migration 013: Red flags and audit logging for admin oversight
-- =====================================================

-- Red Flags Table (Safety & Quality Monitoring)
CREATE TABLE red_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Flag Details
    flag_type TEXT NOT NULL CHECK (flag_type IN (
        'married',
        'dark_triad',
        'safety',
        'inconsistency',
        'user_report'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source TEXT NOT NULL CHECK (source IN ('conversation', 'game', 'user_report', 'system')),

    -- Evidence
    evidence TEXT, -- Human-readable description
    evidence_data JSONB, -- Structured data (scores, message IDs, etc.)

    -- Review Tracking
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Audit Log (Track All Admin Actions)
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES users(id) NOT NULL,

    -- Action Details
    action TEXT NOT NULL, -- suspended_user, dismissed_flag, deleted_match, etc.
    target_type TEXT NOT NULL, -- user, match, lead, flag, etc.
    target_id UUID, -- ID of the thing being acted upon

    -- Context
    details JSONB, -- Before/after state, reason, etc.
    ip_address TEXT,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add admin role to users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
        ALTER TABLE public.users ADD CONSTRAINT users_role_check
            CHECK (role IN ('user', 'admin', 'moderator'));
    END IF;
END $$;

-- Set admin user
UPDATE public.users
SET role = 'admin'
WHERE email = 'henry@introalignment.com';

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_red_flags_user_id ON red_flags(user_id);
CREATE INDEX idx_red_flags_status ON red_flags(status);
CREATE INDEX idx_red_flags_severity ON red_flags(severity);
CREATE INDEX idx_red_flags_detected_at ON red_flags(detected_at DESC);
CREATE INDEX idx_red_flags_type_severity ON red_flags(flag_type, severity);

CREATE INDEX idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view red flags
CREATE POLICY "Admins can view all red flags"
    ON red_flags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update red flags"
    ON red_flags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Only admins can view audit log
CREATE POLICY "Admins can view audit log"
    ON admin_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Service role can manage everything
CREATE POLICY "Service role can manage red flags"
    ON red_flags FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage audit log"
    ON admin_audit_log FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to log admin actions automatically
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    -- This can be called from triggers to auto-log certain actions
    -- For now, we'll manually call this from admin routes
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on red_flags
CREATE TRIGGER update_red_flags_updated_at
    BEFORE UPDATE ON red_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER VIEWS FOR ADMIN DASHBOARD
-- =====================================================

-- View: Active red flags by severity
CREATE OR REPLACE VIEW admin_active_red_flags AS
SELECT
    rf.*,
    u.full_name as user_name,
    u.email as user_email,
    reviewer.full_name as reviewed_by_name
FROM red_flags rf
JOIN users u ON rf.user_id = u.id
LEFT JOIN users reviewer ON rf.reviewed_by = reviewer.id
WHERE rf.status IN ('new', 'reviewing')
ORDER BY
    CASE rf.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    rf.detected_at DESC;

-- View: User safety summary
CREATE OR REPLACE VIEW admin_user_safety_summary AS
SELECT
    u.id as user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT rf.id) as total_flags,
    COUNT(DISTINCT CASE WHEN rf.status = 'new' THEN rf.id END) as new_flags,
    COUNT(DISTINCT CASE WHEN rf.severity = 'critical' THEN rf.id END) as critical_flags,
    MAX(rf.detected_at) as last_flag_detected,
    ss.overall_risk_level as safety_screening_risk
FROM users u
LEFT JOIN red_flags rf ON u.id = rf.user_id
LEFT JOIN safety_screening ss ON u.id = ss.user_id
GROUP BY u.id, u.full_name, u.email, ss.overall_risk_level;

-- View: Recent admin activity
CREATE OR REPLACE VIEW admin_recent_activity AS
SELECT
    aal.*,
    u.full_name as admin_name,
    u.email as admin_email
FROM admin_audit_log aal
JOIN users u ON aal.admin_user_id = u.id
ORDER BY aal.created_at DESC
LIMIT 100;
