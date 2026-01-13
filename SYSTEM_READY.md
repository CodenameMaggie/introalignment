# 🚀 Podcast Guest Recruitment System - READY

**Status:** ✅ All migrations applied, system operational
**Type:** Rule-based algorithmic system (NOT AI, NOT manual)
**Focus:** Estate planning attorneys who build businesses (sovereigndesign.it.com podcast)

---

## ✅ Completed Setup

### Database Migrations (All Applied Successfully)
- ✅ `024_email_deduplication_system_FIXED.sql` - 5-layer email protection
- ✅ `025_email_response_tracking.sql` - Reply tracking with sentiment
- ✅ `026_client_inquiries_system.sql` - Client intake (secondary)
- ✅ `027_podcast_guest_tracking_FIXED.sql` - 20+ podcast fields + scoring

### API Endpoints
- ✅ `/api/partners/import` - CSV upload (POST) & template download (GET)
- ✅ `/api/bots/henry` - Email sending with deduplication
- ✅ `/api/bots/dave` - Client-attorney matching (secondary)
- ✅ `/api/clients/inquire` - Client signup (secondary)

### Admin Pages
- ✅ `/admin/import-prospects` - CSV upload interface
- ✅ `/partners` - Attorney application form (enhanced for podcast)
- ✅ `/signup` - Client intake form (secondary)

### Email System
- ✅ Forbes Command Center integration (Port 25)
- ✅ `sendPodcastInvitation()` template with personalization
- ✅ Henry bot sends actual emails (not just logs)
- ✅ From: maggie@maggieforbesstrategies.com

### Scoring Algorithm
- ✅ Business Builder Score (0-10 points)
- ✅ Expertise Score (0-10 points)
- ✅ `podcast_prospects_high_priority` view (auto-ranks)
- ✅ `calculate_business_builder_score()` function

---

## 📦 Ready-to-Use Files

### Sample Data
- **sample_podcast_prospects.csv** - 5 example prospects (all 14-20 points)
  - Robert Chen: 18 points (small_firm_founder, 18 years, CA/NV/AZ)
  - Sarah Martinez: 20 points (boutique_partner, 15 years, TX/FL/DE, ACTEC)
  - Michael Thompson: 16 points (small_firm_founder, 22 years, NY/CT/NJ)
  - Jennifer Williams: 14 points (solo, 12 years, WY/SD/NV)
  - David Park: 20 points (small_firm_founder, 20 years, WA/OR/CA, international)

### Documentation
- **AUTOMATED_WORKFLOW.md** - Complete workflow guide
- **TEST_SCORING_ALGORITHM.sql** - 8 SQL queries to test scoring
- **SQL_MIGRATIONS_TO_RUN.md** - Migration instructions (already completed)
- **PODCAST_GUEST_RECRUITMENT_GUIDE.md** - Detailed recruitment guide

---

## 🎯 Target Profile (Confirmed)

### ✅ INCLUDE
- Estate planning attorneys who **built businesses** (practice owners)
- Multi-state practices (2+ states)
- Dynasty trusts, asset protection, legacy planning
- 10-20+ years experience
- Legal sovereignty specialists
- Multi-generational wealth transfer
- Business builders with entrepreneurial stories

### ❌ EXCLUDE
- Crypto/digital asset specialists
- BigLaw associates (not owners)
- Tech-focused attorneys
- Simple wills/probate only
- Manual intervention required

---

## 🚀 Quick Start (3 Steps)

### Step 1: Import Sample Prospects (2 minutes)
```
1. Visit: http://localhost:3000/admin/import-prospects
2. Upload: sample_podcast_prospects.csv
3. System imports 5 prospects automatically
```

### Step 2: Verify Scoring (30 seconds)
```sql
-- Run in Supabase SQL Editor
SELECT
    full_name,
    email,
    business_builder_score,
    expertise_score,
    (business_builder_score + expertise_score) as total_score
FROM podcast_prospects_high_priority
ORDER BY total_score DESC;
```

**Expected Results:**
- Sarah Martinez: 20 points
- David Park: 20 points
- Robert Chen: 18 points
- Michael Thompson: 16 points
- Jennifer Williams: 14 points

### Step 3: Send First Invitation (1 minute)
```bash
# Get prospect ID from import results or database
curl -X POST http://localhost:3000/api/bots/henry \
  -H "Content-Type: application/json" \
  -d '{
    "partner_id": "[prospect-uuid-from-database]",
    "campaign_type": "podcast_invitation"
  }'
```

