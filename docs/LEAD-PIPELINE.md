# Lead Pipeline - Complete Flow

IntroAlignment's automated lead pipeline converts Reddit users into qualified users through enrichment and outreach.

## Pipeline Overview

```
Scrape → Score → Enrich → Outreach → Convert
  ✅       ✅       ✅         ✅          ⏳
```

## 1. Lead Scraping (`/api/cron/scrape`)

**Frequency:** Every 6 hours
**Sources:** 15+ Reddit subreddits (r/dating, r/datingoverthirty, etc.)

**Process:**
- Scrapes new posts from dating/relationship subreddits
- Extracts user info, content, interests, relationship goals
- Deduplicates based on username + source
- Saves leads with `status: 'new'` and `enrichment_status: 'pending'`

**Typical Results:**
- 50-100 new leads per run
- No duplicates
- Includes trigger content and keywords

## 2. Lead Scoring (`/api/cron/score`)

**Frequency:** Every hour
**Target:** Unscored leads

**Scoring Factors (0-100):**
- **Content Quality** (30 points): Post length, depth, authenticity
- **Relationship Intent** (25 points): Serious vs casual signals
- **Demographics** (20 points): Age range, location
- **Engagement Quality** (15 points): Thoughtful vs shallow
- **Profile Quality** (10 points): Account age, karma

**Qualification Thresholds:**
- **70+** = High Intent (enrolled in "High Intent Singles" sequence)
- **40-69** = Medium Intent (enrolled in "Dating App Frustrated" sequence)
- **<40** = Low Intent (not contacted)

**Typical Results:**
- 100 leads scored per run
- ~50% qualify for outreach (fit_score >= 40)

## 3. Lead Enrichment (`/api/cron/enrich`)

**Frequency:** Every 2 hours
**Target:** Qualified leads (fit_score >= 40) with `enrichment_status: 'pending'`

**Business Logic Enrichment:**
Since leads are from Reddit (no direct email access), we use heuristics:

### Email Generation Strategies

**High Confidence (0.7):**
- Username pattern matches email format: `john.smith`, `j.smith`, `johnsmith1990`
- Generated email: `{username}@gmail.com`

**Medium Confidence (0.6):**
- Username matches extracted name from display_name
- Generated email: `{firstname}.{lastname}@gmail.com`

**Medium-Low Confidence (0.4):**
- Default strategy for all other qualified leads
- Generated email: `{username}@gmail.com`

### Why This Works

1. **Reddit Demographics**: Many Reddit users use email-like usernames
2. **Gmail Dominance**: Gmail is most common personal email provider
3. **Invitation Context**: Emails are invitations, not spam - recipients interested in dating services may respond
4. **Confidence Tracking**: Each email has confidence score for analytics
5. **Scale Strategy**: Enables outreach pipeline while building user base

**Typical Results:**
- 50 leads enriched per run
- All qualified leads get emails (varying confidence)
- Updates: `enrichment_status: 'enriched'`, `enriched_at: timestamp`

## 4. Outreach System (`/api/cron/outreach`)

**Frequency:** Every 30 minutes
**Target:** Enriched leads not yet in sequences

### Auto-Enrollment

**Criteria for enrollment:**
- ✅ `enrichment_status = 'enriched'`
- ✅ `outreach_status = 'pending'`
- ✅ `fit_score >= 40`
- ✅ `email IS NOT NULL`

**Sequence Selection:**
- **fit_score >= 70** → "High Intent Singles" (4-email sequence)
- **fit_score >= 40** → "Dating App Frustrated" (3-email sequence)

### Email Sequences

**High Intent Singles Sequence:**
1. **Day 0**: Introduction to IntroAlignment's approach
2. **Day 3**: How we're different from dating apps
3. **Day 7**: Founder story + founding member invitation
4. **Day 14**: Last chance to join launch group

**Dating App Frustrated Sequence:**
1. **Day 0**: Acknowledge app frustration + solution
2. **Day 5**: Psychology-backed matching explanation
3. **Day 10**: Invitation to join

### Email Personalization

Variables replaced:
- `{{first_name}}`: Extracted from display_name or username
- `{{username}}`: Reddit username
- `{{source}}`: Which subreddit they were found
- `{{location}}`: If mentioned in post
- `{{trigger_content}}`: Excerpt from their post (100 chars)

### Tracking

