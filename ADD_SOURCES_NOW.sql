-- =====================================================
-- ADD 60+ NEW REDDIT SOURCES - RUN THIS IN SUPABASE NOW
-- =====================================================
-- Copy this entire file and run it in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency) VALUES

-- Relationship & Dating subreddits
('reddit', 'r/r4r', 'https://reddit.com/r/r4r', '{"subreddit": "r4r", "sort": "new", "time_filter": "day", "keywords": ["looking for", "seeking", "relationship", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/Needafriend', 'https://reddit.com/r/Needafriend', '{"subreddit": "Needafriend", "sort": "new", "time_filter": "day", "keywords": ["lonely", "looking", "connection"], "min_karma": 5}'::jsonb, 'daily'),
('reddit', 'r/MakeNewFriendsHere', 'https://reddit.com/r/MakeNewFriendsHere', '{"subreddit": "MakeNewFriendsHere", "sort": "new", "time_filter": "day", "keywords": ["single", "looking for more", "relationship"], "min_karma": 5}'::jsonb, 'daily'),
('reddit', 'r/dating_advice', 'https://reddit.com/r/dating_advice', '{"subreddit": "dating_advice", "sort": "new", "time_filter": "day", "keywords": ["how do I", "help me", "advice on"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/relationships', 'https://reddit.com/r/relationships', '{"subreddit": "relationships", "sort": "new", "time_filter": "day", "keywords": ["single", "looking", "ready to date"], "min_karma": 50}'::jsonb, 'daily'),
('reddit', 'r/BreakUps', 'https://reddit.com/r/BreakUps', '{"subreddit": "BreakUps", "sort": "new", "time_filter": "week", "keywords": ["ready to move on", "back out there", "start dating"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/lonely', 'https://reddit.com/r/lonely', '{"subreddit": "lonely", "sort": "new", "time_filter": "day", "keywords": ["want to meet", "looking for", "relationship"], "min_karma": 5}'::jsonb, 'daily'),
('reddit', 'r/single', 'https://reddit.com/r/single', '{"subreddit": "single", "sort": "new", "time_filter": "day", "keywords": ["looking", "seeking", "want"], "min_karma": 5}'::jsonb, 'daily'),
('reddit', 'r/Soulmate', 'https://reddit.com/r/Soulmate', '{"subreddit": "Soulmate", "sort": "new", "time_filter": "week", "keywords": ["looking for", "seeking", "want to find"], "min_karma": 5}'::jsonb, 'daily'),
('reddit', 'r/RelationshipAdvice', 'https://reddit.com/r/RelationshipAdvice', '{"subreddit": "RelationshipAdvice", "sort": "new", "time_filter": "day", "keywords": ["single", "dating", "ready"], "min_karma": 20}'::jsonb, 'daily'),

-- Age-specific dating subreddits
('reddit', 'r/datingover40', 'https://reddit.com/r/datingover40', '{"subreddit": "datingover40", "sort": "new", "time_filter": "day", "keywords": ["looking", "seeking", "serious"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/datingover50', 'https://reddit.com/r/datingover50', '{"subreddit": "datingover50", "sort": "new", "time_filter": "day", "keywords": ["looking", "seeking", "serious"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/datingover60', 'https://reddit.com/r/datingover60', '{"subreddit": "datingover60", "sort": "new", "time_filter": "day", "keywords": ["looking", "seeking", "companionship"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/R4R30', 'https://reddit.com/r/R4R30', '{"subreddit": "R4R30", "sort": "new", "time_filter": "day", "keywords": ["looking", "seeking", "relationship"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/R4R50Plus', 'https://reddit.com/r/R4R50Plus', '{"subreddit": "R4R50Plus", "sort": "new", "time_filter": "day", "keywords": ["looking", "seeking", "companionship"], "min_karma": 5}'::jsonb, 'daily'),
('reddit', 'r/AskMenOver50', 'https://reddit.com/r/AskMenOver50', '{"subreddit": "AskMenOver50", "sort": "new", "time_filter": "day", "keywords": ["dating", "relationship", "looking for"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/AskWomenOver40', 'https://reddit.com/r/AskWomenOver40', '{"subreddit": "AskWomenOver40", "sort": "new", "time_filter": "day", "keywords": ["dating", "relationship", "looking for"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/AskWomenOver50', 'https://reddit.com/r/AskWomenOver50', '{"subreddit": "AskWomenOver50", "sort": "new", "time_filter": "day", "keywords": ["dating", "companionship", "relationship"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/AskMenOver40', 'https://reddit.com/r/AskMenOver40', '{"subreddit": "AskMenOver40", "sort": "new", "time_filter": "day", "keywords": ["dating", "relationship", "serious"], "min_karma": 20}'::jsonb, 'daily'),

