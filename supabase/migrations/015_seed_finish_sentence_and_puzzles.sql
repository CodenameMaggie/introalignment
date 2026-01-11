-- SovereigntyIntroAlignment Game Components
-- Migration 016: Seed Finish the Sentence & Daily Puzzles

-- ============================================
-- FINISH THE SENTENCE
-- ============================================

-- Insert "Finish the Sentence" game
INSERT INTO games (game_type, title, description, is_daily, extracts_values, extracts_personality, extracts_attachment, extracts_lifestyle, points_value, estimated_seconds)
VALUES ('finish_sentence', 'Finish the Sentence', 'Complete these prompts to reveal your values', TRUE, TRUE, TRUE, TRUE, TRUE, 15, 120);

-- Sample prompts
INSERT INTO game_questions (game_id, question_text, question_type, options, extraction_targets, scoring_logic, sequence_order) VALUES

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'The most important thing in a relationship is...',
'open_ended',
'[]',
'{"values": {"category": "relationship_priorities"}, "relationship": {"category": "core_needs"}, "communication": {"category": "expression_style"}}',
'{}',
1),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'I feel most loved when...',
'open_ended',
'[]',
'{"attachment": {"indicator": "love_language"}, "relationship": {"category": "affection_needs"}, "values": {"category": "emotional_needs"}}',
'{}',
2),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'My ideal weekend looks like...',
'open_ended',
'[]',
'{"lifestyle": {"category": "leisure_preferences"}, "big_five": {"dimension": "extraversion"}, "interests": {"category": "activities"}}',
'{}',
3),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'I couldn''t be with someone who...',
'open_ended',
'[]',
'{"dealbreakers": {"category": "hard_boundaries"}, "values": {"category": "non_negotiables"}, "relationship": {"category": "compatibility_factors"}}',
'{}',
4),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'In five years, I see myself...',
'open_ended',
'[]',
'{"values": {"category": "life_goals"}, "lifestyle": {"category": "future_vision"}, "ambition": {"category": "aspirations"}}',
'{}',
5),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'The quality I value most in a partner is...',
'open_ended',
'[]',
'{"values": {"category": "partner_qualities"}, "relationship": {"category": "attraction_factors"}, "priorities": {"category": "partner_selection"}}',
'{}',
6),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'I feel most alive when...',
'open_ended',
'[]',
'{"values": {"category": "passion_triggers"}, "big_five": {"dimension": "openness"}, "lifestyle": {"category": "fulfillment_sources"}}',
'{}',
7),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'My biggest fear in relationships is...',
'open_ended',
'[]',
'{"attachment": {"indicator": "fear_pattern"}, "relationship": {"category": "vulnerability"}, "values": {"category": "relationship_anxiety"}}',
'{}',
8),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'Home means...',
'open_ended',
'[]',
'{"values": {"category": "home_philosophy"}, "lifestyle": {"category": "living_preferences"}, "attachment": {"indicator": "security_base"}}',
'{}',
9),

((SELECT id FROM games WHERE game_type = 'finish_sentence' LIMIT 1),
'Success to me is...',
'open_ended',
'[]',
'{"values": {"category": "success_definition"}, "lifestyle": {"category": "life_priorities"}, "ambition": {"category": "achievement_orientation"}}',
'{}',
10);

-- ============================================
-- DAILY PUZZLES
-- ============================================

-- Puzzle 1: The Dinner Party (Scenario - Values & Priorities)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_values, measures_personality, measures_persistence,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Dinner Party',
    '{
        "scenario": "You''re hosting a dinner party with seating for only 3 guests, but 4 people want to attend: your best friend who''s always there for you, your boss who could help your career, your elderly neighbor who''s often lonely, and your ex who wants to reconnect and apologize. Who do you leave out and why?",
        "question": "Who do you leave out and why?"
    }',
    '{
        "analysis_points": [
            "Best friend: loyalty, relationship maintenance",
            "Boss: career ambition, pragmatism",
            "Neighbor: compassion, community values",
            "Ex: closure, forgiveness, emotional work"
        ],
        "scoring": "Open-ended analysis based on reasoning and values expressed"
    }',
    2,
    TRUE, TRUE, FALSE,
    20, 300
);

-- Puzzle 2: The Job Offer (Logic - Decision Making Style)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_logic, measures_values, measures_personality,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Job Offer',
    '{
        "scenario": "You receive two job offers: Job A pays 30% more but requires 60-hour weeks and frequent travel. Job B pays less but offers work-life balance, flexible hours, and is close to family. Your partner is supportive either way. What factors would influence your decision?",
        "question": "What factors would influence your decision most?"
    }',
    '{
        "analysis_points": [
            "Money vs time trade-off",
            "Career ambition vs life balance",
            "Family proximity importance",
            "Partner consideration in decision",
            "Long-term vs short-term thinking"
        ]
    }',
    2,
    TRUE, TRUE, TRUE,
    20, 300
);

-- Puzzle 3: The Trust Test (Scenario - Relationship Values)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_values, measures_personality,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Trust Test',
    '{
        "scenario": "Your partner went out with friends last night. You wake up to see a notification on their unlocked phone from someone you don''t recognize saying ''Last night was fun, we should do it again.'' Your partner is still asleep. What do you do?",
        "question": "What do you do and why?"
    }',
    '{
        "analysis_points": [
            "Immediate reaction: trust vs suspicion",
            "Communication approach: direct vs avoidant",
            "Boundary respect: reading messages vs waiting",
            "Emotional regulation: calm vs reactive",
            "Trust baseline in relationship"
        ]
    }',
    3,
    TRUE, TRUE,
    25, 300
);

