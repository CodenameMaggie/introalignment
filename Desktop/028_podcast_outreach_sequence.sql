-- =====================================================
-- PODCAST GUEST OUTREACH SEQUENCE
-- =====================================================
-- Creates automated email sequence for podcast invitations
-- Runs via /api/cron/podcast-outreach every 10 minutes
-- Partners auto-enrolled on CSV import

-- =====================================================
-- 1. CREATE PODCAST OUTREACH SEQUENCE
-- =====================================================

INSERT INTO outreach_sequences (
    id,
    name,
    description,
    sequence_type,
    target_audience,
    target_fit_score_min,
    is_active,
    created_at
) VALUES (
    gen_random_uuid(),
    'Podcast Guest Invitation - Estate Planning Attorneys',
    'Automated outreach to high-quality estate planning attorneys for sovereigndesign.it.com podcast. Targets practice owners with 12+ fit score (business builder + expertise).',
    'podcast_invitation',
    'Estate planning attorneys, practice owners, multi-state specialists, dynasty trust experts',
    12, -- Minimum fit score (business_builder + expertise >= 12)
    true,
    NOW()
) RETURNING id;

-- NOTE: Save the returned UUID to use in the next INSERT
-- Or run this query to get the sequence ID:
-- SELECT id FROM outreach_sequences WHERE sequence_type = 'podcast_invitation' ORDER BY created_at DESC LIMIT 1;

-- =====================================================
-- 2. CREATE SEQUENCE EMAILS (3-STEP SEQUENCE)
-- =====================================================

