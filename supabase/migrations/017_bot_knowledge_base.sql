-- Bot Knowledge Base System
-- Stores documentation, rules, and knowledge for bots to reference

-- Knowledge base table for storing scraped documentation
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID REFERENCES bot_health(id),
  category TEXT NOT NULL, -- 'accounting', 'legal', 'organization', 'relationships', 'business'
  topic TEXT NOT NULL,
  source_url TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  keywords TEXT[],
  confidence_score DECIMAL(3,2) DEFAULT 0.80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX idx_bot_knowledge_bot_id ON bot_knowledge(bot_id);
CREATE INDEX idx_bot_knowledge_category ON bot_knowledge(category);
CREATE INDEX idx_bot_knowledge_keywords ON bot_knowledge USING GIN(keywords);

-- Bot memory bank - stores conversation context and learned information
CREATE TABLE IF NOT EXISTS bot_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID REFERENCES bot_health(id),
  memory_type TEXT NOT NULL, -- 'fact', 'procedure', 'example', 'rule'
  context TEXT,
  key_info TEXT NOT NULL,
  related_knowledge_ids UUID[],
  importance_score DECIMAL(3,2) DEFAULT 0.50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_recalled_at TIMESTAMP WITH TIME ZONE,
  recall_count INTEGER DEFAULT 0
);

CREATE INDEX idx_bot_memory_bot_id ON bot_memory(bot_id);
CREATE INDEX idx_bot_memory_type ON bot_memory(memory_type);

-- Knowledge sources - tracks where information comes from
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'documentation', 'regulation', 'guideline', 'best_practice'
  source_url TEXT,
  authority_level TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot expertise areas - defines what each bot specializes in
CREATE TABLE IF NOT EXISTS bot_expertise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID REFERENCES bot_health(id),
  expertise_area TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'intermediate', -- 'novice', 'intermediate', 'expert'
  knowledge_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bot_expertise_bot_id ON bot_expertise(bot_id);

-- Function to increment access count
CREATE OR REPLACE FUNCTION increment_knowledge_access(knowledge_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE bot_knowledge
  SET access_count = access_count + 1,
      last_accessed_at = NOW()
  WHERE id = knowledge_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment recall count
CREATE OR REPLACE FUNCTION increment_memory_recall(memory_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE bot_memory
  SET recall_count = recall_count + 1,
      last_recalled_at = NOW()
  WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- Seed bot expertise areas
INSERT INTO bot_expertise (bot_id, expertise_area, proficiency_level)
SELECT
  bh.id,
  CASE
    WHEN bh.bot_name = 'dave' THEN 'accounting_finance'
    WHEN bh.bot_name = 'jordan' THEN 'organization_management'
    WHEN bh.bot_name = 'henry' THEN 'lead_conversion'
    WHEN bh.bot_name = 'dan' THEN 'dating_relationships'
    WHEN bh.bot_name = 'annie' THEN 'grief_support'
    WHEN bh.bot_name = 'atlas' THEN 'content_knowledge_base'
  END as expertise_area,
  CASE
    WHEN bh.bot_name IN ('jordan', 'atlas') THEN 'expert'
    ELSE 'intermediate'
  END as proficiency_level
FROM bot_health bh
ON CONFLICT DO NOTHING;

COMMENT ON TABLE bot_knowledge IS 'Central knowledge base for all bots with scraped documentation and rules';
COMMENT ON TABLE bot_memory IS 'Bot memory bank for storing learned information and context';
COMMENT ON TABLE knowledge_sources IS 'Tracks authoritative sources for knowledge';
COMMENT ON TABLE bot_expertise IS 'Defines expertise areas for each bot';
