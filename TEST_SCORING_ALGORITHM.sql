-- Test Scoring Algorithm for Podcast Guest Prospects
-- Run this after importing sample_podcast_prospects.csv

-- ===========================================
-- 1. View All High-Priority Prospects (Ranked)
-- ===========================================
SELECT
    full_name,
    email,
    years_experience,
    num_states_licensed,
    practice_type,

    -- Business Builder Score
    (CASE WHEN practice_owner = true THEN 3 ELSE 0 END +
     CASE WHEN multi_state_practice = true THEN 2 ELSE 0 END +
     CASE WHEN content_creator = true THEN 2 ELSE 0 END +
     CASE WHEN conference_speaker = true THEN 2 ELSE 0 END +
     CASE WHEN actec_fellow = true THEN 1 ELSE 0 END) as business_builder_score,

    -- Expertise Score
    (CASE WHEN dynasty_trust_specialist = true THEN 3 ELSE 0 END +
     CASE WHEN asset_protection_specialist = true THEN 3 ELSE 0 END +
     CASE WHEN international_planning = true THEN 2 ELSE 0 END +
     CASE WHEN years_experience >= 15 THEN 2 ELSE 0 END) as expertise_score,

    -- Total Score
    (CASE WHEN practice_owner = true THEN 3 ELSE 0 END +
     CASE WHEN multi_state_practice = true THEN 2 ELSE 0 END +
     CASE WHEN content_creator = true THEN 2 ELSE 0 END +
     CASE WHEN conference_speaker = true THEN 2 ELSE 0 END +
     CASE WHEN actec_fellow = true THEN 1 ELSE 0 END +
     CASE WHEN dynasty_trust_specialist = true THEN 3 ELSE 0 END +
     CASE WHEN asset_protection_specialist = true THEN 3 ELSE 0 END +
     CASE WHEN international_planning = true THEN 2 ELSE 0 END +
     CASE WHEN years_experience >= 15 THEN 2 ELSE 0 END) as total_score,

    podcast_status,
    source
FROM partners
WHERE partner_type IN ('prospect', 'contacted')
  AND podcast_status IN ('not_contacted', 'contacted')
  AND COALESCE(email_unsubscribed, false) = false
ORDER BY total_score DESC, years_experience DESC;

-- ===========================================
-- 2. Test Business Builder Score Function
-- ===========================================
SELECT
    full_name,
    email,
    calculate_business_builder_score(id) as bb_score,
    practice_owner,
    multi_state_practice,
    content_creator,
    conference_speaker,
    actec_fellow
FROM partners
WHERE partner_type IN ('prospect', 'contacted')
ORDER BY bb_score DESC
LIMIT 10;

-- ===========================================
-- 3. Use Built-in View (Most Efficient)
-- ===========================================
SELECT
    full_name,
    email,
    years_experience,
    business_builder_score,
    expertise_score,
    (business_builder_score + expertise_score) as total_score,
    podcast_status,
    source
FROM podcast_prospects_high_priority
ORDER BY total_score DESC;

-- ===========================================
-- 4. Get Podcast Pipeline Statistics
-- ===========================================
SELECT * FROM get_podcast_stats();

-- ===========================================
-- 5. Find Top 5 Prospects to Contact First
-- ===========================================
SELECT
    id,
    full_name,
    email,
    professional_title,
    firm_name,
    business_builder_score,
    expertise_score,
    (business_builder_score + expertise_score) as total_score,
    specializations,
    licensed_states
FROM podcast_prospects_high_priority
WHERE podcast_status = 'not_contacted'
ORDER BY (business_builder_score + expertise_score) DESC
LIMIT 5;

-- ===========================================
-- 6. Check Email Deduplication Status
-- ===========================================
-- Replace 'rchen@chenestatelaw.com' with any prospect email

SELECT * FROM check_duplicate_email(
    'rchen@chenestatelaw.com',
    'podcast_invitation',
    30
);

SELECT * FROM check_email_blacklist('rchen@chenestatelaw.com');

SELECT * FROM get_recent_email_count('rchen@chenestatelaw.com', 7);