-- Location-specific R4R (30 major cities)
('reddit', 'r/NYCr4r', 'https://reddit.com/r/NYCr4r', '{"subreddit": "NYCr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/LAr4r', 'https://reddit.com/r/LAr4r', '{"subreddit": "LAr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/SFr4r', 'https://reddit.com/r/SFr4r', '{"subreddit": "SFr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/chicagor4r', 'https://reddit.com/r/chicagor4r', '{"subreddit": "chicagor4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/bostonr4r', 'https://reddit.com/r/bostonr4r', '{"subreddit": "bostonr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/seattler4r', 'https://reddit.com/r/seattler4r', '{"subreddit": "seattler4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/austinr4r', 'https://reddit.com/r/austinr4r', '{"subreddit": "austinr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/denverre4r', 'https://reddit.com/r/denverre4r', '{"subreddit": "denverre4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/portlandr4r', 'https://reddit.com/r/portlandr4r', '{"subreddit": "portlandr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/atlantar4r', 'https://reddit.com/r/atlantar4r', '{"subreddit": "atlantar4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/PhillyR4R', 'https://reddit.com/r/PhillyR4R', '{"subreddit": "PhillyR4R", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/SoCalR4R', 'https://reddit.com/r/SoCalR4R', '{"subreddit": "SoCalR4R", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/MiamiR4R', 'https://reddit.com/r/MiamiR4R', '{"subreddit": "MiamiR4R", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/DallasR4R', 'https://reddit.com/r/DallasR4R', '{"subreddit": "DallasR4R", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/HoustonR4R', 'https://reddit.com/r/HoustonR4R', '{"subreddit": "HoustonR4R", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/SanDiegoR4R', 'https://reddit.com/r/SanDiegoR4R', '{"subreddit": "SanDiegoR4R", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/PhoenixR4R', 'https://reddit.com/r/PhoenixR4R', '{"subreddit": "PhoenixR4R", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/minneapolisr4r', 'https://reddit.com/r/minneapolisr4r', '{"subreddit": "minneapolisr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/tampabay4r', 'https://reddit.com/r/tampabay4r', '{"subreddit": "tampabay4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/vegasr4r', 'https://reddit.com/r/vegasr4r', '{"subreddit": "vegasr4r", "sort": "new", "time_filter": "day", "keywords": ["relationship", "dating", "serious"], "min_karma": 10}'::jsonb, 'daily'),

-- Lifestyle & Interest-based
('reddit', 'r/cf4cf', 'https://reddit.com/r/cf4cf', '{"subreddit": "cf4cf", "sort": "new", "time_filter": "week", "keywords": ["looking", "seeking", "relationship"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/childfree', 'https://reddit.com/r/childfree', '{"subreddit": "childfree", "sort": "new", "time_filter": "day", "keywords": ["dating", "partner", "looking for"], "min_karma": 50}'::jsonb, 'daily'),
('reddit', 'r/divorce', 'https://reddit.com/r/divorce', '{"subreddit": "divorce", "sort": "new", "time_filter": "week", "keywords": ["ready to date", "moving on", "new chapter"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/widowers', 'https://reddit.com/r/widowers', '{"subreddit": "widowers", "sort": "new", "time_filter": "week", "keywords": ["ready", "companionship", "moving forward"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/introvert', 'https://reddit.com/r/introvert', '{"subreddit": "introvert", "sort": "new", "time_filter": "day", "keywords": ["dating", "relationship", "connection"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/socialanxiety', 'https://reddit.com/r/socialanxiety', '{"subreddit": "socialanxiety", "sort": "new", "time_filter": "day", "keywords": ["dating", "relationship", "connection"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/demisexuality', 'https://reddit.com/r/demisexuality', '{"subreddit": "demisexuality", "sort": "new", "time_filter": "week", "keywords": ["dating", "looking for", "connection"], "min_karma": 10}'::jsonb, 'daily'),
('reddit', 'r/asexualdating', 'https://reddit.com/r/asexualdating', '{"subreddit": "asexualdating", "sort": "new", "time_filter": "week", "keywords": ["looking", "seeking", "relationship"], "min_karma": 5}'::jsonb, 'daily'),
('reddit', 'r/introverts', 'https://reddit.com/r/introverts', '{"subreddit": "introverts", "sort": "new", "time_filter": "day", "keywords": ["dating", "relationship", "partner"], "min_karma": 15}'::jsonb, 'daily'),

-- Personal growth & broad reach
('reddit', 'r/CasualConversation', 'https://reddit.com/r/CasualConversation', '{"subreddit": "CasualConversation", "sort": "new", "time_filter": "day", "keywords": ["single", "dating", "relationship", "looking for"], "min_karma": 50}'::jsonb, 'daily'),
('reddit', 'r/self', 'https://reddit.com/r/self', '{"subreddit": "self", "sort": "new", "time_filter": "day", "keywords": ["single", "lonely", "dating", "looking for love"], "min_karma": 30}'::jsonb, 'daily'),
('reddit', 'r/offmychest', 'https://reddit.com/r/offmychest', '{"subreddit": "offmychest", "sort": "new", "time_filter": "day", "keywords": ["single", "lonely", "want to find", "looking for"], "min_karma": 20}'::jsonb, 'daily'),
('reddit', 'r/TrueOffMyChest', 'https://reddit.com/r/TrueOffMyChest', '{"subreddit": "TrueOffMyChest", "sort": "new", "time_filter": "day", "keywords": ["single", "dating", "relationship", "lonely"], "min_karma": 30}'::jsonb, 'daily')

ON CONFLICT (source_name) DO NOTHING;

-- Show results
SELECT 'Total active sources:' as status, COUNT(*) as count FROM lead_sources WHERE is_active = true;
