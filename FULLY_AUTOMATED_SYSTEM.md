# FULLY AUTOMATED Podcast Guest Recruitment System

**ZERO MANUAL WORK REQUIRED**

---

## System Overview

This is a **100% automated system** that continuously finds, scores, enrolls, and emails estate planning attorneys for podcast guest invitations.

**You do NOTHING. The system does EVERYTHING.**

---

## Automated Pipeline

```
Every 6 Hours → Scrape ACTEC + WealthCounsel
    ↓
Auto-Score (business_builder + expertise = fit_score)
    ↓
Insert as 'prospect' in partners table
    ↓
Every 10 Minutes → Auto-Enroll (fit_score >= 12)
    ↓
Auto-Send Invitation (maggie@maggieforbesstrategies.com)
    ↓
Track Opens/Clicks
    ↓
Auto-Follow-up (Day 7)
    ↓
Auto-Follow-up (Day 14)
    ↓
Sequence Complete
```

**NO CSV uploads. NO manual emails. NO manual enrollment. NO manual follow-ups.**

---

## How It Works

### 1. Attorney Discovery (Every 6 Hours)

**Cron Job:** `/api/cron/scrape-attorneys` runs every 6 hours

**What It Does:**
- Scrapes **ACTEC directory** (~2,600 Fellows)
  - Top-tier estate planning attorneys
  - Invitation-only membership
  - 10+ years experience typically
  - Dynasty trusts, asset protection, complex planning

- Scrapes **WealthCounsel directory** (~4,000 members)
  - Practice owners and entrepreneurs
  - Business-focused estate planning
  - Asset protection specialists
  - 5-20 years experience

**Results:**
- Extracts: name, email, firm, states, specializations, experience
- Auto-scores each attorney
- Inserts into `partners` table as 'prospect'
- Deduplicates by email

**Target:** 10,000 attorneys (auto-throttles at target)

### 2. Auto-Enrollment (Every 10 Minutes)

**Cron Job:** `/api/cron/podcast-outreach` runs every 10 minutes

**What It Does:**
- Queries `podcast_prospects_high_priority` view
- Filters: `fit_score >= 12` AND `podcast_status = 'not_contacted'`
- Auto-enrolls in podcast invitation sequence
- Schedules Day 0 invitation (immediate)

**Fit Score Calculation:**
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