-- Puzzle 4: The Inheritance (Values - Money & Family)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_values, measures_logic,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Inheritance',
    '{
        "scenario": "You receive an unexpected $50,000 inheritance. Your sibling desperately needs $20,000 to avoid foreclosure. Your partner wants to use it for a down payment on your dream home. You''ve always wanted to take a year off to travel. What do you do?",
        "question": "How do you allocate the money and why?"
    }',
    '{
        "analysis_points": [
            "Family loyalty vs personal goals",
            "Generosity vs self-interest",
            "Partnership consideration",
            "Risk tolerance (travel vs stability)",
            "Value hierarchy"
        ]
    }',
    2,
    TRUE, TRUE,
    20, 300
);

-- Puzzle 5: The Pattern (Logic - Analytical Thinking)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_logic, measures_pattern_recognition,
    points_value, time_limit_seconds
) VALUES (
    'logic',
    'The Pattern',
    '{
        "sequence": "2, 6, 12, 20, 30, ?",
        "question": "What number comes next and what is the pattern?"
    }',
    '{
        "answer": 42,
        "pattern": "Adding consecutive even numbers: +4, +6, +8, +10, +12",
        "explanation": "2+4=6, 6+6=12, 12+8=20, 20+10=30, 30+12=42"
    }',
    3,
    TRUE, TRUE,
    25, 180
);

-- Puzzle 6: The Social Dilemma (Scenario - Social Dynamics)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_personality, measures_values,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Social Dilemma',
    '{
        "scenario": "You''re at a party where you don''t know anyone except the friend who invited you. They get called away for a work emergency and leave you alone. The party will go on for 3 more hours. What do you do?",
        "question": "Describe your most likely course of action."
    }',
    '{
        "analysis_points": [
            "Extraversion vs introversion response",
            "Social confidence and initiative",
            "Comfort with strangers",
            "Independence vs reliance on friend",
            "Flexibility vs preference for exit"
        ]
    }',
    2,
    TRUE, TRUE,
    20, 240
);

-- Puzzle 7: The Ethical Choice (Values - Moral Reasoning)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_values, measures_personality,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Ethical Choice',
    '{
        "scenario": "You find a wallet with $500 cash and an ID showing the person lives across town in an expensive neighborhood. There''s no one around. Returning it would take 2 hours round trip. You''re struggling financially this month. What do you do?",
        "question": "What do you do and what factors influence your decision?"
    }',
    '{
        "analysis_points": [
            "Honesty vs financial need",
            "Empathy consideration",
            "Effort vs obligation",
            "Wealth of victim in calculation",
            "Self-interest vs moral code"
        ]
    }',
    2,
    TRUE, TRUE,
    20, 300
);

-- Puzzle 8: The Time Machine (Logic - Priorities)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_values, measures_personality, measures_logic,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Time Machine',
    '{
        "scenario": "You can send one 10-word message to yourself 10 years ago. You can''t include specific events or lottery numbers. What do you say?",
        "question": "What is your 10-word message?"
    }',
    '{
        "analysis_points": [
            "Regret vs gratitude focus",
            "Relationship vs career vs personal advice",
            "Specific vs general guidance",
            "Emotional tone",
            "Value priorities revealed"
        ]
    }',
    3,
    TRUE, TRUE, TRUE,
    25, 300
);

-- Puzzle 9: The Roommate Test (Social - Boundaries)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_personality, measures_values,
    points_value, time_limit_seconds
) VALUES (
    'scenario',
    'The Roommate Test',
    '{
        "scenario": "Your roommate''s significant other has been staying over every night for a month without contributing to rent or household chores. Your roommate seems happy. You''re annoyed but don''t want to cause conflict. What do you do?",
        "question": "How do you handle this situation?"
    }',
    '{
        "analysis_points": [
            "Conflict avoidance vs assertion",
            "Boundary setting comfort",
            "Direct vs indirect communication",
            "Friendship vs self-advocacy",
            "Problem-solving approach"
        ]
    }',
    2,
    TRUE, TRUE,
    20, 300
);

-- Puzzle 10: The Grid (Logic - Spatial Reasoning)
INSERT INTO puzzles (
    puzzle_type, title, puzzle_data, solution, difficulty_level,
    measures_logic, measures_pattern_recognition,
    points_value, time_limit_seconds
) VALUES (
    'logic',
    'The Grid',
    '{
        "problem": "You have a 3x3 grid. You must place the numbers 1-9 so that each row, column, and diagonal adds to 15. The center must be 5. What number must go in the top-left corner?",
        "hint": "Think about which numbers can pair with 5 to create different sums."
    }',
    '{
        "answer": "2, 4, 6, or 8 (any even number works in corners)",
        "explanation": "In a magic square with center 5, corners must be even numbers to allow rows/columns/diagonals to sum to 15",
        "full_solution": "Common solution: 2,7,6 / 9,5,1 / 4,3,8"
    }',
    4,
    TRUE, TRUE,
    30, 240
);
