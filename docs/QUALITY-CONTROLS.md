# Lead Quality Controls - Ensuring High Standards

IntroAlignment uses multiple quality gates to ensure only high-intent, genuine leads receive invitations.

## Quality Philosophy

**Quality Over Quantity**
- We're targeting 1M leads, but only **20-30% will be contacted**
- Strict filtering ensures:
  - ✅ High sender reputation
  - ✅ Better engagement rates
  - ✅ Higher conversion to users
  - ✅ Positive brand perception

## Quality Gates

### Gate 1: Scraping Filters

**Source-Level Filtering:**
- Minimum karma requirements (10-100 depending on subreddit)
- Account age requirements (30+ days)
- Keyword matching (serious intent keywords)
- Exclude keywords (casual, hookup, transactional)

**Content Filtering:**
- Minimum post length (varies by source)
- Authentic language patterns
- Personal pronouns indicating real person

### Gate 2: Scoring Algorithm (0-100 points)

**Scoring Breakdown:**

1. **Relationship Intent** (25 points)
   - Serious goal: 20 points
   - Unknown goal: 10 points
   - Casual goal: 0 points (disqualified)
   - Bonus: +1 per serious keyword (marriage, life partner, etc.)

2. **Age Fit** (20 points)
   - Target age (25-64): 20 points
   - Slightly outside (22-24, 61-65): 15 points
   - Too young/old (<22, >65): 5 points

3. **Engagement Quality** (20 points)
   - Content length: 1-8 points
   - Personal pronouns: 3-5 points
   - Thoughtfulness: 4 points
   - Questions asked: 2-3 points

4. **Location Fit** (15 points)
   - Location mentioned: 12 points
   - Target location: 15 points
   - No location: 7 points

5. **Profile Completeness** (10 points)
   - Email: 4 points
   - Age: 2 points
   - Gender: 1 point
   - Location: 2 points
   - Name: 1 point

6. **Recency** (10 points)
   - <1 day: 10 points
   - <3 days: 8 points
   - <7 days: 6 points
   - <14 days: 4 points
   - <30 days: 2 points

**Negative Scoring (Instant Disqualification):**

Leads are automatically scored 0 if they contain:
- Spam keywords: onlyfans, cashapp, venmo, selling, telegram
- Transactional: sugar daddy/baby, findom, feet pics, send $
- Hookup keywords: nsa, fwb, hookup only, dtf, one night
- Bot patterns: Repeated characters (hiiiii), super long words, URLs
- Too short: <50 characters
- Phone number strings: 10+ digits in sequence

### Gate 3: Outreach Threshold

**Only Contact Leads With:**
- ✅ `fit_score >= 60` (was 40, **increased for quality**)
- ✅ `email_confidence >= 0.4`
- ✅ `enrichment_status = 'enriched'`
- ✅ `trigger_content IS NOT NULL` (must have actual post)
- ✅ `email IS NOT NULL`

**This Reduces Volume by ~60%:**
- 1M leads scraped
- ~450K score >= 40
- **~200K score >= 60** (quality threshold)
- Only these 200K receive emails

### Gate 4: Email Sequence Selection

**Two Tiers:**

**Tier 1: "High Intent Singles"** (fit_score >= 70)
- 4-email sequence
- More personalized messaging
- Founder story included
- Premium positioning

**Tier 2: "Dating App Frustrated"** (fit_score 60-69)
- 3-email sequence
- Problem-solution focus
- Addresses app fatigue
- Good fit messaging

**Below 60: No Contact**

## Quality Monitoring

### Real-Time Quality Dashboard

Access at: `/api/admin/quality-report`

**Metrics Tracked:**
- Total leads by quality tier
- Qualification rate (% scoring >= 60)
- Enrichment success rate
- Email confidence distribution
- Leads contacted vs not contacted
- 24-hour activity rates

**Example Response:**
```json
{
  "overview": {
    "totalLeads": 500000,
    "scoredLeads": 480000,
    "enriched": 250000,
    "enrolled": 150000,
    "emailsSent": 180000
  },
  "qualityDistribution": {
    "high": {"count": 96000, "percentage": 20, "willContact": true},
    "good": {"count": 96000, "percentage": 20, "willContact": true},
    "medium": {"count": 144000, "percentage": 30, "willContact": false},
    "low": {"count": 144000, "percentage": 30, "willContact": false}
  },
  "qualityGates": {
    "minimumFitScore": 60,
    "contactingLeads": 192000,
    "notContacting": 288000
  }
}
```

### Check Quality Anytime

