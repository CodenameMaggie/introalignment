-- =====================================================
-- CONVERSATION SYSTEM
-- Natural language onboarding through AI conversation
-- =====================================================

-- Conversation Chapters (7 chapters of questions)
CREATE TABLE conversation_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_number INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    question_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations (tracks each user's conversation progress)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_chapter_id UUID REFERENCES conversation_chapters(id),
    current_question_number INT DEFAULT 1,
    questions_answered INT DEFAULT 0,
    total_questions INT DEFAULT 49,
    is_complete BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Messages (all messages exchanged)
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'assistant' or 'user'
    content TEXT NOT NULL,
    chapter_id UUID REFERENCES conversation_chapters(id),
    question_number INT,
    extraction_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Extractions (psychological insights)
CREATE TABLE conversation_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES conversation_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Extracted psychological data
    big_five_updates JSONB DEFAULT '{}',
    -- Example: {"openness": 0.75, "conscientiousness": 0.60}

    attachment_indicators JSONB DEFAULT '{}',
    -- Example: {"secure": 0.8, "anxious": 0.2, "avoidant": 0.1}

    values_mentioned JSONB DEFAULT '[]',
    -- Example: ["family", "adventure", "growth"]

    interests_mentioned JSONB DEFAULT '{}',
    -- Example: {"travel": 0.9, "cooking": 0.6}

    relationship_insights JSONB DEFAULT '{}',
    -- Example: {"communication_style": "direct", "conflict_style": "collaborative"}

    lifestyle_indicators JSONB DEFAULT '{}',
    -- Example: {"social_preference": "ambivert", "activity_level": "moderate"}

    emotional_intelligence JSONB DEFAULT '{}',
    -- Example: {"self_awareness": 0.8, "empathy": 0.7}

    cognitive_indicators JSONB DEFAULT '{}',
    -- Example: {"decision_style": "analytical", "planning_orientation": "future-focused"}

    red_flags JSONB DEFAULT '[]',
    -- Example: ["possessiveness", "poor_boundaries"]

    green_flags JSONB DEFAULT '[]',
    -- Example: ["emotional_maturity", "self_awareness", "healthy_boundaries"]

    raw_extraction TEXT,
    -- Full LLM extraction response for debugging

    confidence_score DECIMAL DEFAULT 0.5,
    -- How confident we are in this extraction (0-1)

    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_current_chapter ON conversations(current_chapter_id);
CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX idx_conversation_extractions_conversation_id ON conversation_extractions(conversation_id);
CREATE INDEX idx_conversation_extractions_user_id ON conversation_extractions(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE conversation_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_extractions ENABLE ROW LEVEL SECURITY;

-- Chapters are public (everyone can see the chapter structure)
CREATE POLICY "Chapters are viewable by everyone"
    ON conversation_chapters FOR SELECT
    USING (true);

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only see messages from their conversations
CREATE POLICY "Users can view own conversation messages"
    ON conversation_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own conversation messages"
    ON conversation_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

-- Users can view their own extractions
CREATE POLICY "Users can view own extractions"
    ON conversation_extractions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role can manage conversation chapters"
    ON conversation_chapters FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage conversations"
    ON conversations FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage messages"
    ON conversation_messages FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage extractions"
    ON conversation_extractions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SEED DATA - 7 CHAPTERS
-- =====================================================

INSERT INTO conversation_chapters (chapter_number, title, description, emoji, question_count) VALUES
(1, 'Your World', 'Let''s start with where you are in life right now', '🌍', 7),
(2, 'Your Story', 'Everyone has a unique journey', '📖', 7),
(3, 'Your Relationships', 'How you connect with others', '💞', 7),
(4, 'Your Mind', 'How you think and process the world', '🧠', 7),
(5, 'Your Heart', 'What you feel and value', '❤️', 7),
(6, 'Your Future', 'Where you''re headed', '🚀', 7),
(7, 'The Details', 'The little things that matter', '✨', 7);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update conversation progress
CREATE OR REPLACE FUNCTION update_conversation_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_message_at whenever a message is added
    UPDATE conversations
    SET
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_progress
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_progress();

-- Function to apply extractions to profile_extractions table
CREATE OR REPLACE FUNCTION apply_conversation_extraction_to_profile()
RETURNS TRIGGER AS $$
DECLARE
    current_profile RECORD;
    trait TEXT;
    new_value DECIMAL;
    current_value DECIMAL;
    data_points INT;
    confidence DECIMAL;
BEGIN
    -- Get current profile
    SELECT * INTO current_profile
    FROM profile_extractions
    WHERE user_id = NEW.user_id;

    -- If no profile exists, create one
    IF current_profile IS NULL THEN
        INSERT INTO profile_extractions (user_id)
        VALUES (NEW.user_id);

        SELECT * INTO current_profile
        FROM profile_extractions
        WHERE user_id = NEW.user_id;
    END IF;

    -- Update Big Five traits
    IF NEW.big_five_updates IS NOT NULL AND jsonb_typeof(NEW.big_five_updates) = 'object' THEN
        FOR trait IN SELECT jsonb_object_keys(NEW.big_five_updates) LOOP
            IF trait IN ('openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism') THEN
                -- Get new value from extraction
                new_value := (NEW.big_five_updates->>trait)::DECIMAL;

                -- Get current values
                EXECUTE format('SELECT %I, %I, %I FROM profile_extractions WHERE user_id = $1',
                    trait,
                    trait || '_data_points',
                    trait || '_confidence')
                INTO current_value, data_points, confidence
                USING NEW.user_id;

                -- Weighted moving average
                current_value := COALESCE(current_value, 0.5);
                data_points := COALESCE(data_points, 0);

                new_value := (current_value * data_points + new_value) / (data_points + 1);
                new_value := GREATEST(0, LEAST(1, new_value)); -- Clamp to 0-1

                -- Update profile
                EXECUTE format('UPDATE profile_extractions SET %I = $1, %I = $2, %I = $3 WHERE user_id = $4',
                    trait,
                    trait || '_data_points',
                    trait || '_confidence')
                USING new_value, data_points + 1, LEAST(0.95, (data_points + 1) / 20.0), NEW.user_id;
            END IF;
        END LOOP;
    END IF;

    -- Update values (merge with existing)
    IF NEW.values_mentioned IS NOT NULL THEN
        UPDATE profile_extractions
        SET values_hierarchy = COALESCE(values_hierarchy, '[]'::jsonb) || NEW.values_mentioned
        WHERE user_id = NEW.user_id;
    END IF;

    -- Update interests (merge with existing, keeping highest scores)
    IF NEW.interests_mentioned IS NOT NULL THEN
        UPDATE profile_extractions
        SET interests = COALESCE(interests, '{}'::jsonb) || NEW.interests_mentioned
        WHERE user_id = NEW.user_id;
    END IF;

    -- Update lifestyle indicators (merge with existing)
    IF NEW.lifestyle_indicators IS NOT NULL THEN
        UPDATE profile_extractions
        SET lifestyle_indicators = COALESCE(lifestyle_indicators, '{}'::jsonb) || NEW.lifestyle_indicators
        WHERE user_id = NEW.user_id;
    END IF;

    -- Update relationship indicators (merge with existing)
    IF NEW.relationship_insights IS NOT NULL THEN
        UPDATE profile_extractions
        SET relationship_indicators = COALESCE(relationship_indicators, '{}'::jsonb) || NEW.relationship_insights
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apply_conversation_extraction
    AFTER INSERT ON conversation_extractions
    FOR EACH ROW
    EXECUTE FUNCTION apply_conversation_extraction_to_profile();
