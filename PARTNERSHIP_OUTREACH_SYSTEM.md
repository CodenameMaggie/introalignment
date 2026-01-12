# Partnership & Outreach System Documentation

## Overview

Complete system for recruiting lawyers, legal experts, and podcast guests to partner with IntroAlignment.

---

## Features

### 1. Partner Application Portal
**URL:** https://introalignment.com/partners

- **Professional application form** for lawyers and legal experts
- Collects:
  - Professional credentials (bar number, licenses, experience)
  - Specializations (Dynasty Trusts, Asset Protection, Tax Law, etc.)
  - Podcast interest and topics
  - Publications and speaking engagements
  - Partnership tier preferences

### 2. Admin Partner Management
**URL:** https://introalignment.com/admin/partners

- **Dashboard** showing partner pipeline metrics
- **Filtering** by status, type, podcast interest, specializations
- **Search** by name, email, title
- **Quick status updates** (Pending → Approved/Rejected)
- **Activity tracking** for each partner

### 3. Database Schema

#### Tables Created:

**`partners`** - Main partner/lawyer database
- Professional details, credentials, bar numbers
- Specializations, practice areas, certifications
- Partnership status and tier
- Podcast interest and topics
- Outreach tracking (source, dates, follow-ups)
- Compensation and contract details
- Full-text search capability

**`podcast_episodes`** - Podcast management
- Episode details and guest information
- Recording and publishing status
- Distribution URLs (YouTube, Spotify, Apple)
- Engagement metrics

**`outreach_campaigns`** - Email/outreach campaigns
- Campaign targeting and content
- Results tracking (sent, opened, clicked, responded)

**`outreach_messages`** - Individual messages sent
- Message details and status
- Response tracking
- Follow-up scheduling

**`lawyer_directories`** - Scraping sources
- Configuration for Avvo, Martindale, Super Lawyers, State Bars
- Scrape schedules and stats

**`partner_activities`** - Activity log
- All interactions with partners
- Calls, meetings, contracts, referrals

### 4. Lawyer Directory Scraper

**Initial directories configured:**
- State Bar of California
- State Bar of New York
- State Bar of Texas
- Delaware Bar Association
- Wyoming Bar
- Avvo - Estate Planning Attorneys
- Martindale-Hubbell - Tax Attorneys
- Super Lawyers - Estate Planning

**Scraper features:**
- Target specific specializations
- Filter by years of experience
- Multi-state targeting
- Duplicate detection
- Automatic prospect creation

---

## Usage

### For Site Visitors

1. **Apply as Partner:**
   - Visit https://introalignment.com/partners
   - Fill out comprehensive application
   - Indicate podcast interest
   - Submit for review

### For Admins

1. **Review Applications:**
   - Visit https://introalignment.com/admin/partners
   - View all applications with filtering
   - Approve/reject partners
   - View detailed profiles

2. **Launch Outreach Campaign:**
   ```
   1. Go to /admin/partners/outreach
   2. Define target criteria (specializations, states, experience)
   3. Customize email template
   4. Launch campaign
   5. Track responses
   ```

3. **Schedule Podcast Guests:**
   ```
   1. Filter partners by podcast_interest = true
   2. Review their podcast topics
   3. Schedule recording
   4. Track in podcast_episodes table
   ```

---

## API Endpoints

### Partner Application
```
POST /api/partners/apply
Body: {
  full_name, email, professional_title, specializations,
  years_experience, podcast_interest, ...
}
Returns: { success: true, partner_id }
```

### Admin - Get All Partners
```
GET /api/admin/partners
Returns: { partners: [...], total: N }
```

### Admin - Update Partner
```
POST /api/admin/partners/update
Body: { partner_id, status, partner_type, notes }
Returns: { success: true, partner }
```

---

## Email Outreach Templates

