-- =====================================================
-- BOT SYSTEM TABLES
-- For the 6-bot governance system (ATLAS, ANNIE, HENRY, DAVE, DAN, JORDAN)
-- =====================================================

-- Bot health tracking
CREATE TABLE IF NOT EXISTS ai_bot_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_name VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'unknown', -- 'healthy', 'degraded', 'offline', 'unknown'
    last_active TIMESTAMPTZ,
    actions_today INT DEFAULT 0,
    actions_this_hour INT DEFAULT 0,
    success_rate DECIMAL DEFAULT 100,
    error_count INT DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bot action logs
CREATE TABLE IF NOT EXISTS bot_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    bot_name VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'failed', 'pending'
    related_entity_type VARCHAR(50), -- 'user', 'contact', 'match', etc.
    related_entity_id UUID,
    triggered_by VARCHAR(100), -- 'automated', 'user_request', 'cron', etc.
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversations (for ANNIE, ATLAS, etc.)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bot_type VARCHAR(50) NOT NULL, -- 'annie', 'atlas', 'henry', 'dave', 'dan', 'jordan'
    messages JSONB DEFAULT '[]', -- Array of {role, content, timestamp}
    message_count INT DEFAULT 0,
    conversation_summary TEXT,
    key_facts JSONB DEFAULT '[]', -- Important facts extracted from conversation
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'escalated'
    context JSONB DEFAULT '{}', -- Additional context
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Action Log (for tracking specific bot actions)
CREATE TABLE IF NOT EXISTS ai_action_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    bot_name VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_user_id UUID,
    target_email VARCHAR(255),
    campaign_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bot_health_bot_name ON ai_bot_health(bot_name);
CREATE INDEX IF NOT EXISTS idx_bot_health_status ON ai_bot_health(status);

CREATE INDEX IF NOT EXISTS idx_bot_actions_bot_name ON bot_actions_log(bot_name);
CREATE INDEX IF NOT EXISTS idx_bot_actions_status ON bot_actions_log(status);
CREATE INDEX IF NOT EXISTS idx_bot_actions_created ON bot_actions_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_actions_tenant ON bot_actions_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_bot ON ai_conversations(bot_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON ai_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_log_bot ON ai_action_log(bot_name);
CREATE INDEX IF NOT EXISTS idx_action_log_status ON ai_action_log(status);
CREATE INDEX IF NOT EXISTS idx_action_log_created ON ai_action_log(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE ai_bot_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_log ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to ai_bot_health"
    ON ai_bot_health FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to bot_actions_log"
    ON bot_actions_log FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to ai_action_log"
    ON ai_action_log FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role can manage all conversations
CREATE POLICY "Service role full access to ai_conversations"
    ON ai_conversations FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SEED DATA
-- =====================================================

-- Initialize bot health records
INSERT INTO ai_bot_health (bot_name, status) VALUES
    ('atlas', 'unknown'),
    ('annie', 'unknown'),
    ('henry', 'unknown'),
    ('dave', 'unknown'),
    ('dan', 'unknown'),
    ('jordan', 'unknown')
ON CONFLICT (bot_name) DO NOTHING;
