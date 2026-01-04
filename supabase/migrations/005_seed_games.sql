-- IntroAlignment Interactive Dashboard
-- Migration 005: Seed Game Content

-- ============================================
-- WOULD YOU RATHER
-- ============================================

-- Insert "Would You Rather" game
INSERT INTO games (game_type, title, description, is_daily, extracts_values, extracts_personality, extracts_lifestyle, points_value)
VALUES ('would_you_rather', 'Would You Rather', 'Fun scenarios that reveal your priorities', TRUE, TRUE, TRUE, TRUE, 10);

-- Sample questions
INSERT INTO game_questions (game_id, question_text, question_type, options, extraction_targets, scoring_logic, sequence_order) VALUES

-- Question 1: Adventure vs Security
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather...',
'binary',
'[{"id": "a", "text": "Travel to a new country every month but never have a permanent home"}, {"id": "b", "text": "Live in your dream home but never travel internationally again"}]',
'{"values": {"category": "adventure_vs_security"}, "big_five": {"dimension": "openness"}, "lifestyle": {"category": "stability_preference"}}',
'{"a": {"openness": 0.3, "adventure": 0.4, "security": -0.2}, "b": {"openness": -0.1, "adventure": -0.3, "security": 0.4}}',
1),

-- Question 2: Social vs Solitude
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather...',
'binary',
'[{"id": "a", "text": "Spend every weekend at social gatherings with friends"}, {"id": "b", "text": "Have every weekend completely to yourself"}]',
'{"big_five": {"dimension": "extraversion"}, "lifestyle": {"category": "social_preference"}}',
'{"a": {"extraversion": 0.4, "social_need": 0.3}, "b": {"extraversion": -0.3, "solitude_need": 0.3}}',
2),

-- Question 3: Career vs Relationships
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather...',
'binary',
'[{"id": "a", "text": "Have an incredibly successful career but limited time for relationships"}, {"id": "b", "text": "Have deep, fulfilling relationships but a modest career"}]',
'{"values": {"category": "career_vs_relationships"}, "lifestyle": {"category": "work_life_balance"}}',
'{"a": {"career_priority": 0.4, "relationship_priority": -0.2}, "b": {"career_priority": -0.2, "relationship_priority": 0.4}}',
3),

-- Question 4: Spontaneity vs Planning
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather...',
'binary',
'[{"id": "a", "text": "Book a surprise trip leaving tomorrow to an unknown destination"}, {"id": "b", "text": "Plan your dream vacation 6 months in advance with every detail mapped out"}]',
'{"big_five": {"dimension": "conscientiousness"}, "lifestyle": {"category": "planning_style"}}',
'{"a": {"conscientiousness": -0.2, "spontaneity": 0.4, "openness": 0.2}, "b": {"conscientiousness": 0.3, "spontaneity": -0.3, "planning": 0.3}}',
4),

-- Question 5: Conflict Style
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'In a disagreement with your partner, would you rather...',
'binary',
'[{"id": "a", "text": "Talk it out immediately, even if emotions are high"}, {"id": "b", "text": "Take time to cool off and discuss it later when calmer"}]',
'{"relationship": {"category": "conflict_style"}, "attachment": {"indicator": "communication"}}',
'{"a": {"conflict_direct": 0.3, "emotional_processing": "immediate"}, "b": {"conflict_avoidant": 0.2, "emotional_processing": "delayed"}}',
5),

-- Question 6: Family
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather...',
'binary',
'[{"id": "a", "text": "Live within 10 minutes of your extended family"}, {"id": "b", "text": "Live in your ideal location, even if family is far away"}]',
'{"values": {"category": "family_closeness"}, "lifestyle": {"category": "location_priority"}}',
'{"a": {"family_priority": 0.4, "independence": -0.2}, "b": {"family_priority": -0.1, "independence": 0.3}}',
6),

-- Question 7: Novelty vs Comfort
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'On a Friday night, would you rather...',
'binary',
'[{"id": "a", "text": "Try a brand new restaurant with unusual cuisine"}, {"id": "b", "text": "Go to your favorite restaurant where you know exactly what to order"}]',
'{"big_five": {"dimension": "openness"}, "lifestyle": {"category": "novelty_seeking"}}',
'{"a": {"openness": 0.2, "novelty_seeking": 0.3}, "b": {"openness": -0.1, "comfort_seeking": 0.3}}',
7),

