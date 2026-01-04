-- IntroAlignment Interactive Dashboard
-- Migration 006: Seed Badges & Deal Breakers

-- ============================================
-- BADGES
-- ============================================

INSERT INTO badges (name, description, badge_type, criteria, points_value) VALUES

-- Streak badges
('First Week', 'Completed 7 days in a row', 'streak', '{"type": "streak", "days": 7}', 50),
('Two Weeks Strong', 'Completed 14 days in a row', 'streak', '{"type": "streak", "days": 14}', 100),
('Monthly Dedication', 'Completed 30 days in a row', 'streak', '{"type": "streak", "days": 30}', 250),

-- Completion badges
('Game Starter', 'Completed your first game', 'completion', '{"type": "games_completed", "count": 1}', 10),
('Game Enthusiast', 'Completed 25 games', 'completion', '{"type": "games_completed", "count": 25}', 75),
('Game Master', 'Completed 100 games', 'completion', '{"type": "games_completed", "count": 100}', 200),

('Puzzle Beginner', 'Solved your first puzzle', 'completion', '{"type": "puzzles_solved", "count": 1}', 10),
('Puzzle Pro', 'Solved 50 puzzles', 'completion', '{"type": "puzzles_solved", "count": 50}', 150),

('Avid Reader', 'Read 10 articles', 'completion', '{"type": "articles_read", "count": 10}', 50),
('Bookworm', 'Read 50 articles', 'completion', '{"type": "articles_read", "count": 50}', 150),

-- Engagement badges
('Conversation Starter', 'Posted in 5 discussions', 'engagement', '{"type": "discussions_joined", "count": 5}', 50),
('Community Voice', 'Posted in 25 discussions', 'engagement', '{"type": "discussions_joined", "count": 25}', 150),

('Poll Participant', 'Voted in 10 polls', 'engagement', '{"type": "polls_voted", "count": 10}', 30),

-- Personality badges (awarded when trait confidence > 0.8)
('Open Mind', 'High openness to experience', 'personality', '{"type": "personality_trait", "trait": "openness", "threshold": 0.75}', 0),
('Steady Hand', 'High conscientiousness', 'personality', '{"type": "personality_trait", "trait": "conscientiousness", "threshold": 0.75}', 0),
('Social Butterfly', 'High extraversion', 'personality', '{"type": "personality_trait", "trait": "extraversion", "threshold": 0.75}', 0),
('Kind Heart', 'High agreeableness', 'personality', '{"type": "personality_trait", "trait": "agreeableness", "threshold": 0.75}', 0),
('Deep Thinker', 'Thoughtful and reflective', 'personality', '{"type": "personality_trait", "trait": "analytical_thinking", "threshold": 0.75}', 0),

-- Special badges
('Early Adopter', 'Joined during beta', 'special', '{"type": "special", "condition": "beta_user"}', 100),
('Profile Complete', 'Reached 100% profile completion', 'special', '{"type": "profile_completion", "threshold": 1.0}', 200),
('First Match', 'Received your first introduction', 'special', '{"type": "special", "condition": "first_match"}', 100);

-- ============================================
-- DEAL BREAKER ITEMS
-- ============================================

INSERT INTO dealbreaker_items (item_text, category, extraction_targets) VALUES

-- Lifestyle
('Smoking cigarettes', 'lifestyle', '{"dealbreaker_category": "health_habits"}'),
('Heavy drinking (5+ drinks regularly)', 'lifestyle', '{"dealbreaker_category": "health_habits"}'),
('Doesn''t exercise at all', 'lifestyle', '{"dealbreaker_category": "health_habits"}'),
('Vegan/vegetarian diet', 'lifestyle', '{"dealbreaker_category": "diet"}'),
('Messy/disorganized home', 'lifestyle', '{"dealbreaker_category": "cleanliness"}'),
('Works 60+ hours per week', 'lifestyle', '{"dealbreaker_category": "work_life_balance"}'),
('Travels frequently for work', 'lifestyle', '{"dealbreaker_category": "availability"}'),
('Night owl (up past midnight)', 'lifestyle', '{"dealbreaker_category": "schedule"}'),
('Early bird (up before 6am)', 'lifestyle', '{"dealbreaker_category": "schedule"}'),

-- Values
('Different religious beliefs', 'values', '{"dealbreaker_category": "religion"}'),
('Doesn''t want children', 'values', '{"dealbreaker_category": "family_planning"}'),
('Wants children', 'values', '{"dealbreaker_category": "family_planning"}'),
('Different political views', 'values', '{"dealbreaker_category": "politics"}'),
('Not close with their family', 'values', '{"dealbreaker_category": "family_relationships"}'),
('Very close with their family (talks daily)', 'values', '{"dealbreaker_category": "family_relationships"}'),

-- Relationship Style
('Needs lots of alone time', 'relationship_style', '{"dealbreaker_category": "space_needs"}'),
('Wants to spend all free time together', 'relationship_style', '{"dealbreaker_category": "togetherness"}'),
('Not comfortable with public affection', 'relationship_style', '{"dealbreaker_category": "affection_style"}'),
('Very affectionate in public', 'relationship_style', '{"dealbreaker_category": "affection_style"}'),
('Friends with exes', 'relationship_style', '{"dealbreaker_category": "boundaries"}'),
('Doesn''t believe in marriage', 'relationship_style', '{"dealbreaker_category": "commitment"}'),
('Wants to get married quickly', 'relationship_style', '{"dealbreaker_category": "pace"}'),

