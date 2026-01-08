-- =====================================================
-- ADD ALL FREE LEAD SOURCES
-- Quora, Dating Forums, Meetup, + More Reddit
-- =====================================================

-- ================== QUORA SOURCES ==================

INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency) VALUES

('quora', 'Quora Dating Advice', 'https://www.quora.com/topic/Dating-Advice', '{
    "topics": ["Dating-Advice", "Dating-and-Relationships", "Online-Dating"],
    "keywords": ["how do I find", "looking for relationship", "want to meet someone", "tired of dating apps", "serious relationship", "ready to settle"],
    "exclude_keywords": ["my ex", "breakup", "cheating", "toxic"],
    "min_answer_length": 100
}'::jsonb, 'daily'),

('quora', 'Quora Relationships', 'https://www.quora.com/topic/Relationships', '{
    "topics": ["Relationships", "Love", "Marriage", "Finding-Love"],
    "keywords": ["how to find", "looking for partner", "want relationship", "meet someone serious", "find love"],
    "exclude_keywords": ["breakup", "divorce", "ex boyfriend", "ex girlfriend"],
    "min_answer_length": 100
}'::jsonb, 'daily');

-- ================== DATING FORUMS ==================

INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency) VALUES

('forum', 'LoveShack - Dating Forum', 'https://www.loveshack.org/forums/romantic/dating/', '{
    "forum_url": "https://www.loveshack.org",
    "forum_type": "loveshack",
    "board_urls": [
        "https://www.loveshack.org/forums/romantic/dating/",
        "https://www.loveshack.org/forums/romantic/singles/"
    ],
    "keywords": ["looking for", "want to find", "ready for relationship", "how do I meet", "where to find"],
    "exclude_keywords": ["my ex", "breakup"],
    "min_post_length": 50
}'::jsonb, 'daily'),

('forum', 'eNotAlone Dating', 'https://www.enotalone.com/forum/forumdisplay.php?f=4', '{
    "forum_url": "https://www.enotalone.com",
    "forum_type": "enotalone",
    "board_urls": [
        "https://www.enotalone.com/forum/forumdisplay.php?f=4",
        "https://www.enotalone.com/forum/forumdisplay.php?f=16"
    ],
    "keywords": ["looking for relationship", "want to meet", "how to find someone", "ready to date"],
    "exclude_keywords": ["breakup", "cheating"],
    "min_post_length": 50
}'::jsonb, 'daily');

-- ================== MEETUP SOURCES ==================

INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency) VALUES

('meetup', 'Meetup Singles NYC', 'https://www.meetup.com/find/?keywords=singles', '{
    "cities": ["New York, NY", "Brooklyn, NY", "Manhattan, NY"],
    "keywords": ["singles", "dating", "relationship", "matchmaking", "speed dating"],
    "exclude_keywords": ["married", "couples only"],
    "event_categories": ["singles", "dating", "social"]
}'::jsonb, 'daily'),

('meetup', 'Meetup Singles LA', 'https://www.meetup.com/find/?keywords=singles', '{
    "cities": ["Los Angeles, CA", "Santa Monica, CA", "West Hollywood, CA"],
    "keywords": ["singles", "dating", "relationship", "matchmaking"],
    "exclude_keywords": ["married", "couples"],
    "event_categories": ["singles", "dating"]
}'::jsonb, 'daily'),

('meetup', 'Meetup Singles SF', 'https://www.meetup.com/find/?keywords=singles', '{
    "cities": ["San Francisco, CA", "Oakland, CA", "Berkeley, CA"],
    "keywords": ["singles", "dating", "relationship", "matchmaking"],
    "exclude_keywords": ["married"],
    "event_categories": ["singles"]
}'::jsonb, 'daily'),

('meetup', 'Meetup Singles Chicago', 'https://www.meetup.com/find/?keywords=singles', '{
    "cities": ["Chicago, IL"],
    "keywords": ["singles", "dating", "relationship", "matchmaking"],
    "event_categories": ["singles", "dating"]
}'::jsonb, 'daily'),

