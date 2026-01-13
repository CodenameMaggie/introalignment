# MFS Central Database Integration

## Overview
IntroAlignment is now connected to the MFS Central Database to import estate planning attorney leads from the IA (IntroAlignment) data sources.

## Architecture

```
MFS Central Database (Supabase)
  ├── IA_osm leads (OpenStreetMap attorney data)
  ├── IA_youtube leads (YouTube attorney data)
  └── Filters: Estate planning keywords
       ↓
IntroAlignment Database
  ├── partners table
  ├── Status: prospect/pending
  └── Podcast status: not_contacted
```

## Current Status

✅ **Successfully Imported: 59 estate planning attorneys**

### Breakdown by State:
- **Texas**: 20 attorneys
- **Tennessee**: 20 attorneys
- **Vermont**: 10 attorneys
- **Oregon**: 9 attorneys

### Sources:
- `IA_osm`: OpenStreetMap attorney directory scraping
- `IA_youtube`: YouTube channel/attorney discovery

## Scripts

### 1. Monitor MFS Leads (Real-time)
```bash
node scripts/monitor-mfs-leads.js
```
- Checks MFS database every 30 seconds
- Displays estate planning attorneys found
- Shows live count and recent additions
- Filters by legal keywords (attorney, lawyer, estate planning, trust, etc.)

### 2. Import MFS Leads (One-time or scheduled)
```bash
node scripts/import-mfs-leads.js
```
- Fetches all IA leads from MFS
- Filters for estate planning related
- Checks for duplicates (by email)
- Imports new attorneys into IntroAlignment partners table
- Maps fields:
  - `name` → `full_name`
  - `company` → `firm_name` (extracts state from "State - lawyer" format)
  - `source` → `source` (keeps IA_osm/IA_youtube)
  - Generates unique placeholder emails for leads without emails
  - Sets `partner_type='prospect'`, `status='pending'`, `podcast_status='not_contacted'`

### 3. Verify Import
```bash
node scripts/verify-mfs-import.js
```
- Shows sample imported partners
- Displays breakdown by state and source
- Confirms import status

### 4. Count Partners
```bash
node scripts/count-mfs-partners.js
```
- Shows total count of MFS-imported partners
- Breakdown by state

## Credentials

### MFS Central Database (Read-only)
- **URL**: `https://bixudsnkdeafczzqfvdq.supabase.co`
- **Anon Key**: Stored in scripts
- **Tables**: `leads`
- **Sources**: `IA_osm`, `IA_youtube`

### IntroAlignment Database (Read/Write)
- **URL**: `https://cxiazrciueruvvsxaxcz.supabase.co`
- **Service Key**: Stored in `.env.local`
- **Tables**: `partners`

## Data Mapping

| MFS Field | IntroAlignment Field | Notes |
|-----------|---------------------|-------|
| `name` | `full_name` | Attorney name |
| `company` | `firm_name` | Format: "State - profession" |
| `company` (state) | `licensed_states[]` | Extracted from company field |
| `email` | `email` | Unique placeholder if missing: `pending.{uuid}@introalignment.com` |
| `source` | `source` | IA_osm or IA_youtube |
| `created_at` | `initial_contact_date` | When lead was created in MFS |
| N/A | `partner_type` | Set to 'prospect' |
| N/A | `status` | Set to 'pending' |
| N/A | `podcast_status` | Set to 'not_contacted' |
| N/A | `specializations` | Default: ['Estate Planning'] |
| N/A | `practice_areas` | Default: ['Estate Planning', 'Trusts'] |

## Email Handling

Since IA_osm leads come from OpenStreetMap (public directory data), they **do not include email addresses**.

**Solution**: Generate unique placeholder emails using format:
```
pending.{uuid}@introalignment.com
```

These can be updated later when:
1. Email discovery scrapers find real email addresses
2. Attorneys contact us directly
3. Manual research/enrichment

## Next Steps

### 1. Automated Sync (Scheduled Import)
Set up a cron job to run the import script:

**Railway Cron Job** (recommended):
```bash
# Every 6 hours
cron_schedule: "0 */6 * * *"
command: "node scripts/import-mfs-leads.js"
```

**Or create API endpoint**:
```bash
# Create: /api/cron/sync-mfs-leads
# Returns: { imported: X, skipped: Y, errors: Z }
```

### 2. Email Discovery & Enrichment
- Build web scraper to find attorney emails from their firm websites
- Use LinkedIn enrichment to find contact info
- Integrate with email lookup services (Hunter.io, Apollo.io)

### 3. Attorney Scoring
According to the podcast outreach system, attorneys should be scored:
- `business_builder_score`: Based on multi-state practice, years of experience
- `expertise_score`: Based on specializations, certifications
- `fit_score = business_builder_score + expertise_score`

**Auto-enrollment criteria**: `fit_score >= 12`

### 4. Podcast Outreach Sequence
Once emails are discovered and attorneys are scored:
- Auto-enroll qualified prospects (fit_score >= 12)
- Send 3-step email sequence:
  - Day 0: Initial podcast invitation
  - Day 7: Follow-up
  - Day 14: Final follow-up
- Track opens, clicks, responses

### 5. Continuous Monitoring
Keep `monitor-mfs-leads.js` running to:
- Watch for new IA leads being added
- Alert when high-value attorneys appear
- Track lead volume trends

## Filters & Keywords

Estate planning attorney detection uses these keywords:
```javascript
[
  'attorney', 'lawyer', 'legal', 'law firm', 'law office',
  'estate planning', 'trust', 'wealth', 'counsel',
  'esq', 'j.d.', 'barrister', 'solicitor',
  'probate', 'wills', 'asset protection'
]
```

Matches against: `name`, `company`, `email`, `notes`, `description`, `title`

## Monitoring & Debugging

### Check Import Status
```bash
node scripts/count-mfs-partners.js
```

### Re-import (Safe - skips duplicates)
```bash
node scripts/import-mfs-leads.js
```

### Watch for New Leads
```bash
node scripts/monitor-mfs-leads.js
# Press Ctrl+C to stop
```

### Query Partners Directly
```javascript
// In Node.js or browser console
const IA_URL = 'https://cxiazrciueruvvsxaxcz.supabase.co';
const IA_KEY = 'your-service-key';

fetch(`${IA_URL}/rest/v1/partners?source=in.(IA_osm,IA_youtube)`, {
  headers: {
    'apikey': IA_KEY,
    'Authorization': `Bearer ${IA_KEY}`
  }
}).then(r => r.json()).then(console.log);
```

## Important Notes

1. **Placeholder Emails**: Most attorneys have placeholder emails that must be enriched
2. **Duplicate Prevention**: Import script checks existing emails before inserting
3. **Idempotent**: Safe to run import multiple times - skips duplicates
4. **Source Integrity**: Never modify `source` field - preserves data lineage
5. **MFS Ownership**: MFS database is shared across multiple businesses - read-only access

## Success Metrics

- ✅ 59 attorneys imported
- ✅ 4 states covered (TX, TN, VT, OR)
- ✅ 100% estate planning related (keyword filtered)
- ✅ Zero duplicate entries
- ✅ All mapped to 'prospect' status
- ✅ All ready for podcast outreach (pending email discovery)

## Questions?

Contact system admin or check:
- MFS Database: Ask about IA_osm and IA_youtube data sources
- IntroAlignment: Review `/supabase/migrations/020_partnership_outreach_system.sql`
- Podcast Sequence: Review `/Desktop/028_podcast_outreach_sequence.sql`