-- Habits
('Spends a lot on hobbies/interests', 'habits', '{"dealbreaker_category": "financial"}'),
('Very frugal/budget-conscious', 'habits', '{"dealbreaker_category": "financial"}'),
('Lots of debt', 'habits', '{"dealbreaker_category": "financial"}'),
('Plays video games often', 'habits', '{"dealbreaker_category": "hobbies"}'),
('Watches TV every night', 'habits', '{"dealbreaker_category": "leisure"}'),
('Always on their phone', 'habits', '{"dealbreaker_category": "technology"}'),
('No social media presence', 'habits', '{"dealbreaker_category": "technology"}'),

-- Life Goals
('Wants to relocate/move away', 'life_goals', '{"dealbreaker_category": "location"}'),
('Career-focused over family', 'life_goals', '{"dealbreaker_category": "priorities"}'),
('Wants to retire early', 'life_goals', '{"dealbreaker_category": "ambition"}'),
('No clear life goals', 'life_goals', '{"dealbreaker_category": "ambition"}'),
('Wants to start a business', 'life_goals', '{"dealbreaker_category": "risk"}');

-- ============================================
-- DISCUSSION TOPICS
-- ============================================

INSERT INTO discussion_topics (prompt_text, description, category, extraction_targets, is_daily_prompt) VALUES

('What''s your idea of a perfect date?',
'Share what makes a date memorable for you',
'dating',
'{"values": ["romance_style", "activity_preferences"], "lifestyle": ["social_style", "planning_preference"], "personality": ["introversion_extraversion"]}',
TRUE),

('What lesson from a past relationship do you carry with you?',
'Reflect on growth from past experiences',
'growth',
'{"attachment": ["past_patterns", "growth_mindset"], "values": ["self_awareness"], "vulnerability": ["openness"]}',
TRUE),

('How do you handle disagreements with people you care about?',
'Share your approach to conflict',
'communication',
'{"relationship": ["conflict_style", "communication_patterns"], "attachment": ["security_level"], "personality": ["agreeableness"]}',
TRUE),

('What does "home" mean to you?',
'Describe your sense of home and belonging',
'lifestyle',
'{"values": ["stability", "family", "comfort"], "lifestyle": ["living_preferences"], "attachment": ["security_needs"]}',
TRUE),

('What''s something you''ve changed your mind about in relationships?',
'Share how your views have evolved',
'growth',
'{"values": ["growth_mindset", "flexibility"], "personality": ["openness"], "maturity": ["self_reflection"]}',
TRUE),

('How do you show someone you care about them?',
'Describe your way of expressing love',
'love',
'{"love_languages": ["giving_style"], "attachment": ["expression_comfort"], "values": ["affection_importance"]}',
TRUE),

('What''s a non-negotiable for you in a relationship?',
'Share your core requirements',
'values',
'{"dealbreakers": ["explicit"], "values": ["priorities"], "boundaries": ["clarity"]}',
TRUE),

('Describe your ideal weekend.',
'Paint a picture of your perfect time off',
'lifestyle',
'{"lifestyle": ["activity_level", "social_preferences", "interests"], "personality": ["introversion_extraversion", "openness"]}',
TRUE),

('What does trust look like to you?',
'Explore what builds trust in relationships',
'values',
'{"values": ["trust_definition"], "attachment": ["trust_patterns"], "relationship": ["expectations"]}',
TRUE),

('If you could live anywhere in the world, where would it be and why?',
'Share your dream location',
'lifestyle',
'{"lifestyle": ["location_values", "adventure_vs_stability"], "values": ["priorities"], "interests": ["travel", "culture"]}',
TRUE);

-- ============================================
-- POLLS
-- ============================================

INSERT INTO polls (question_text, poll_type, options, extraction_targets) VALUES

('How important is physical attraction in a relationship?',
'single_choice',
'[{"id": "1", "text": "Essential - must have strong chemistry"}, {"id": "2", "text": "Important but not everything"}, {"id": "3", "text": "Grows over time with emotional connection"}, {"id": "4", "text": "Less important than compatibility"}]',
'{"values": ["physical_attraction_importance"], "relationship": ["attraction_beliefs"]}'),

('How soon is too soon to say "I love you"?',
'single_choice',
'[{"id": "1", "text": "Under 1 month"}, {"id": "2", "text": "1-3 months"}, {"id": "3", "text": "3-6 months"}, {"id": "4", "text": "When it feels right, timing doesn''t matter"}]',
'{"attachment": ["pace_preference", "vulnerability_timeline"], "values": ["emotional_expression"]}'),

('Would you date someone with very different political views?',
'single_choice',
'[{"id": "1", "text": "Yes, diversity of thought is healthy"}, {"id": "2", "text": "Depends on the specific issues"}, {"id": "3", "text": "Probably not, values need to align"}, {"id": "4", "text": "Absolutely not, it''s fundamental"}]',
'{"values": ["political_importance", "openness_to_difference"], "dealbreakers": ["political"]}'),

('What''s your ideal living situation?',
'single_choice',
'[{"id": "1", "text": "Together from the start"}, {"id": "2", "text": "Separate places, spend most nights together"}, {"id": "3", "text": "Living together after 1+ year"}, {"id": "4", "text": "Living apart together (LAT) long-term"}]',
'{"lifestyle": ["cohabitation_preference"], "attachment": ["independence_needs"], "relationship": ["pace_preference"]}'),

('How do you prefer to spend quality time?',
'single_choice',
'[{"id": "1", "text": "Active adventures together"}, {"id": "2", "text": "Cozy nights in"}, {"id": "3", "text": "Social activities with friends"}, {"id": "4", "text": "Parallel activities in the same space"}]',
'{"love_languages": ["quality_time_style"], "lifestyle": ["activity_preference"], "personality": ["introversion_extraversion"]}');