### Template 1: Initial Outreach (Cold)
```
Subject: Partnership Opportunity - IntroAlignment Legal Network

Hi [First Name],

I came across your profile while researching top [Specialization] attorneys
in [State], and I'm impressed by your experience in [Specific Area].

I'm reaching out from IntroAlignment, where we're building a network of
elite legal professionals specializing in dynasty trusts, asset protection,
and sophisticated estate structures for high-net-worth families.

We're looking for partners who:
- Have deep expertise in [Specialization]
- Work with high-net-worth clients
- Are interested in collaborative referral relationships

Would you be open to a brief call to discuss how we might collaborate?

Best regards,
[Your Name]
IntroAlignment
[Contact Info]
```

### Template 2: Podcast Invitation
```
Subject: Guest Invitation - sovereigndesign.it.com Podcast

Hi [First Name],

I've been following your work in [Area], particularly [Specific Achievement],
and I think your insights would be valuable for our audience.

We're hosting the sovereigndesign.it.com podcast, focused on legal architecture
for generational wealth. Our audience includes:
- High-net-worth individuals
- Family offices
- Other legal/financial professionals

Would you be interested in joining us for a 45-minute conversation about
[Topic]? We'll promote the episode across our network and provide full
video/audio distribution.

We book legal professionals and attorneys on Wednesdays. If you're interested,
you can schedule a Wednesday session here:
https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1

Looking forward to connecting!

Best,
[Your Name]
```

### Template 3: Follow-Up
```
Subject: Re: Partnership Opportunity

Hi [First Name],

Just wanted to follow up on my previous message about partnering with
IntroAlignment.

We've recently added [Number] attorneys to our network and have already
facilitated [Number] client referrals.

If you're interested in learning more, I'm happy to schedule a quick
15-minute call at your convenience.

Best,
[Your Name]
```

---

## Database Migration

**File:** `supabase/migrations/020_partnership_outreach_system.sql`

**To Apply:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/020_partnership_outreach_system.sql`
4. Run migration
5. Verify tables created successfully

---

## Outreach Strategy

### Phase 1: Target Identification (Week 1-2)
1. Run scrapers on lawyer directories
2. Filter for:
   - 10+ years experience
   - Estate planning/tax law specializations
   - Licensed in key states (CA, NY, TX, DE, WY)

### Phase 2: Initial Outreach (Week 3-4)
1. Send personalized emails to top 100 prospects
2. Track open rates and responses
3. Follow up with interested lawyers

### Phase 3: Qualification Calls (Week 5-6)
1. Schedule 15-min calls with respondents
2. Assess fit and interest
3. Move qualified lawyers to "interested" status

### Phase 4: Partnership Activation (Week 7-8)
1. Send partnership agreements to approved lawyers
2. Onboard active partners
3. Begin client referrals

### Phase 5: Podcast Production (Ongoing)
1. Schedule podcast recordings with interested partners
2. Produce and publish episodes
3. Use content for marketing and credibility

---

## Metrics to Track

### Partnership Pipeline
- Total prospects
- Contacted
- Responded
- Interested
- Active partners

### Podcast
- Episodes recorded
- Episodes published
- Average views/downloads
- Guest satisfaction

### Outreach Performance
- Email open rate (target: 30%+)
- Response rate (target: 10%+)
- Conversion rate (target: 5%+)

---

## Next Steps

1. ✅ Apply database migration
2. ⏳ Test partner application form at `/partners`
3. ⏳ Customize email templates for your brand
4. ⏳ Configure scraper schedules
5. ⏳ Launch first outreach campaign
6. ⏳ Schedule first podcast recordings

---

## Notes

- All lawyer data from directories is public information
- Outreach emails should comply with CAN-SPAM Act
- Follow-up cadence: Day 1, Day 3, Day 7 (max 3 touches)
- Always personalize outreach based on specialization
- Track all communication in `partner_activities` table

---

**System ready for lawyer recruitment and podcast guest outreach!** 🎯