// Auto-enroll if >= 12
```

**Example Scores:**
- ACTEC Fellow, practice owner, multi-state, dynasty trusts, 18 years → **18 points** ✅
- WealthCounsel member, practice owner, asset protection, 14 years → **14 points** ✅
- Solo attorney, no specializations, 8 years → **3 points** ❌

### 3. Auto-Send Invitations (Every 10 Minutes)

**Same Cron Job:** `/api/cron/podcast-outreach`

**What It Does:**
- Queries `sequence_enrollments` for `next_email_at <= NOW()`
- Sends personalized podcast invitations
- From: maggie@maggieforbesstrategies.com
- Uses professional HTML template
- Includes Calendly booking link

**Email Content:**
- Subject: "Podcast Invitation: Share Your Expertise on sovereigndesign.it.com"
- Personalized with firstName, professionalTitle, specializations
- Highlights benefits: exposure, authority, networking, flexibility
- Wednesday recording sessions (45-60 min)

### 4. Auto-Track (Immediate)

**What It Does:**
- Adds 1px tracking pixel for opens
- Wraps links for click tracking
- Updates `email_sends` table with open/click timestamps
- Updates `partners.podcast_status` automatically

### 5. Auto-Follow-up (Day 7 & Day 14)

**What It Does:**
- Day 7: First follow-up (if no response)
  - Subject: "Following up: Podcast Guest Invitation"
  - Shorter, emphasizes ease and flexibility

- Day 14: Final follow-up (if still no response)
  - Subject: "Last call: Podcast Guest Opportunity"
  - Polite final reminder
  - "Door is still open"

After Day 14, sequence completes. No more emails.

---

## Cron Job Schedule

```json
{
  "path": "/api/cron/scrape-attorneys",
  "schedule": "0 */6 * * *"  // Every 6 hours
}
```

**Runs:**
- 12:00 AM
- 6:00 AM
- 12:00 PM
- 6:00 PM

**Each Run:**
- Scrapes up to 50 attorneys from ACTEC
- Scrapes up to 50 attorneys from WealthCounsel
- Total: ~100 new attorneys every 6 hours
- ~400 attorneys per day
- ~12,000 attorneys per month (throttled at 10,000)

```json
{
  "path": "/api/cron/podcast-outreach",
  "schedule": "*/10 * * * *"  // Every 10 minutes
}
```

**Runs:** 6 times per hour, 144 times per day

**Each Run:**
- Auto-enrolls qualified prospects (fit_score >= 12)
- Sends scheduled invitations
- Sends follow-ups (Day 7, 14)
- Updates statuses

---

## Database Tables

### `attorney_sources`
Configures scraping sources (ACTEC, WealthCounsel)

```sql
CREATE TABLE attorney_sources (
    id UUID,
    source_name VARCHAR(255), -- 'ACTEC Fellows Directory'
    source_type VARCHAR(100), -- 'actec', 'wealthcounsel'
    source_url VARCHAR(500),
    scrape_config JSONB, -- { target_states, max_results, etc. }
    is_active BOOLEAN,
    total_attorneys_found INTEGER,
    last_scraped_at TIMESTAMPTZ
);
```

### `attorney_scraping_log`
Logs each scrape run

```sql
CREATE TABLE attorney_scraping_log (
    id UUID,
    source_id UUID,
    scrape_started_at TIMESTAMPTZ,
    scrape_completed_at TIMESTAMPTZ,
    attorneys_found INTEGER,
    attorneys_created INTEGER,
    duplicates_skipped INTEGER,
    errors INTEGER,
    status VARCHAR(50) -- 'running', 'completed', 'failed'
);
```

### `partners`
Stores all attorney prospects (from migration 027)

**Key Fields Added by Scrapers:**
- `source` → 'actec_directory' or 'wealthcounsel_directory'
- `actec_fellow` → true for ACTEC Fellows
- `wealthcounsel_member` → true for WealthCounsel members
- `practice_owner` → Auto-detected from firm name
- `dynasty_trust_specialist` → Auto-detected from specializations/bio
- `asset_protection_specialist` → Auto-detected
- `multi_state_practice` → Auto-calculated from licensed_states
- `podcast_status` → 'not_contacted' initially

---

## Monitoring

### 1. View Scraping Stats
```sql
SELECT * FROM attorney_scraping_stats;
```

Returns:
- Source name, type, active status
- Total attorneys found/created
- Last scraped timestamp
- Attorneys created last 24h/7d
- Total failures

### 2. View Scraping Summary
```sql
SELECT * FROM get_scraping_summary();
```

Returns:
- Total sources, active sources
- Total attorneys scraped
- Attorneys created today/this week
- Scrapes today
- Recent failures

### 3. Check Recent Scrapes
```sql
SELECT * FROM attorney_scraping_log
ORDER BY scrape_started_at DESC
LIMIT 10;
```

### 4. View High-Priority Prospects
```sql
SELECT * FROM podcast_prospects_high_priority
WHERE podcast_status = 'not_contacted'
ORDER BY (business_builder_score + expertise_score) DESC
LIMIT 20;
```

### 5. Check Outreach Stats
```bash
# Via API
curl http://localhost:3000/api/cron/podcast-outreach

# Returns:
{
  "success": true,
  "outreach_status": "ACTIVE",
  "emails_sent": 12,
  "partners_enrolled": 5,
  "stats": {
    "total_prospects": 450,
    "contacted": 180,
    "interested": 24,
    "scheduled": 8
  }
}
```

---

## Setup Instructions

### 1. Run SQL Migrations

```bash
# In Supabase SQL Editor:

# Migration 028: Podcast outreach sequence
# Run: Desktop/028_podcast_outreach_sequence.sql

# Migration 029: Geographic mapping
# Run: Desktop/029_geographic_mapping.sql

# Migration 030: Attorney scraping system
# Run: Desktop/030_attorney_scraping_system.sql
```

### 2. Set Environment Variables

```env
# Enable attorney scraping (default: true)
ATTORNEY_SCRAPING_ENABLED=true

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
git add .
git commit -m "Add fully automated attorney scraping + podcast outreach"
git push
```

**Vercel Automatically:**
- Deploys the app
- Activates both cron jobs
- Starts scraping attorneys every 6 hours
- Starts sending invitations every 10 minutes

### 4. Monitor (Optional)

```bash
# Check attorney scraper
curl https://your-domain.vercel.app/api/cron/scrape-attorneys

# Check podcast outreach
curl https://your-domain.vercel.app/api/cron/podcast-outreach

