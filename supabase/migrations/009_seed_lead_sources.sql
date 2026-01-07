-- =====================================================
-- SEED LEAD SOURCES & EMAIL SEQUENCES
-- =====================================================

-- Clean up existing data to avoid duplicates
DELETE FROM sequence_emails WHERE sequence_id IN (SELECT id FROM outreach_sequences WHERE name IN ('High Intent Singles', 'Dating App Frustrated'));
DELETE FROM outreach_sequences WHERE name IN ('High Intent Singles', 'Dating App Frustrated');
DELETE FROM lead_sources WHERE source_type = 'reddit' AND source_name IN ('r/dating', 'r/datingoverthirty', 'r/datingoverforty', 'r/OnlineDating', 'r/singles');

-- Insert default lead sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency) VALUES

-- Reddit - Dating subreddits
('reddit', 'r/dating', 'https://reddit.com/r/dating', '{
    "subreddit": "dating",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["looking for", "want to find", "seeking", "single", "dating advice", "how do I meet"],
    "exclude_keywords": ["hookup", "casual", "fwb", "ons"],
    "min_karma": 50,
    "min_account_age_days": 30
}'::jsonb, 'daily'),

('reddit', 'r/datingoverthirty', 'https://reddit.com/r/datingoverthirty', '{
    "subreddit": "datingoverthirty",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["looking for", "want to find", "serious relationship", "ready for", "tired of apps"],
    "exclude_keywords": ["hookup", "casual"],
    "min_karma": 100,
    "min_account_age_days": 30
}'::jsonb, 'daily'),

('reddit', 'r/datingoverforty', 'https://reddit.com/r/datingoverforty', '{
    "subreddit": "datingoverforty",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["looking for", "want to find", "serious", "relationship", "partner"],
    "min_karma": 50
}'::jsonb, 'daily'),

('reddit', 'r/OnlineDating', 'https://reddit.com/r/OnlineDating', '{
    "subreddit": "OnlineDating",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["tired of", "frustrated", "giving up", "better way", "hate apps", "waste of time"],
    "min_karma": 50
}'::jsonb, 'daily'),

('reddit', 'r/singles', 'https://reddit.com/r/singles', '{
    "subreddit": "singles",
    "sort": "new",
    "time_filter": "day",
    "keywords": ["looking", "seeking", "want to meet"],
    "min_karma": 25
}'::jsonb, 'daily');

-- =====================================================
-- EMAIL SEQUENCES
-- =====================================================

-- High Intent Singles Sequence
INSERT INTO outreach_sequences (name, description, target_fit_score_min, total_emails) VALUES
('High Intent Singles', 'For leads showing serious relationship intent from Reddit dating subs', 70, 4);