-- Question 8: Money
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather...',
'binary',
'[{"id": "a", "text": "Earn twice your salary but work 60+ hours a week"}, {"id": "b", "text": "Earn your current salary but work only 30 hours a week"}]',
'{"values": {"category": "money_vs_time"}, "lifestyle": {"category": "work_ethic"}}',
'{"a": {"money_priority": 0.4, "ambition": 0.3}, "b": {"time_priority": 0.4, "work_life_balance": 0.3}}',
8),

-- Question 9: Communication
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather your partner...',
'binary',
'[{"id": "a", "text": "Always tell you the complete truth, even when it hurts"}, {"id": "b", "text": "Sometimes soften the truth to spare your feelings"}]',
'{"relationship": {"category": "communication_preference"}, "values": {"category": "honesty"}}',
'{"a": {"directness_preference": 0.4, "honesty_priority": 0.3}, "b": {"sensitivity_preference": 0.3, "emotional_protection": 0.2}}',
9),

-- Question 10: Lifestyle
((SELECT id FROM games WHERE game_type = 'would_you_rather' LIMIT 1),
'Would you rather...',
'binary',
'[{"id": "a", "text": "Wake up at 5am and have the morning to yourself"}, {"id": "b", "text": "Stay up until 2am and have the night to yourself"}]',
'{"lifestyle": {"category": "chronotype"}, "personality": {"category": "energy_patterns"}}',
'{"a": {"chronotype": "morning", "early_riser": 0.4}, "b": {"chronotype": "night", "night_owl": 0.4}}',
10);

-- ============================================
-- THIS OR THAT
-- ============================================

-- Insert "This or That" game
INSERT INTO games (game_type, title, description, is_daily, extracts_values, extracts_personality, extracts_lifestyle, points_value, estimated_seconds)
VALUES ('this_or_that', 'This or That', 'Quick choices that reveal your preferences', TRUE, TRUE, TRUE, TRUE, 5, 30);

-- Sample questions
INSERT INTO game_questions (game_id, question_text, question_type, options, extraction_targets, scoring_logic, sequence_order) VALUES

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Beach vacation"}, {"id": "b", "text": "Mountain retreat"}]',
'{"lifestyle": {"category": "vacation_style"}, "interests": {"category": "outdoor_preference"}}',
'{"a": {"beach_lover": 0.3, "relaxation": 0.2}, "b": {"mountain_lover": 0.3, "adventure": 0.2}}',
1),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Big party"}, {"id": "b", "text": "Intimate dinner"}]',
'{"big_five": {"dimension": "extraversion"}, "lifestyle": {"category": "social_style"}}',
'{"a": {"extraversion": 0.3, "social_energy": 0.3}, "b": {"extraversion": -0.2, "intimacy_preference": 0.3}}',
2),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "City life"}, {"id": "b", "text": "Country living"}]',
'{"lifestyle": {"category": "environment_preference"}}',
'{"a": {"urban_preference": 0.4, "stimulation_need": 0.2}, "b": {"rural_preference": 0.4, "peace_need": 0.2}}',
3),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Dogs"}, {"id": "b", "text": "Cats"}]',
'{"lifestyle": {"category": "pet_preference"}, "personality": {"category": "caretaking_style"}}',
'{"a": {"dog_person": 0.4, "active_lifestyle": 0.1}, "b": {"cat_person": 0.4, "independent": 0.1}}',
4),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Cook at home"}, {"id": "b", "text": "Eat out"}]',
'{"lifestyle": {"category": "food_habits"}, "values": {"category": "home_oriented"}}',
'{"a": {"homebody": 0.2, "cooking_interest": 0.3}, "b": {"social_dining": 0.2, "convenience": 0.2}}',
5),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Plan everything"}, {"id": "b", "text": "Go with the flow"}]',
'{"big_five": {"dimension": "conscientiousness"}, "lifestyle": {"category": "planning_style"}}',
'{"a": {"conscientiousness": 0.3, "planner": 0.4}, "b": {"conscientiousness": -0.2, "spontaneous": 0.4}}',
6),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Text"}, {"id": "b", "text": "Call"}]',
'{"relationship": {"category": "communication_style"}}',
'{"a": {"written_preference": 0.3, "async_communication": 0.2}, "b": {"verbal_preference": 0.3, "real_time_communication": 0.2}}',
7),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Early bird"}, {"id": "b", "text": "Night owl"}]',
'{"lifestyle": {"category": "chronotype"}}',
'{"a": {"morning_person": 0.4}, "b": {"night_person": 0.4}}',
8),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Save money"}, {"id": "b", "text": "Spend on experiences"}]',
'{"values": {"category": "money_philosophy"}, "lifestyle": {"category": "financial_style"}}',
'{"a": {"saver": 0.4, "security_oriented": 0.2}, "b": {"spender": 0.3, "experience_oriented": 0.3}}',
9),

