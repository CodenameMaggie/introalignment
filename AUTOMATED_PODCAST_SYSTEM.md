# 100% Automated Podcast Guest Recruitment System

**System Type:** Fully automated algorithmic system (NO manual intervention required)

---

## How It Works

### 1. Upload CSV → Everything Happens Automatically

```
CSV Upload → Auto-Import → Auto-Score → Auto-Enroll → Auto-Send → Auto-Follow-up
```

**You only do ONE thing:** Upload CSV file with attorney prospects

**The system does EVERYTHING else:**
1. ✅ Parses CSV and imports to database
2. ✅ Calculates business builder score (0-10)
3. ✅ Calculates expertise score (0-10)
4. ✅ Auto-enrolls prospects with fit_score >= 12
5. ✅ Schedules emails automatically
6. ✅ Sends invitations via Forbes Command Center
7. ✅ Sends follow-ups (Day 7, Day 14)
8. ✅ Tracks opens, clicks, replies
9. ✅ Updates podcast_status automatically

---

## Files Created (Automated System)

### Core Engine
- **`lib/outreach/partner-outreach-engine.ts`** - Partner outreach automation (mirrors lead system)
- **`app/api/cron/podcast-outreach/route.ts`** - Cron job (runs every 10 minutes)

### Updated Files
- **`app/api/partners/import/route.ts`** - Now auto-enrolls partners after import
- **`vercel.json`** - Added podcast-outreach cron schedule

### Database
- **`Desktop/028_podcast_outreach_sequence.sql`** - 3-step email sequence

---

## System Architecture

### Cron Job Schedule (vercel.json)
```json
{
  "path": "/api/cron/podcast-outreach",
  "schedule": "*/10 * * * *"  // Every 10 minutes
}
```

### Automated Workflow

**Every 10 Minutes, the cron job:**
1. Queries for partners in sequences with `next_email_at <= NOW()`
2. Sends scheduled podcast invitations
3. Updates enrollment status (current_step++)
4. Schedules next email (Day 7 or Day 14)
5. Queries for new high-quality prospects (fit_score >= 12)
6. Auto-enrolls them in podcast sequence
7. Updates sequence stats (open_rate, click_rate)

---

## 3-Step Email Sequence

### Step 1: Initial Invitation (Day 0)
- **When:** Immediately after CSV import
- **From:** maggie@maggieforbesstrategies.com
- **Subject:** "Podcast Invitation: Share Your Expertise on sovereigndesign.it.com"
- **Content:** Full podcast invitation with benefits, topics, Calendly link

### Step 2: Follow-up (Day 7)
- **When:** 7 days after initial (if no response)
- **Subject:** "Following up: Podcast Guest Invitation"
- **Content:** Shorter reminder, emphasizes ease (45-60 min, Wednesday)

### Step 3: Final Follow-up (Day 14)
- **When:** 14 days after initial (7 days after step 2)
- **Subject:** "Last call: Podcast Guest Opportunity"
- **Content:** Final polite reminder, "door is still open"

After Step 3, sequence completes automatically. No more emails sent.

---

## Auto-Enrollment Criteria

**Partners are automatically enrolled if:**
- ✅ `fit_score >= 12` (business_builder + expertise)
- ✅ Has valid email address
- ✅ `email_unsubscribed = false`
- ✅ `podcast_status IN ('not_contacted', null)`
- ✅ `status = 'approved'` (not rejected)

**Fit Score Calculation (Automated):**
```javascript
business_builder_score =
  (practice_owner ? 3 : 0) +
  (multi_state_practice ? 2 : 0) +
  (content_creator ? 2 : 0) +
  (conference_speaker ? 2 : 0) +
  (actec_fellow ? 1 : 0);

expertise_score =
  (dynasty_trust_specialist ? 3 : 0) +
  (asset_protection_specialist ? 3 : 0) +
  (international_planning ? 2 : 0) +
  (years_experience >= 15 ? 2 : 0);

fit_score = business_builder_score + expertise_score;
```

