# Automated Podcast Guest Recruitment Workflow

**System Type:** Rule-based algorithmic system (NOT AI-driven, NOT manual)

## 1. CSV Import (Batch Processing)

**Location:** http://localhost:3000/admin/import-prospects

**Process:**
1. Upload CSV file with attorney prospects
2. System automatically:
   - Parses CSV with quoted field handling
   - Converts semicolon-separated arrays (states, specializations)
   - Calculates `multi_state_practice` from `licensed_states` count
   - Deduplicates by email address
   - Auto-assigns `podcast_status: 'not_contacted'`
   - Logs import activity for each prospect

**Example:** `sample_podcast_prospects.csv` (5 prospects included)

---

## 2. Algorithmic Scoring (Automatic)

**SQL View:** `podcast_prospects_high_priority`

### Business Builder Score (0-10 points)
```
✓ Practice Owner (+3 points)
✓ Multi-State Practice (+2 points)
✓ Content Creator (+2 points)
✓ Conference Speaker (+2 points)
✓ ACTEC Fellow (+1 point)
```

### Expertise Score (0-10 points)
```
✓ Dynasty Trust Specialist (+3 points)
✓ Asset Protection Specialist (+3 points)
✓ International Planning (+2 points)
✓ 15+ Years Experience (+2 points)
```

### Priority Ranking
- Prospects ranked by: (business_builder_score + expertise_score)
- Minimum threshold: 2+ qualifying attributes
- Excludes: rejected, unsubscribed, already contacted

**Sample Prospect Scores:**

| Name | Business Builder | Expertise | Total | Priority |
|------|-----------------|-----------|-------|----------|
| Robert Chen | 10 | 8 | 18 | ⭐⭐⭐ |
| Sarah Martinez | 10 | 10 | 20 | ⭐⭐⭐ |
| Michael Thompson | 8 | 8 | 16 | ⭐⭐⭐ |
| Jennifer Williams | 8 | 6 | 14 | ⭐⭐ |
| David Park | 10 | 10 | 20 | ⭐⭐⭐ |

---

## 3. Email Deduplication (5-Layer Protection)

**Automatic Checks Before Sending:**

1. **Unsubscribe Check** → If `email_unsubscribed = true`, BLOCK
2. **Blacklist Check** → `check_email_blacklist()` function
3. **Duplicate Check** → `check_duplicate_email()` - 30-day window
4. **Frequency Limit** → `get_recent_email_count()` - Max 3/week
5. **Campaign History** → Prevents same campaign type repeats

---

## 4. Henry Bot Email Sending (Automated)

**Endpoint:** `POST /api/bots/henry`

**Request:**
```json
{
  "partner_id": "uuid-of-prospect",
  "campaign_type": "podcast_invitation"
}
```

**Automated Process:**
1. Retrieves prospect details from database
2. Runs all 5 deduplication checks
3. Generates personalized email from template
4. Sends via Forbes Command Center (Port 25)
5. Logs to `outreach_email_log` table
6. Updates `last_contact_date` on partner record
7. Changes `partner_type` from 'prospect' → 'contacted'
8. Updates `podcast_status` → 'contacted'

**Email Template:** `lib/email/forbes-command-center.ts:sendPodcastInvitation()`
- From: maggie@maggieforbesstrategies.com
- Subject: Podcast Invitation: Share Your Expertise on sovereigndesign.it.com
- Personalized with: firstName, professionalTitle, specializations
- Includes: Podcast badge, benefits, topics, Calendly link

---

## 5. Pipeline Tracking (Status Updates)

**Podcast Status Flow:**
```
not_contacted → contacted → interested → scheduled → recorded → published
```

**Tracking Fields:**
- `podcast_scheduled_date` - When recording is booked
- `podcast_recorded_date` - When episode is recorded
- `podcast_published_date` - When episode goes live
- `podcast_episode_url` - Final published URL

---

## 6. Reply Tracking (Email Response Monitoring)

**Table:** `email_replies`

**Automatic Sentiment Analysis Fields:**
- `sentiment` → 'positive', 'neutral', 'negative'
- `interest_level` → 'very_interested', 'interested', 'maybe', 'not_interested'
- `action_required` → 'schedule_call', 'send_info', 'follow_up', 'no_action'

**Function:** `log_email_reply()` updates:
- Reply record created
- `outreach_email_log.status` → 'replied'
- `partners.total_replies` incremented

---

## Quick Start Commands

### Import Sample Prospects
1. Visit: http://localhost:3000/admin/import-prospects
2. Upload: `sample_podcast_prospects.csv`
3. System imports 5 prospects automatically

### View High-Priority Prospects (SQL)
```sql
SELECT
  full_name,
  email,
  (business_builder_score + expertise_score) as total_score,
  podcast_status
FROM podcast_prospects_high_priority
ORDER BY total_score DESC
LIMIT 10;
```

### Send Invitation (API)
```bash
curl -X POST http://localhost:3000/api/bots/henry \
  -H "Content-Type: application/json" \
  -d '{
    "partner_id": "prospect-uuid-here",
    "campaign_type": "podcast_invitation"
  }'
```

### Check Podcast Stats (SQL)
```sql
SELECT * FROM get_podcast_stats();
```

---

## Key Differentiators

✓ **100% Rule-Based** - No AI decision-making, pure algorithmic scoring
✓ **Batch Processing** - Import 50+ prospects in 2 minutes
✓ **Zero Duplicates** - 5-layer deduplication protection
✓ **Auto-Scoring** - Business builder + expertise algorithms
✓ **Email Automation** - Henry bot sends personalized invitations
✓ **Pipeline Visibility** - Track from contact → published

**Target:** 20 invitations/week → 3-5 positive responses → 2-3 scheduled recordings