('meetup', 'Meetup Singles Boston', 'https://www.meetup.com/find/?keywords=singles', '{
    "cities": ["Boston, MA", "Cambridge, MA"],
    "keywords": ["singles", "dating", "relationship"],
    "event_categories": ["singles"]
}'::jsonb, 'daily');

-- ================== MORE REDDIT SOURCES ==================

INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency) VALUES

('reddit', 'r/dating_advice', 'https://reddit.com/r/dating_advice', '{
    "subreddit": "dating_advice",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["ready for relationship", "want to find someone", "tired of being single", "looking for advice on finding"],
    "exclude_keywords": ["ex", "breakup", "toxic", "cheating"],
    "min_karma": 50,
    "min_account_age_days": 30
}'::jsonb, 'daily'),

('reddit', 'r/R4R30Plus', 'https://reddit.com/r/R4R30Plus', '{
    "subreddit": "R4R30Plus",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["serious", "long-term", "relationship", "connection", "partner"],
    "exclude_keywords": ["hookup", "casual", "fwb", "ons"],
    "min_karma": 25
}'::jsonb, 'daily'),

('reddit', 'r/R4R40Plus', 'https://reddit.com/r/R4R40Plus', '{
    "subreddit": "R4R40Plus",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["serious", "long-term", "relationship", "connection", "partner"],
    "exclude_keywords": ["hookup", "casual", "fwb"],
    "min_karma": 25
}'::jsonb, 'daily'),

('reddit', 'r/AskMenOver30', 'https://reddit.com/r/AskMenOver30', '{
    "subreddit": "AskMenOver30",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["dating", "relationship", "finding someone", "how to meet", "looking for"],
    "min_karma": 100,
    "min_account_age_days": 60
}'::jsonb, 'daily'),

('reddit', 'r/AskWomenOver30', 'https://reddit.com/r/AskWomenOver30', '{
    "subreddit": "AskWomenOver30",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["dating", "relationship", "finding someone", "how to meet", "looking for"],
    "min_karma": 100,
    "min_account_age_days": 60
}'::jsonb, 'daily'),

('reddit', 'r/SingleParents', 'https://reddit.com/r/SingleParents', '{
    "subreddit": "SingleParents",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["dating", "ready to date", "looking for relationship", "want to find someone"],
    "exclude_keywords": ["custody", "court", "ex drama"],
    "min_karma": 50,
    "min_account_age_days": 30
}'::jsonb, 'daily'),

('reddit', 'r/LongDistance', 'https://reddit.com/r/LongDistance', '{
    "subreddit": "LongDistance",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["looking for", "want to find", "ready to meet", "serious relationship"],
    "exclude_keywords": ["breakup", "breaking up", "should I end"],
    "min_karma": 50
}'::jsonb, 'daily'),

('reddit', 'r/ForeverAloneDating', 'https://reddit.com/r/ForeverAloneDating', '{
    "subreddit": "ForeverAloneDating",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["serious", "relationship", "looking for", "connection", "genuine"],
    "exclude_keywords": ["hookup", "casual"],
    "min_karma": 10,
    "min_account_age_days": 14
}'::jsonb, 'daily'),

('reddit', 'r/relationship_advice', 'https://reddit.com/r/relationship_advice', '{
    "subreddit": "relationship_advice",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["want to find someone", "looking for relationship", "ready to date again", "how do I meet"],
    "exclude_keywords": ["ex", "breakup", "cheating", "toxic", "abuse"],
    "min_karma": 100,
    "min_account_age_days": 60
}'::jsonb, 'daily'),

('reddit', 'r/datingoverfifty', 'https://reddit.com/r/datingoverfifty', '{
    "subreddit": "datingoverfifty",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["looking for", "want to find", "serious", "relationship", "partner"],
    "min_karma": 50
}'::jsonb, 'daily');

-- ================== VERIFICATION ==================

SELECT
    source_type,
    COUNT(*) as count
FROM lead_sources
GROUP BY source_type
ORDER BY source_type;

SELECT
    'Total active sources:' as status,
    COUNT(*) as count
FROM lead_sources
WHERE is_active = true;