**Henry bot will:**
1. Check 5-layer deduplication
2. Personalize email with name, title, specializations
3. Send from maggie@maggieforbesstrategies.com
4. Log to `outreach_email_log`
5. Update `podcast_status` to 'contacted'

---

## 📊 Automated Scoring Breakdown

### Business Builder Score (Max 10)
```
✓ Practice Owner            +3 points
✓ Multi-State Practice      +2 points
✓ Content Creator           +2 points
✓ Conference Speaker        +2 points
✓ ACTEC Fellow              +1 point
```

### Expertise Score (Max 10)
```
✓ Dynasty Trust Specialist  +3 points
✓ Asset Protection          +3 points
✓ International Planning    +2 points
✓ 15+ Years Experience      +2 points
```

### Priority Tiers
- **⭐⭐⭐ Elite (16+):** Top priority, contact immediately
- **⭐⭐ High Priority (12-15):** Strong candidates
- **⭐ Medium Priority (8-11):** Good candidates
- **Low Priority (0-7):** Only if specific need

---

## 🛡️ 5-Layer Email Protection

**All automated, zero manual checks needed:**

1. **Unsubscribe Check** → `partners.email_unsubscribed = true` → BLOCK
2. **Blacklist Check** → `email_blacklist` table → BLOCK
3. **Duplicate Check** → Same campaign within 30 days → BLOCK
4. **Frequency Limit** → Max 3 emails per week → BLOCK
5. **Campaign History** → Prevents repeat campaigns → BLOCK

Henry bot automatically runs all 5 checks before sending.

---

## 📈 Success Metrics

### Week 1 Goals
- Import: 20 prospects
- Send: 20 invitations
- Responses: 3-5 (15-25% response rate)
- Scheduled: 2-3 recordings

### Monthly Goals
- Import: 80-100 prospects
- Send: 80-100 invitations
- Responses: 15-20
- Recorded: 8-12 episodes
- Published: 4-8 episodes (weekly cadence)

---

## 🔄 Podcast Pipeline

**Automated Status Tracking:**
```
not_contacted → contacted → interested → scheduled → recorded → published
```

**Key Fields:**
- `podcast_status` - Current stage
- `podcast_scheduled_date` - Recording date
- `podcast_recorded_date` - When recorded
- `podcast_published_date` - When live
- `podcast_episode_url` - Published link

---

## 🎙️ Podcast Details

**Show:** sovereigndesign.it.com
**Host:** Maggie Forbes (MFS)
**Format:** 45-60 minute Zoom recordings
**Schedule:** Wednesdays
**Target:** High-net-worth clients seeking estate planning

**Topics:**
- Dynasty trust structures
- Asset protection strategies
- Cross-border estate planning
- Advanced tax optimization
- Family office legal considerations
- Multi-generational wealth transfer
- Legal sovereignty

---

## 🔍 Where to Find Prospects

### Top Sources
1. **ACTEC Directory** (actec.org) - Fellows only
2. **WealthCounsel** (wealthcounsel.com) - Members directory
3. **LinkedIn Sales Navigator** - Filter by:
   - Title: "Estate Planning Attorney", "Trust Attorney"
   - Location: High-net-worth states (CA, NY, FL, TX, NV, WY)
   - Company size: 1-50 (small firms/solo)
   - Connections: 500+ (active networkers)
4. **State Bar Directories** - Estate planning sections
5. **Conference Speakers** - WealthCounsel Summit, Heckerling
6. **Legal Publications** - Authors of estate planning articles

---

## ✅ System Verification Checklist

- ✅ All 4 migrations applied successfully
- ✅ `partners` table has 20+ new columns
- ✅ `podcast_prospects_high_priority` view exists
- ✅ `calculate_business_builder_score()` function works
- ✅ CSV import page loads at `/admin/import-prospects`
- ✅ Henry bot endpoint responds at `/api/bots/henry`
- ✅ Email template includes podcast details
- ✅ Forbes Command Center configured (Port 25)
- ✅ Sample CSV file ready to test

---

## 🎯 Next Action

**To start recruiting:**

1. Import `sample_podcast_prospects.csv` to test system
2. Run SQL queries in `TEST_SCORING_ALGORITHM.sql` to verify scoring
3. Find 15-20 real prospects from ACTEC/WealthCounsel
4. Create CSV file with their information
5. Upload via `/admin/import-prospects`
6. Send invitations via Henry bot API
7. Track responses in database

**System is 100% ready. No further setup required.**