((SELECT id FROM games WHERE game_type = 'this_or_that' LIMIT 1),
'Pick one:',
'binary',
'[{"id": "a", "text": "Few close friends"}, {"id": "b", "text": "Large social circle"}]',
'{"big_five": {"dimension": "extraversion"}, "relationship": {"category": "friendship_style"}}',
'{"a": {"intimacy_preference": 0.3, "depth_over_breadth": 0.3}, "b": {"extraversion": 0.3, "breadth_over_depth": 0.3}}',
10);

-- ============================================
-- RED FLAG GREEN FLAG
-- ============================================

-- Insert "Red Flag Green Flag" game
INSERT INTO games (game_type, title, description, is_daily, extracts_values, extracts_dealbreakers, points_value)
VALUES ('red_flag_green_flag', 'Red Flag or Green Flag?', 'Judge these dating scenarios', TRUE, TRUE, TRUE, 10);

-- Sample scenarios
INSERT INTO game_questions (game_id, question_text, question_type, options, extraction_targets, scoring_logic, sequence_order) VALUES

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They text you "good morning" every single day',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"attachment": {"indicator": "contact_frequency"}, "relationship": {"category": "communication_needs"}}',
'{"green": {"high_contact_preference": 0.3, "attachment_anxious": 0.1}, "red": {"independence_need": 0.3, "attachment_avoidant": 0.1}}',
1),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They are still close friends with their ex',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"values": {"category": "trust"}, "relationship": {"category": "boundaries"}}',
'{"green": {"secure_attachment": 0.2, "trust_capacity": 0.3}, "red": {"jealousy_tendency": 0.2, "boundary_strictness": 0.3}}',
2),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They want to meet your family after one month of dating',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"attachment": {"indicator": "pace_preference"}, "values": {"category": "family_importance"}}',
'{"green": {"fast_pace_preference": 0.2, "family_oriented": 0.2}, "red": {"slow_pace_preference": 0.3, "cautious": 0.2}}',
3),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They prefer staying in over going out most weekends',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"lifestyle": {"category": "social_energy"}, "big_five": {"dimension": "extraversion"}}',
'{"green": {"homebody_compatible": 0.3, "introvert_friendly": 0.2}, "red": {"social_need": 0.3, "extravert_preference": 0.2}}',
4),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They split the bill on the first date',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"values": {"category": "gender_roles"}, "relationship": {"category": "financial_expectations"}}',
'{"green": {"egalitarian": 0.3, "modern_values": 0.2}, "red": {"traditional_values": 0.3, "chivalry_expectation": 0.2}}',
5),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They have a very close relationship with their mother',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"values": {"category": "family_dynamics"}, "relationship": {"category": "boundaries"}}',
'{"green": {"family_values": 0.3, "healthy_attachment": 0.2}, "red": {"independence_priority": 0.2, "boundary_concern": 0.2}}',
6),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They don''t have social media',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"lifestyle": {"category": "digital_presence"}, "values": {"category": "privacy"}}',
'{"green": {"privacy_values": 0.3, "anti_social_media": 0.2}, "red": {"transparency_need": 0.2, "social_proof_need": 0.2}}',
7),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They cry during emotional movies',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"values": {"category": "emotional_expression"}, "relationship": {"category": "vulnerability"}}',
'{"green": {"emotional_openness": 0.3, "vulnerability_positive": 0.3}, "red": {"stoicism_preference": 0.2, "emotional_control": 0.2}}',
8),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They check their phone frequently during dinner',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"values": {"category": "presence"}, "dealbreakers": {"category": "attention"}}',
'{"green": {"tech_tolerant": 0.2, "flexible": 0.1}, "red": {"presence_priority": 0.4, "attention_need": 0.3}}',
9),

((SELECT id FROM games WHERE game_type = 'red_flag_green_flag' LIMIT 1),
'They have a five-year plan for their life',
'binary',
'[{"id": "green", "text": "Green Flag 💚"}, {"id": "red", "text": "Red Flag 🚩"}]',
'{"big_five": {"dimension": "conscientiousness"}, "lifestyle": {"category": "planning_orientation"}}',
'{"green": {"planner_compatible": 0.3, "ambition_positive": 0.2}, "red": {"spontaneity_preference": 0.3, "flexibility_need": 0.2}}',
10);