-- Email 1 - Immediate
INSERT INTO sequence_emails (sequence_id, step_number, delay_days, subject_line, body_html, body_text) VALUES
((SELECT id FROM outreach_sequences WHERE name = 'High Intent Singles' LIMIT 1),
1, 0,
'A different approach to finding love',
'<p>Hi {{first_name}},</p>

<p>I came across your post about looking for a serious relationship, and I wanted to reach out personally.</p>

<p>I''m part of a team building something different - <strong>IntroAlignment</strong>. We''re not another dating app with endless swiping. Instead, we use deep conversation and validated psychology to understand who you really are, then introduce you only to people who could genuinely be right for you.</p>

<p>The idea is simple: instead of you searching through thousands of profiles, we do the work to find someone actually aligned with your life and values.</p>

<p>We''re launching soon with a small founding group. I thought you might be interested based on what you shared.</p>

<p>Would you like to learn more?</p>

<p>Best,<br>
The IntroAlignment Team</p>

<p style="font-size: 12px; color: #666;">P.S. No pressure at all. Just thought this might resonate with what you''re looking for.</p>',
'Hi {{first_name}},

I came across your post about looking for a serious relationship, and I wanted to reach out personally.

I''m part of a team building something different - IntroAlignment. We''re not another dating app with endless swiping. Instead, we use deep conversation and validated psychology to understand who you really are, then introduce you only to people who could genuinely be right for you.

The idea is simple: instead of you searching through thousands of profiles, we do the work to find someone actually aligned with your life and values.

We''re launching soon with a small founding group. I thought you might be interested based on what you shared.

Would you like to learn more?

Best,
The IntroAlignment Team

P.S. No pressure at all. Just thought this might resonate with what you''re looking for.');

-- Email 2 - 3 days later
INSERT INTO sequence_emails (sequence_id, step_number, delay_days, subject_line, body_html, body_text) VALUES
((SELECT id FROM outreach_sequences WHERE name = 'High Intent Singles' LIMIT 1),
2, 3,
'The problem with dating apps (and what we''re doing differently)',
'<p>Hi {{first_name}},</p>

<p>I wanted to follow up with a bit more about why we built IntroAlignment.</p>

<p>Here''s the thing: dating apps are designed to keep you swiping. Their business model depends on you <em>not</em> finding someone. The more frustrated you are, the more you use the app.</p>

<p>We''re building the opposite. Our success is measured by people finding real, lasting partnerships - and then not needing us anymore.</p>

<p><strong>How it works:</strong></p>
<ul>
<li>You have a conversation with our AI (like talking to a friend, not filling out forms)</li>
<li>We build a deep understanding of who you are - values, personality, life vision</li>
<li>We only introduce you to people with genuine potential for alignment</li>
<li>No swiping. No endless browsing. Just thoughtful introductions.</li>
</ul>

<p>We''re accepting founding members now. Interested in joining?</p>

<p>Just reply to this email and I''ll send you the link.</p>

<p>Best,<br>
The IntroAlignment Team</p>',
'Hi {{first_name}},

I wanted to follow up with a bit more about why we built IntroAlignment.

Here''s the thing: dating apps are designed to keep you swiping. Their business model depends on you not finding someone. The more frustrated you are, the more you use the app.

We''re building the opposite. Our success is measured by people finding real, lasting partnerships - and then not needing us anymore.

How it works:
- You have a conversation with our AI (like talking to a friend, not filling out forms)
- We build a deep understanding of who you are - values, personality, life vision
- We only introduce you to people with genuine potential for alignment
- No swiping. No endless browsing. Just thoughtful introductions.

We''re accepting founding members now. Interested in joining?

Just reply to this email and I''ll send you the link.

Best,
The IntroAlignment Team');

-- Email 3 - 7 days later
INSERT INTO sequence_emails (sequence_id, step_number, delay_days, subject_line, body_html, body_text) VALUES
((SELECT id FROM outreach_sequences WHERE name = 'High Intent Singles' LIMIT 1),
3, 7,
'Quick question',
'<p>Hi {{first_name}},</p>

<p>I''m curious - what would a service need to offer for you to actually trust it to help you find a partner?</p>

<p>We''re still in early stages with IntroAlignment, and understanding what people actually need is really valuable.</p>

<p>No pitch this time - just genuinely interested in your perspective if you have a moment.</p>

<p>Thanks,<br>
The IntroAlignment Team</p>',
'Hi {{first_name}},

I''m curious - what would a service need to offer for you to actually trust it to help you find a partner?

We''re still in early stages with IntroAlignment, and understanding what people actually need is really valuable.

No pitch this time - just genuinely interested in your perspective if you have a moment.

Thanks,
The IntroAlignment Team');

-- Email 4 - 14 days later (final)
INSERT INTO sequence_emails (sequence_id, step_number, delay_days, subject_line, body_html, body_text) VALUES
((SELECT id FROM outreach_sequences WHERE name = 'High Intent Singles' LIMIT 1),
4, 14,
'Last note from me',
'<p>Hi {{first_name}},</p>

<p>This will be my last email - I don''t want to be a bother.</p>

<p>If IntroAlignment isn''t for you, that''s completely okay. Dating is personal, and everyone has their own path.</p>

<p>But if you ever want to try something different than the typical app experience, we''ll be here: <a href="https://introalignment.com">introalignment.com</a></p>

<p>Wishing you the best in finding what you''re looking for.</p>

<p>Take care,<br>
The IntroAlignment Team</p>',
'Hi {{first_name}},

This will be my last email - I don''t want to be a bother.

If IntroAlignment isn''t for you, that''s completely okay. Dating is personal, and everyone has their own path.

But if you ever want to try something different than the typical app experience, we''ll be here: introalignment.com

Wishing you the best in finding what you''re looking for.

Take care,
The IntroAlignment Team');

-- Dating App Frustrated Sequence
INSERT INTO outreach_sequences (name, description, target_fit_score_min, total_emails) VALUES
('Dating App Frustrated', 'For leads expressing frustration with existing apps', 50, 3);

-- Email 1
INSERT INTO sequence_emails (sequence_id, step_number, delay_days, subject_line, body_html, body_text) VALUES
((SELECT id FROM outreach_sequences WHERE name = 'Dating App Frustrated' LIMIT 1),
1, 0,
'I get it - apps are exhausting',
'<p>Hi {{first_name}},</p>

<p>I saw your post about dating apps, and I completely understand the frustration.</p>

<p>Swiping endlessly. Conversations that go nowhere. The same disappointing experiences over and over.</p>

<p>We''re building IntroAlignment because we believe there has to be a better way.</p>

<p>Instead of showing you thousands of profiles, we have a real conversation with you to understand who you are. Then we do the work of finding people who actually make sense for your life.</p>

<p>No swiping. No ghosting epidemic. Just thoughtful introductions to people with real potential.</p>

<p>We''re launching soon. If you''re interested in trying something genuinely different, I''d love to tell you more.</p>

<p>Best,<br>
The IntroAlignment Team</p>',
'Hi {{first_name}},

I saw your post about dating apps, and I completely understand the frustration.

Swiping endlessly. Conversations that go nowhere. The same disappointing experiences over and over.

We''re building IntroAlignment because we believe there has to be a better way.

Instead of showing you thousands of profiles, we have a real conversation with you to understand who you are. Then we do the work of finding people who actually make sense for your life.

No swiping. No ghosting epidemic. Just thoughtful introductions to people with real potential.

We''re launching soon. If you''re interested in trying something genuinely different, I''d love to tell you more.

Best,
The IntroAlignment Team');

-- Verify seeds
SELECT 'Lead sources seeded:' as status, COUNT(*) as count FROM lead_sources;
SELECT 'Sequences seeded:' as status, COUNT(*) as count FROM outreach_sequences;
SELECT 'Sequence emails seeded:' as status, COUNT(*) as count FROM sequence_emails;