**Example Scores:**
- Sarah Martinez: 10 + 10 = **20** (Elite) ✅ Auto-enrolled
- Robert Chen: 10 + 8 = **18** (Elite) ✅ Auto-enrolled
- Michael Thompson: 8 + 8 = **16** (Elite) ✅ Auto-enrolled
- Jennifer Williams: 8 + 6 = **14** (High Priority) ✅ Auto-enrolled
- Weak Prospect: 4 + 6 = **10** (Below threshold) ❌ Not enrolled

---

## Database Tables Used

### 1. `partners` (Prospects)
- Stores all attorney prospects
- `podcast_status`: not_contacted → queued → contacted → interested → scheduled → recorded
- `current_sequence_id`: Which sequence they're enrolled in

### 2. `outreach_sequences` (Sequences)
- Contains the podcast invitation sequence
- `sequence_type = 'podcast_invitation'`
- `target_fit_score_min = 12`

### 3. `sequence_emails` (Email Steps)
- Step 1: delay_days = 0 (immediate)
- Step 2: delay_days = 7 (1 week later)
- Step 3: delay_days = 14 (2 weeks later)

### 4. `sequence_enrollments` (Active Enrollments)
- Tracks each partner's progress through sequence
- `current_step`: 0 → 1 → 2 → 3
- `next_email_at`: When to send next email
- `status`: active → completed

### 5. `email_sends` (Send Log)
- Records every email sent
- Tracks opens, clicks, bounces
- Links to enrollment and partner

### 6. `outreach_email_log` (Deduplication)
- Prevents duplicate sends
- Used by existing deduplication system

---

## Setup Instructions

### 1. Run SQL Migration
```bash
# In Supabase SQL Editor, run:
/Users/Kristi/introalignment/Desktop/028_podcast_outreach_sequence.sql
```

This creates:
- 1 podcast outreach sequence
- 3 email steps (Day 0, Day 7, Day 14)

### 2. Set Environment Variables
```env
# Enable podcast outreach (default: true)
PODCAST_OUTREACH_ENABLED=true

# Forbes Command Center (already configured)
FORBES_COMMAND_API_URL=http://5.78.139.9:3000/api/email-api
FORBES_COMMAND_API_KEY=forbes-command-2026

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### 3. Deploy to Vercel
```bash
# Push to GitHub (if not already)
git add .
git commit -m "Add automated podcast guest outreach system"
git push

# Vercel will auto-deploy
# Cron jobs activate automatically on Vercel
```

### 4. Test Locally (Optional)
```bash
# Run dev server
npm run dev

# Manually trigger cron (simulates automated run)
curl http://localhost:3000/api/cron/podcast-outreach

# Expected response:
{
  "success": true,
  "outreach_status": "ACTIVE",
  "emails_sent": 0,
  "partners_enrolled": 0,
  "stats": { ... }
}
```

---

## Usage

### Upload Prospects (The ONLY Manual Step)
```
1. Visit: http://localhost:3000/admin/import-prospects
2. Upload: sample_podcast_prospects.csv (or your own)
3. Click "Upload & Import Prospects"
```

**System Automatically:**
- Imports 5 prospects
- Calculates fit scores
- Enrolls qualified prospects (fit_score >= 12)
- Schedules initial invitations
- Sends emails via cron job (every 10 minutes)

### Monitor Progress (Optional)
```bash
# Check cron job status
curl https://your-domain.vercel.app/api/cron/podcast-outreach

# Check enrolled prospects
SELECT
  p.full_name,
  p.email,
  p.podcast_status,
  e.current_step,
  e.next_email_at,
  e.emails_sent
FROM partners p
JOIN sequence_enrollments e ON e.partner_id = p.id
WHERE e.status = 'active';

# Check sent emails
SELECT
  s.to_email,
  s.subject,
  s.sent_at,
  s.status,
  s.opened_at,
  s.clicked_at
