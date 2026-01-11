-- =====================================================
-- ADD WEB AND WIKIPEDIA SCRAPING SOURCES
-- Expanding data collection to web search engines and Wikipedia
-- =====================================================

-- Add Google Search Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES
('web', 'Google - Dating Singles', 'https://google.com', '{
  "search_engines": ["google"],
  "keywords": ["single", "dating", "looking for relationship", "seeking partner"],
  "exclude_keywords": ["married", "taken", "in a relationship"],
  "max_results_per_engine": 100
}'::jsonb, 'daily', true),

('web', 'Google - Relationship Advice', 'https://google.com', '{
  "search_engines": ["google"],
  "keywords": ["breakup advice", "divorce support", "ready to date again", "moving on"],
  "exclude_keywords": ["get back together", "reconciliation"],
  "max_results_per_engine": 100
}'::jsonb, 'daily', true),

('web', 'Google - Age-Specific Dating', 'https://google.com', '{
  "search_engines": ["google"],
  "keywords": ["dating over 40", "dating over 50", "mature singles", "senior dating"],
  "exclude_keywords": [],
  "max_results_per_engine": 100
}'::jsonb, 'daily', true);

-- Add Bing Search Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES
('web', 'Bing - Singles Search', 'https://bing.com', '{
  "search_engines": ["bing"],
  "keywords": ["single and ready", "looking for love", "seeking relationship"],
  "exclude_keywords": ["married", "engaged"],
  "max_results_per_engine": 100
}'::jsonb, 'daily', true),

('web', 'Bing - Dating Forums', 'https://bing.com', '{
  "search_engines": ["bing"],
  "keywords": ["dating forum", "singles community", "relationship discussion"],
  "exclude_keywords": [],
  "max_results_per_engine": 100
}'::jsonb, 'daily', true);

-- Add DuckDuckGo Search Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES
('web', 'DuckDuckGo - Dating Singles', 'https://duckduckgo.com', '{
  "search_engines": ["duckduckgo"],
  "keywords": ["single", "looking for relationship", "want to meet someone"],
  "exclude_keywords": [],
  "max_results_per_engine": 100
}'::jsonb, 'daily', true);

-- Add Multi-Engine Search Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES
('web', 'Multi-Engine - Serious Relationships', 'https://web', '{
  "search_engines": ["google", "bing", "duckduckgo"],
  "keywords": ["serious relationship", "long term partner", "life partner"],
  "exclude_keywords": ["casual", "hookup", "fwb"],
  "max_results_per_engine": 50
}'::jsonb, 'daily', true),

('web', 'Multi-Engine - Location-Based Singles', 'https://web', '{
  "search_engines": ["google", "bing"],
  "keywords": ["singles near me", "local dating", "singles events"],
  "exclude_keywords": [],
  "max_results_per_engine": 50
}'::jsonb, 'daily', true);

-- Add Wikipedia Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES
('wikipedia', 'Wikipedia - Dating Categories', 'https://en.wikipedia.org', '{
  "categories": ["Dating", "Matchmaking", "Online_dating", "Courtship", "Romance"],
  "keywords": ["dating", "relationship", "single", "matchmaking", "courtship"],
  "exclude_keywords": ["history", "ancient"],
  "languages": ["en"]
}'::jsonb, 'weekly', true),

('wikipedia', 'Wikipedia - Relationship Advice', 'https://en.wikipedia.org', '{
  "categories": ["Relationships", "Interpersonal_relationships", "Love", "Emotions"],
  "keywords": ["relationship", "dating", "love", "partner"],
  "exclude_keywords": ["historical", "fiction"],
  "languages": ["en"]
}'::jsonb, 'weekly', true),

('wikipedia', 'Wikipedia - Marriage and Partnership', 'https://en.wikipedia.org', '{
  "categories": ["Marriage", "Cohabitation", "Domestic_partnership"],
  "keywords": ["marriage", "partnership", "commitment", "spouse"],
  "exclude_keywords": ["divorce", "separation"],
  "languages": ["en"]
}'::jsonb, 'weekly', true);

-- Add sources for dating-related blogs and websites
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES
('web', 'Dating Blogs Search', 'https://web', '{
  "search_engines": ["google", "bing"],
  "keywords": ["dating blog", "relationship blog", "single life blog"],
  "exclude_keywords": [],
  "max_results_per_engine": 50
}'::jsonb, 'daily', true),

('web', 'Singles Stories Search', 'https://web', '{
  "search_engines": ["google"],
  "keywords": ["single story", "dating experience", "my dating journey"],
  "exclude_keywords": [],
  "max_results_per_engine": 100
}'::jsonb, 'daily', true);

-- Summary
SELECT
  'New sources added' as status,
  COUNT(*) FILTER (WHERE source_type = 'web') as web_sources,
  COUNT(*) FILTER (WHERE source_type = 'wikipedia') as wikipedia_sources,
  COUNT(*) as total_new_sources
FROM lead_sources
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Total sources count
SELECT
  source_type,
  COUNT(*) as count,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM lead_sources
GROUP BY source_type
ORDER BY count DESC;