-- Step 1: Initial Podcast Invitation (send immediately)
INSERT INTO sequence_emails (
    sequence_id,
    step_number,
    email_type,
    delay_days,
    subject_line,
    body_html,
    body_text,
    is_active,
    created_at
) VALUES (
    (SELECT id FROM outreach_sequences WHERE sequence_type = 'podcast_invitation' ORDER BY created_at DESC LIMIT 1),
    1,
    'initial',
    0, -- Send immediately after enrollment
    'Podcast Invitation: Share Your Expertise on sovereigndesign.it.com',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Georgia, serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B7355 0%, #C9A97E 100%); padding: 30px; text-align: center; }
        .podcast-badge { background: #F5F0E8; border-left: 4px solid #C9A97E; padding: 20px; margin: 20px 0; }
        .benefits { margin: 20px 0; }
        .cta { text-align: center; margin: 30px 0; }
        .cta a { background: #C9A97E; color: #2C2C2C; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #F5F0E8; margin: 0; font-size: 28px;">IntroAlignment</h1>
            <p style="color: #F5F0E8; margin: 10px 0 0 0;">Legal Architecture for Sovereign Living</p>
        </div>

        <div style="padding: 30px 20px;">
            <p>Dear Attorney,</p>

            <p>I hope this message finds you well. I'm reaching out to invite you to be a featured guest on <strong>sovereigndesign.it.com</strong>, our podcast dedicated to advanced estate planning, asset protection, and wealth preservation strategies.</p>

            <div class="podcast-badge">
                <h3 style="margin-top: 0; color: #8B7355;">🎙️ sovereigndesign.it.com</h3>
                <p style="margin-bottom: 0;">Where top estate planning attorneys share their expertise with high-net-worth clients actively seeking sophisticated legal counsel.</p>
            </div>

            <div class="benefits">
                <p><strong>What You'll Gain:</strong></p>
                <ul>
                    <li><strong>Exposure:</strong> Reach high-net-worth clients actively seeking estate planning counsel</li>
                    <li><strong>Authority:</strong> Establish yourself as a thought leader in wealth preservation</li>
                    <li><strong>Networking:</strong> Connect with other top-tier legal professionals</li>
                    <li><strong>Flexibility:</strong> 45-60 minute Zoom recordings on Wednesdays</li>
                </ul>
            </div>

            <p><strong>Typical Topics:</strong></p>
            <ul>
                <li>Dynasty trust structures and generational wealth transfer</li>
                <li>Asset protection strategies for high-net-worth families</li>
                <li>Cross-border estate planning and international tax</li>
                <li>Advanced tax optimization techniques</li>
                <li>Family office legal considerations</li>
                <li>Multi-state practice management and business building</li>
            </ul>

            <p>Your expertise in estate planning would be invaluable to our audience, and I'd be honored to feature your insights.</p>

            <div class="cta">
                <a href="https://calendly.com/maggieforbesstrategies/podcast-guest-interview" target="_blank">Schedule Your Recording Session</a>
            </div>

            <p>Looking forward to connecting with you and sharing your expertise with our community.</p>

            <p>Best regards,<br>
            <strong>Maggie Forbes</strong><br>
            IntroAlignment<br>
            <a href="mailto:maggie@maggieforbesstrategies.com">maggie@maggieforbesstrategies.com</a></p>

            <div class="footer">
                <p>This invitation was sent because you match our criteria for podcast guests: experienced estate planning attorneys who have built successful practices.</p>
                <p><a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a> | <a href="https://introalignment.com" style="color: #666;">IntroAlignment.com</a></p>
                <p>IntroAlignment | Legal Services Network</p>
            </div>
        </div>
    </div>
</body>
</html>',
    'Dear Attorney,

I hope this message finds you well. I'm reaching out to invite you to be a featured guest on sovereigndesign.it.com, our podcast dedicated to advanced estate planning, asset protection, and wealth preservation strategies.

🎙️ sovereigndesign.it.com
Where top estate planning attorneys share their expertise with high-net-worth clients actively seeking sophisticated legal counsel.

WHAT YOU''LL GAIN:
- Exposure: Reach high-net-worth clients actively seeking estate planning counsel
- Authority: Establish yourself as a thought leader in wealth preservation
- Networking: Connect with other top-tier legal professionals
- Flexibility: 45-60 minute Zoom recordings on Wednesdays

TYPICAL TOPICS:
- Dynasty trust structures and generational wealth transfer
- Asset protection strategies for high-net-worth families
- Cross-border estate planning and international tax
- Advanced tax optimization techniques
- Family office legal considerations
- Multi-state practice management and business building

Your expertise in estate planning would be invaluable to our audience, and I'd be honored to feature your insights.

SCHEDULE YOUR RECORDING SESSION:
https://calendly.com/maggieforbesstrategies/podcast-guest-interview

Looking forward to connecting with you and sharing your expertise with our community.

Best regards,
Maggie Forbes
IntroAlignment
maggie@maggieforbesstrategies.com

---
This invitation was sent because you match our criteria for podcast guests: experienced estate planning attorneys who have built successful practices.

Unsubscribe: {{unsubscribe_url}}
IntroAlignment.com',
    true,
    NOW()
);

-- Step 2: Follow-up (7 days after initial)
INSERT INTO sequence_emails (
    sequence_id,
    step_number,
    email_type,
    delay_days,
    subject_line,
    body_html,
    body_text,
    is_active,
    created_at
) VALUES (
    (SELECT id FROM outreach_sequences WHERE sequence_type = 'podcast_invitation' ORDER BY created_at DESC LIMIT 1),
    2,
    'follow_up',
    7, -- 7 days after initial invitation
    'Following up: Podcast Guest Invitation',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Georgia, serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <p>Hello,</p>

        <p>I wanted to follow up on my invitation to join us on the <strong>sovereigndesign.it.com</strong> podcast.</p>

        <p>I understand you're busy managing your practice, so I wanted to make this as easy as possible:</p>

        <ul>
            <li><strong>Recording:</strong> 45-60 minutes via Zoom</li>
            <li><strong>Schedule:</strong> Wednesday sessions (flexible times)</li>
            <li><strong>Preparation:</strong> No formal preparation needed - we'll have a natural conversation about your expertise</li>
        </ul>

        <p>Our audience includes high-net-worth individuals, family offices, and fellow legal professionals who value advanced estate planning strategies.</p>

        <p>If you're interested, you can schedule a time that works for you here:<br>
        <a href="https://calendly.com/maggieforbesstrategies/podcast-guest-interview">https://calendly.com/maggieforbesstrategies/podcast-guest-interview</a></p>

        <p>If the timing isn't right, no problem at all - feel free to reach out when your schedule opens up.</p>

        <p>Best regards,<br>
        <strong>Maggie Forbes</strong><br>
        IntroAlignment<br>
        <a href="mailto:maggie@maggieforbesstrategies.com">maggie@maggieforbesstrategies.com</a></p>

        <div class="footer">
            <p><a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a> | <a href="https://introalignment.com" style="color: #666;">IntroAlignment.com</a></p>
        </div>
    </div>
</body>
</html>',
    'Hello,

I wanted to follow up on my invitation to join us on the sovereigndesign.it.com podcast.

I understand you're busy managing your practice, so I wanted to make this as easy as possible:

- Recording: 45-60 minutes via Zoom
- Schedule: Wednesday sessions (flexible times)
- Preparation: No formal preparation needed - we'll have a natural conversation about your expertise

Our audience includes high-net-worth individuals, family offices, and fellow legal professionals who value advanced estate planning strategies.

If you're interested, schedule a time here:
https://calendly.com/maggieforbesstrategies/podcast-guest-interview

If the timing isn't right, no problem at all - feel free to reach out when your schedule opens up.

Best regards,
Maggie Forbes
IntroAlignment
maggie@maggieforbesstrategies.com

---
Unsubscribe: {{unsubscribe_url}}',
    true,
    NOW()
);

-- Step 3: Final Follow-up (14 days after initial)
INSERT INTO sequence_emails (
    sequence_id,
    step_number,
    email_type,
    delay_days,
    subject_line,
    body_html,
    body_text,
    is_active,
    created_at
) VALUES (
    (SELECT id FROM outreach_sequences WHERE sequence_type = 'podcast_invitation' ORDER BY created_at DESC LIMIT 1),
    3,
    'final_follow_up',
    14, -- 14 days after initial invitation (7 days after first follow-up)
    'Last call: Podcast Guest Opportunity',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Georgia, serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <p>Hello,</p>

        <p>This will be my last follow-up regarding the podcast guest opportunity.</p>

        <p>I don't want to clutter your inbox, but I did want to give you one more chance to join us on <strong>sovereigndesign.it.com</strong>.</p>

        <p><strong>Quick reminder:</strong> This is an opportunity to share your expertise with high-net-worth clients and establish your authority in estate planning and asset protection.</p>

        <p>If you're interested, the door is still open:<br>
        <a href="https://calendly.com/maggieforbesstrategies/podcast-guest-interview">Schedule Your Session</a></p>

        <p>If now isn't the right time, I completely understand. Feel free to reach out in the future if you'd like to participate.</p>

        <p>Wishing you continued success,<br>
        <strong>Maggie Forbes</strong><br>
        IntroAlignment<br>
        <a href="mailto:maggie@maggieforbesstrategies.com">maggie@maggieforbesstrategies.com</a></p>

        <div class="footer">
            <p><a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a> | <a href="https://introalignment.com" style="color: #666;">IntroAlignment.com</a></p>
        </div>
    </div>
</body>
</html>',
    'Hello,

This will be my last follow-up regarding the podcast guest opportunity.

I don't want to clutter your inbox, but I did want to give you one more chance to join us on sovereigndesign.it.com.

QUICK REMINDER: This is an opportunity to share your expertise with high-net-worth clients and establish your authority in estate planning and asset protection.

If you're interested, the door is still open:
https://calendly.com/maggieforbesstrategies/podcast-guest-interview

If now isn't the right time, I completely understand. Feel free to reach out in the future if you'd like to participate.

Wishing you continued success,
Maggie Forbes
IntroAlignment
maggie@maggieforbesstrategies.com

---
Unsubscribe: {{unsubscribe_url}}',
    true,
    NOW()
);

-- =====================================================
-- 3. VERIFY SEQUENCE CREATED
-- =====================================================

SELECT
    s.id,
    s.name,
    s.sequence_type,
    s.target_fit_score_min,
    s.is_active,
    COUNT(e.id) as email_steps
FROM outreach_sequences s
LEFT JOIN sequence_emails e ON e.sequence_id = s.id
WHERE s.sequence_type = 'podcast_invitation'
GROUP BY s.id, s.name, s.sequence_type, s.target_fit_score_min, s.is_active;

-- Expected result: 1 sequence with 3 email steps

-- =====================================================
-- 4. VIEW SEQUENCE TIMELINE
-- =====================================================

SELECT
    step_number,
    email_type,
    delay_days,
    CASE
        WHEN delay_days = 0 THEN 'Day 0 (Immediate)'
        WHEN delay_days = 7 THEN 'Day 7 (1 week later)'
        WHEN delay_days = 14 THEN 'Day 14 (2 weeks later, final)'
        ELSE 'Day ' || delay_days
    END as timeline,
    subject_line,
    is_active
FROM sequence_emails
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE sequence_type = 'podcast_invitation' ORDER BY created_at DESC LIMIT 1)
ORDER BY step_number;

-- =====================================================
-- SEQUENCE SUMMARY
-- =====================================================

/*
PODCAST GUEST OUTREACH SEQUENCE - 3-STEP CAMPAIGN

TIMELINE:
- Day 0:  Initial podcast invitation (immediate after CSV import)
- Day 7:  First follow-up (if no response)
- Day 14: Final follow-up (if no response)

AUTO-ENROLLMENT CRITERIA:
- Fit score >= 12 (business_builder + expertise)
- Has valid email address
- Not unsubscribed
- podcast_status = 'not_contacted' OR null

AUTOMATED WORKFLOW:
1. Upload CSV → Partners imported
2. Auto-enroll in podcast sequence (fit_score >= 12)
3. Cron job runs every 10 minutes
4. Emails sent automatically based on schedule
5. Status updates: not_contacted → queued → contacted

MONITORING:
- Visit: /api/cron/podcast-outreach (GET)
- Shows: emails_sent, partners_enrolled, stats

ENABLE/DISABLE:
- Set PODCAST_OUTREACH_ENABLED=true in environment variables
- Default: enabled

*/