FROM email_sends s
WHERE s.partner_id IS NOT NULL
ORDER BY s.sent_at DESC;
```

---

## Email Deduplication (Automatic)

**5-Layer Protection (Mirrors Lead System):**

1. **Unsubscribe Check** → `partners.email_unsubscribed = true` → SKIP
2. **Sequence Check** → Already enrolled in same sequence → SKIP
3. **Email Log Check** → `outreach_email_log` (prevents duplicates)
4. **Partner Status Check** → `podcast_status = 'contacted'` → SKIP initial
5. **Sequence Status Check** → `enrollment.status = 'completed'` → SKIP

All checks happen automatically in `partner-outreach-engine.ts`.

---

## Stats & Reporting

### Cron Job Response
```json
{
  "success": true,
  "outreach_status": "ACTIVE",
  "timestamp": "2026-01-12T22:00:00.000Z",
  "emails_sent": 12,
  "partners_enrolled": 5,
  "stats": {
    "total_prospects": 50,
    "contacted": 12,
    "interested": 3,
    "scheduled": 1,
    "conversion_rate": "6.0%"
  }
}
```

### Database Stats
```sql
-- Get podcast stats
SELECT * FROM get_podcast_stats();

-- View high-priority queue
SELECT * FROM podcast_prospects_high_priority
WHERE podcast_status = 'not_contacted'
ORDER BY (business_builder_score + expertise_score) DESC;
```

---

## Success Metrics

### Week 1 Goals (Fully Automated)
- **Import:** 20 prospects via CSV
- **Auto-Enrolled:** 15-18 (fit_score >= 12)
- **Emails Sent:** 15-18 initial invitations
- **Responses:** 3-5 (15-25% response rate)
- **Scheduled:** 2-3 recordings

### Monthly Goals
- **Import:** 80-100 prospects
- **Auto-Enrolled:** 60-75
- **Emails Sent:** 180-225 (initial + follow-ups)
- **Responses:** 15-20
- **Recorded:** 8-12 episodes
- **Published:** 4-8 episodes (weekly cadence)

---

## Troubleshooting

### No Emails Being Sent?

**Check 1: Is outreach enabled?**
```bash
curl http://localhost:3000/api/cron/podcast-outreach
# Look for: "outreach_status": "ACTIVE" or "PAUSED"
```

**Check 2: Are prospects enrolled?**
```sql
SELECT COUNT(*) FROM sequence_enrollments
WHERE status = 'active' AND partner_id IS NOT NULL;
```

**Check 3: Are emails scheduled?**
```sql
SELECT * FROM sequence_enrollments
WHERE status = 'active'
  AND partner_id IS NOT NULL
  AND next_email_at <= NOW();
```

**Check 4: Check logs**
```bash
# Vercel deployment logs
vercel logs

# Or Railway logs if deployed there
railway logs
```

### Prospects Not Auto-Enrolling?

**Check fit scores:**
```sql
SELECT
  full_name,
  email,
  business_builder_score,
  expertise_score,
  (business_builder_score + expertise_score) as total_score
FROM podcast_prospects_high_priority
WHERE podcast_status = 'not_contacted';

-- If total_score < 12, they won't auto-enroll
```

### Sequence Not Found?

**Run the SQL migration:**
```sql
-- Check if sequence exists
SELECT * FROM outreach_sequences
WHERE sequence_type = 'podcast_invitation';

-- If empty, run: 028_podcast_outreach_sequence.sql
```

---

## System Status: READY ✅

**Everything is configured for 100% automation:**

- ✅ Partner outreach engine created
- ✅ Cron job configured (every 10 minutes)
- ✅ CSV import auto-enrolls prospects
- ✅ 3-step email sequence ready
- ✅ Deduplication system active
- ✅ Tracking system ready
- ✅ Forbes Command Center integrated

**To activate:**
1. Run `028_podcast_outreach_sequence.sql` in Supabase
2. Upload CSV file at `/admin/import-prospects`
3. System handles everything else automatically

**Zero manual work required after CSV upload.**