```bash
# Quality report
curl http://localhost:3000/api/admin/quality-report | jq

# Check distribution
curl http://localhost:3000/api/admin/quality-report | jq ".qualityDistribution"

# See what's being contacted
curl http://localhost:3000/api/admin/quality-report | jq ".qualityGates"
```

## Expected Outcomes

### With 1M Leads Scraped

**Quality Distribution (Expected):**
- **20% High Quality (70-100):** 200,000 leads
- **20% Good Quality (60-69):** 200,000 leads
- **30% Medium Quality (40-59):** 300,000 leads
- **30% Low Quality (0-39):** 300,000 leads

**Who Gets Contacted:**
- High + Good tiers only: **400,000 leads**
- Medium + Low: **600,000 NOT contacted**

### Email Volume (Revised)

**Day 1:**
- Emails sent: ~200,000 (not 450K - quality filter applied)

**Day 2:**
- Follow-ups: ~70,000

**Day 3:**
- Follow-ups: ~50,000

**Total 3 Days: ~320,000 emails** (still massive, but higher quality)

### Conversion Expectations

With higher quality threshold (60+ instead of 40+):

| Metric | Conservative | Realistic | Optimistic |
|--------|--------------|-----------|------------|
| Open Rate | 30% | 35% | 40% |
| Click Rate | 4% | 5% | 6% |
| Reply Rate | 1.5% | 2% | 2.5% |
| Conversion Rate | 0.75% | 1% | 1.25% |
| **New Users** | **2,400** | **3,200** | **4,000** |

**Better than 7K estimate at lower quality, but:**
- ✅ Higher engagement rates
- ✅ Better sender reputation
- ✅ More genuine interest
- ✅ Higher-quality user base

## Spam Prevention

### Why These Controls Matter

**Without Quality Gates:**
- Risk: 450K emails → spam complaints → blacklisted sender
- Result: All future emails land in spam
- Brand: Perceived as spam service

**With Quality Gates:**
- Volume: 200K emails (60% reduction)
- Quality: 2x better engagement
- Reputation: Strong sender score
- Brand: Premium, curated service

### Monitoring Deliverability

**Key Metrics to Watch:**

1. **Bounce Rate** (<5% is healthy)
2. **Spam Complaint Rate** (<0.1% is healthy)
3. **Open Rate** (>25% is healthy)
4. **Unsubscribe Rate** (<0.5% is healthy)

**Forbes Command Center tracks these automatically via DKIM/SPF.**

## Adjusting Quality Thresholds

### If Too Many Emails

**Increase threshold:**
```typescript
// In app/api/cron/outreach/route.ts
.gte('fit_score', 70)  // Change from 60 to 70
```

This would contact only top 20% (~200K leads) instead of top 40%

### If Too Few Emails

**Decrease threshold:**
```typescript
.gte('fit_score', 55)  // Change from 60 to 55
```

This would contact ~250K leads instead of 200K

### Monitor and Adjust

**Week 1:**
- Run at fit_score >= 60
- Monitor open rates, replies, complaints
- Adjust up/down based on results

**Week 2:**
- If open rate >30% and complaints <0.1%: Success! Keep threshold
- If open rate <25%: Increase threshold to 65
- If open rate >40% and few replies: Decrease to 55 for volume

## Quality Assurance Checklist

### Before Launch

- [ ] Run migration to add 60+ sources
- [ ] Verify scoring algorithm includes negative keywords
- [ ] Confirm outreach threshold is 60+ (not 40)
- [ ] Test quality report endpoint
- [ ] Check Forbes Command Center DKIM setup

### After Launch (Daily)

- [ ] Check quality report
- [ ] Monitor qualification rate (should be 40-50%)
- [ ] Review email confidence distribution
- [ ] Check bounce/complaint rates
- [ ] Adjust thresholds if needed

### Red Flags (Take Action)

- ❌ Bounce rate >5%: Stop sending, review emails
- ❌ Spam complaints >0.5%: Increase fit_score threshold
- ❌ Open rate <20%: Quality too low, increase threshold
- ❌ Qualification rate >60%: Scoring too lenient, tighten criteria

## Summary

**Quality Configuration:**
- ✅ Negative keyword filtering (spam, transactional, hookup)
- ✅ Bot/spam pattern detection
- ✅ Minimum content length (50 chars)
- ✅ Fit score threshold: 60+ (top 40% quality)
- ✅ Email confidence: 0.4+ required
- ✅ Real-time quality monitoring

**Expected Results:**
- 1M leads → 200K contacted (20%)
- 320K total emails over 3 days
- 2,400-4,000 new high-quality users
- Strong sender reputation maintained

**Quality over quantity = sustainable growth** 🎯