-- ===========================================
-- 7. View All Prospects with Scoring Breakdown
-- ===========================================
SELECT
    full_name,
    email,

    -- Individual Score Components
    CASE WHEN practice_owner = true THEN '✓ Practice Owner (+3)' ELSE '✗ Practice Owner' END as owner_status,
    CASE WHEN multi_state_practice = true THEN '✓ Multi-State (+2)' ELSE '✗ Multi-State' END as multi_state_status,
    CASE WHEN content_creator = true THEN '✓ Content Creator (+2)' ELSE '✗ Content Creator' END as content_status,
    CASE WHEN conference_speaker = true THEN '✓ Speaker (+2)' ELSE '✗ Speaker' END as speaker_status,
    CASE WHEN actec_fellow = true THEN '✓ ACTEC (+1)' ELSE '✗ ACTEC' END as actec_status,
    CASE WHEN dynasty_trust_specialist = true THEN '✓ Dynasty Trusts (+3)' ELSE '✗ Dynasty Trusts' END as dynasty_status,
    CASE WHEN asset_protection_specialist = true THEN '✓ Asset Protection (+3)' ELSE '✗ Asset Protection' END as asset_status,
    CASE WHEN international_planning = true THEN '✓ International (+2)' ELSE '✗ International' END as intl_status,
    CASE WHEN years_experience >= 15 THEN '✓ 15+ Years (+2)' ELSE '✗ 15+ Years' END as experience_status,

    -- Total Scores
    calculate_business_builder_score(id) as bb_score,
    (CASE WHEN dynasty_trust_specialist = true THEN 3 ELSE 0 END +
     CASE WHEN asset_protection_specialist = true THEN 3 ELSE 0 END +
     CASE WHEN international_planning = true THEN 2 ELSE 0 END +
     CASE WHEN years_experience >= 15 THEN 2 ELSE 0 END) as expertise_score,

    podcast_status
FROM partners
WHERE partner_type IN ('prospect', 'contacted')
ORDER BY calculate_business_builder_score(id) DESC;

-- ===========================================
-- 8. Count Prospects by Score Tier
-- ===========================================
SELECT
    CASE
        WHEN (business_builder_score + expertise_score) >= 16 THEN '⭐⭐⭐ Elite (16+)'
        WHEN (business_builder_score + expertise_score) >= 12 THEN '⭐⭐ High Priority (12-15)'
        WHEN (business_builder_score + expertise_score) >= 8 THEN '⭐ Medium Priority (8-11)'
        ELSE 'Low Priority (0-7)'
    END as priority_tier,
    COUNT(*) as prospect_count,
    ARRAY_AGG(full_name) as prospects
FROM podcast_prospects_high_priority
GROUP BY priority_tier
ORDER BY MIN(business_builder_score + expertise_score) DESC;

-- ===========================================
-- EXPECTED RESULTS (After Importing Sample CSV)
-- ===========================================
/*
Sample prospects should score:

1. Sarah Martinez: 20 points (⭐⭐⭐ Elite)
   - Practice Owner (+3), Multi-State (+2), Content Creator (+2), Speaker (+2), ACTEC (+1)
   - Dynasty (+3), Asset Protection (+3), International (+2), 15+ Years (+2)

2. David Park: 20 points (⭐⭐⭐ Elite)
   - Practice Owner (+3), Multi-State (+2), Content Creator (+2), Speaker (+2), ACTEC (+1)
   - Dynasty (+3), Asset Protection (+3), International (+2), 15+ Years (+2)

3. Robert Chen: 18 points (⭐⭐⭐ Elite)
   - Practice Owner (+3), Multi-State (+2), Content Creator (+2), Speaker (+2), ACTEC (+1)
   - Dynasty (+3), Asset Protection (+3), 18 Years (+2)

4. Michael Thompson: 16 points (⭐⭐⭐ Elite)
   - Practice Owner (+3), Multi-State (+2), Speaker (+2), ACTEC (+1)
   - Dynasty (+3), Asset Protection (+3), 22 Years (+2), International (+2)

5. Jennifer Williams: 14 points (⭐⭐ High Priority)
   - Practice Owner (+3), Multi-State (+2), Content Creator (+2)
   - Dynasty (+3), Asset Protection (+3), 12 Years (+0)

All prospects meet minimum threshold for podcast invitation.
*/