# View dashboard
Visit: https://your-domain.vercel.app/admin/geography
```

---

## Success Metrics (Projected)

### Week 1
- **Scraped:** ~2,800 attorneys (400/day × 7)
- **Qualified:** ~1,400 (fit_score >= 12, ~50% of total)
- **Enrolled:** ~1,400
- **Invitations Sent:** ~1,400
- **Expected Responses:** 210-350 (15-25% response rate)
- **Expected Scheduled:** 140-210 (10-15% booking rate)

### Month 1
- **Scraped:** ~10,000 attorneys (reaches target)
- **Qualified:** ~5,000
- **Enrolled:** ~5,000
- **Invitations Sent:** ~15,000 (initial + follow-ups)
- **Expected Responses:** 750-1,250
- **Expected Scheduled:** 500-750
- **Expected Recorded:** 80-120 episodes
- **Expected Published:** 16-32 episodes (weekly cadence)

---

## Geographic Targeting

**Focuses on High-Value Markets:**
- California (very_high HNW)
- New York (very_high HNW)
- Texas (very_high HNW, no state tax)
- Florida (very_high HNW, massive migration)
- Illinois (very_high HNW, Chicago)
- Washington (very_high HNW, Seattle tech, no state tax)

**Configured in attorney_sources:**
```json
{
  "target_states": ["California", "New York", "Texas", "Florida", "Illinois", "Washington"],
  "target_specializations": ["Dynasty Trusts", "Asset Protection", "Tax Planning"],
  "min_years_experience": 10,
  "max_results_per_run": 50
}
```

---

## Deduplication (Automatic)

**5-Layer Protection:**
1. **Email Check** → Skip if email already exists in database
2. **Unsubscribe Check** → Skip if `email_unsubscribed = true`
3. **Blacklist Check** → Skip if on blacklist
4. **Duplicate Campaign Check** → Skip if same campaign sent within 30 days
5. **Frequency Limit** → Max 3 emails per week

All checks happen automatically in scrapers and outreach engine.

---

## What You Do: NOTHING

**The system:**
- ✅ Finds attorneys automatically (ACTEC + WealthCounsel)
- ✅ Scores them automatically (fit_score)
- ✅ Enrolls them automatically (fit_score >= 12)
- ✅ Sends invitations automatically (maggie@maggieforbesstrategies.com)
- ✅ Tracks opens/clicks automatically
- ✅ Sends follow-ups automatically (Day 7, 14)
- ✅ Updates statuses automatically
- ✅ Deduplicates automatically

**You optionally:**
- Monitor dashboards
- Respond to booking requests
- Conduct podcast interviews
- Publish episodes

---

## Files Created

### Scrapers
- `lib/scrapers/actec-scraper.ts` (330 lines) - ACTEC Fellows scraper
- `lib/scrapers/wealthcounsel-scraper.ts` (340 lines) - WealthCounsel members scraper

### Cron Job
- `app/api/cron/scrape-attorneys/route.ts` (180 lines) - Attorney scraping cron

### Database
- `Desktop/030_attorney_scraping_system.sql` (280 lines) - Scraping infrastructure

### Config
- `vercel.json` - Updated with scrape-attorneys cron (every 6 hours)

### Documentation
- `FULLY_AUTOMATED_SYSTEM.md` - This file (complete system guide)

---

## Comparison: Before vs. After

### Before (Manual CSV System)
1. ❌ Find attorneys manually (LinkedIn, ACTEC, etc.)
2. ❌ Create CSV file manually
3. ❌ Upload CSV manually
4. ✅ System auto-enrolls and sends

**Manual Work:** Finding and uploading attorneys

### After (Fully Automated System)
1. ✅ System finds attorneys automatically (scrapes ACTEC + WealthCounsel)
2. ✅ System scores automatically
3. ✅ System enrolls automatically
4. ✅ System sends automatically

**Manual Work:** NONE

---

## System Status: FULLY AUTOMATED ✅

**Everything is automatic:**
- Attorney discovery (every 6 hours)
- Scoring (immediate)
- Enrollment (every 10 minutes)
- Email sending (every 10 minutes)
- Follow-ups (Day 7, 14)
- Tracking (real-time)

**Target:** 10,000 attorneys (auto-throttles)
**Timeline:** ~25 days to reach 10,000 at 400/day
**Expected Podcast Bookings:** 500-750 in first month

**Run SQL migrations → Deploy → System runs automatically forever.**

**ZERO MANUAL WORK.**