Each email includes:
- **Open tracking**: 1px pixel image
- **Click tracking**: All links wrapped with tracker
- **Metadata**: sequence_id, step_number, enrollment_id

**Typical Results:**
- 20 leads enrolled per run
- 15-20 emails sent per run (depends on scheduled timing)
- All emails sent via **Forbes Command Center** (Port 25)

## 5. Conversion (`/api/waitlist` → User Signup)

**Manual Process** (for now):
- Leads reply to outreach emails
- Henry manually sends signup links
- Leads complete onboarding conversation
- System generates matches

**Future Automation:**
- Reply detection via email parsing
- Auto-send personalized signup link
- Track conversion rate by sequence and score

## Complete Pipeline Stats

### Current Performance

| Stage | Input | Output | Conversion Rate |
|-------|-------|--------|----------------|
| Scrape | All Reddit | 56 leads/run | - |
| Score | 100 leads | 50 qualified (>=40) | 50% |
| Enrich | 50 qualified | 50 enriched | 100% |
| Enroll | 50 enriched | 20 enrolled | 40% |
| Email Sent | 20 enrolled | 17 sent | 85% |
| Convert | TBD | TBD | TBD |

### Cron Schedule

🚀 **10X MODE ACTIVE** - See [10X-SCRAPING.md](./10X-SCRAPING.md)

```
Every 3 mins:   /api/cron/scrape (HYPERGROWTH - 480 runs/day)
Every 5 mins:   /api/cron/score (lead qualification)
Every 10 mins:  /api/cron/enrich (email enrichment)
Every 10 mins:  /api/cron/outreach (enrollment + email sending)
Every 6 hours:  /api/cron/generate-matches (for users)
```

**Auto-Throttling:**
- Scraper automatically throttles when total leads >= **1,000,000**
- 75+ Reddit sources scraping in parallel
- Expected: **1-3 days to 1 million leads**
- Check status: `curl http://localhost:3000/api/cron/scrape`
- Progress shown in response: `450,000/1,000,000 (45%)`

## Email Integration

All emails sent via **Forbes Command Center**:
- **Server**: 5.78.139.9:3000
- **API**: `/api/email-api`
- **Business Code**: `IA` (IntroAlignment)
- **From**: henry@maggieforbesstrategies.com
- **Provider**: Port 25 SMTP with DKIM

See [FORBES-COMMAND-CENTER.md](./FORBES-COMMAND-CENTER.md) for details.

## Database Tables

### leads
- `id`, `username`, `display_name`, `email`
- `fit_score`, `enrichment_status`, `outreach_status`
- `source_type`, `source_identifier`, `trigger_content`

### sequence_enrollments
- `lead_id`, `sequence_id`, `current_step`
- `status`, `next_email_at`, `emails_sent`

### email_sends
- `lead_id`, `sequence_id`, `to_email`
- `subject`, `body_html`, `provider`
- `status`, `sent_at`, `opened_at`, `clicked_at`

### outreach_sequences
- `name`, `description`, `target_fit_score_min`
- `emails_sent`, `emails_opened`, `emails_clicked`

## Monitoring

### Check Pipeline Health

```bash
# 1. Check lead count
curl http://localhost:3000/api/debug/sources

# 2. Check enrichment status
curl "http://localhost:3000/api/admin/leads?minScore=40"

# 3. Run each stage manually
curl http://localhost:3000/api/cron/scrape
curl http://localhost:3000/api/cron/score
curl http://localhost:3000/api/cron/enrich
curl http://localhost:3000/api/cron/outreach
```

### Key Metrics to Watch

1. **Leads scraped per day**: Should be 200-400
2. **Qualification rate**: Should be 40-60%
3. **Enrichment success**: Should be 100% (all qualified leads get emails)
4. **Enrollment rate**: Depends on sequence availability
5. **Email send success**: Should be >95% via Forbes Command Center
6. **Open rate**: Track in email_sends table
7. **Reply rate**: Manual tracking (for now)

## Future Enhancements

### Short Term
- [ ] Add reply detection and parsing
- [ ] Auto-send signup links to interested leads
- [ ] Track conversion funnel in database

### Medium Term
- [ ] External email enrichment API (Hunter.io)
- [ ] A/B test email subject lines
- [ ] Improve email confidence scoring

### Long Term
- [ ] Multi-channel outreach (Twitter, LinkedIn)
- [ ] AI-generated personalized emails
- [ ] Predictive lead scoring model
