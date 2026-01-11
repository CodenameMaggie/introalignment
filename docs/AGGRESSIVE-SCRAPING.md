# Aggressive Lead Scraping - Path to 100K

SovereigntyIntroAlignment is configured for aggressive lead acquisition until reaching 100,000 leads.

## Current Configuration

### Scraping Frequency: **Every 30 Minutes**

**Previous:** Every 6 hours (4 runs/day = ~200-400 leads/day)
**Now:** Every 30 minutes (48 runs/day = ~2,400-4,800 leads/day)

**Estimated Timeline to 100K:**
- Conservative (50 leads/run): **~42 days**
- Moderate (75 leads/run): **~28 days**
- Aggressive (100 leads/run): **~21 days**

### Enhanced Pipeline Frequency

All pipeline stages optimized for high throughput:

```
Every 30 mins: /api/cron/scrape    (lead discovery)
Every 15 mins: /api/cron/score     (2x faster qualification)
Every 30 mins: /api/cron/enrich    (email generation)
Every 30 mins: /api/cron/outreach  (invitation emails)
```

## Auto-Throttling System

### When Does It Stop?

The scraper **automatically throttles** when:
- Total leads in database >= 100,000
- Returns `{ throttled: true }` response
- Logs: "Lead target reached - Throttling scraper"

### How to Check Progress

```bash
# Check current progress
curl http://localhost:3000/api/cron/scrape

# Expected response
{
  "success": true,
  "results": [...],
  "totalLeads": 12543,
  "target": 100000,
  "progress": "12543/100000 (13%)"
}
```

### When Throttled

```json
{
  "success": true,
  "message": "Lead target reached (100000/100000)",
  "throttled": true,
  "results": []
}
```

## Expected Volume

### Daily Lead Acquisition

**At 48 runs per day:**

| Leads/Run | Daily Total | Weekly Total | Days to 100K |
|-----------|-------------|--------------|--------------|
| 30 leads  | 1,440       | 10,080       | 69 days      |
| 50 leads  | 2,400       | 16,800       | 42 days      |
| 75 leads  | 3,600       | 25,200       | 28 days      |
| 100 leads | 4,800       | 33,600       | 21 days      |

**Most Likely:** 50-75 leads per run = **~28-42 days to 100K**

### Source Coverage

Currently scraping 15+ Reddit subreddits:
- r/dating
- r/datingoverthirty
- r/datingoverforty
- r/datingoverfifty
- r/R4R30Plus
- r/R4R40Plus
- r/ForeverAloneDating
- r/LongDistance
- r/relationship_advice
- r/AskWomenOver30
- r/AskMenOver30
- r/SingleParents
- r/OnlineDating
- r/singles
- r/dating_advice

## Lead Quality at Scale

### Automatic Filtering

Only qualified leads proceed through pipeline:
- **fit_score >= 40**: Gets enriched and contacted (estimated 40-50%)
- **fit_score < 40**: Stored but not contacted (estimated 50-60%)

**Expected Qualification Rate:**
- 100K total leads scraped
- ~45K qualified (fit_score >= 40)
- ~45K enriched with emails
- ~45K enrolled in outreach sequences
- ~45K invitation emails sent

### Quality Controls

1. **Deduplication**: Username + source prevents duplicate scraping
2. **Scoring Algorithm**: Multi-factor qualification (content, intent, demographics)
3. **Email Confidence**: Tracks email generation confidence (0.4-0.7)
4. **Engagement Tracking**: Opens, clicks, replies monitored

## Database Capacity

### Storage Estimates

**Per Lead Record:**
- Lead data: ~2KB
- Profile extraction: ~1KB
- Email sends: ~1KB per email

**100K Leads:**
- Lead table: ~200 MB
- Related data: ~300 MB
- **Total: ~500 MB** (well within Supabase limits)

### Index Performance

Current indexes support fast queries:
- `leads(fit_score)` - For qualification queries
- `leads(enrichment_status)` - For pipeline processing
- `leads(outreach_status)` - For enrollment queries
- `leads(username, source_identifier)` - For deduplication

Performance should remain strong up to 1M+ leads.

## Cost Considerations

### API Costs

**Forbes Command Center:**
- Email sending: Free (Port 25)
- No per-email costs

**Supabase:**
- Database: Free tier supports 500MB (sufficient)
- Bandwidth: Monitor if approaching limits

**Reddit API:**
- Currently using public endpoints (no auth)
- No rate limits on current implementation
- Consider Reddit API auth if throttled

### Estimated Costs at 100K Leads

**Monthly Costs:**
- Email sending: $0 (Forbes Command Center Port 25)
- Database: $0 (within free tier limits)
- Reddit scraping: $0 (public endpoints)
- **Total: $0/month** until growth requires paid tiers

## Monitoring Commands

### Real-Time Progress

```bash
# 1. Watch scraper progress (every 5 seconds)
watch -n 5 'curl -s http://localhost:3000/api/cron/scrape | python3 -m json.tool | head -20'

# 2. Check lead count
curl -s "http://localhost:3000/api/admin/leads" | python3 -c "import sys,json; print(f\"Total: {len(json.load(sys.stdin)['leads'])}\")"

# 3. Check pipeline stats
curl -s http://localhost:3000/api/health | python3 -m json.tool

# 4. Monitor email sending
curl -s http://localhost:3000/api/cron/outreach | python3 -m json.tool
```

### Database Queries

```sql
-- Total lead count
SELECT COUNT(*) FROM leads;

-- Qualified leads
SELECT COUNT(*) FROM leads WHERE fit_score >= 40;

-- Enriched leads
SELECT COUNT(*) FROM leads WHERE enrichment_status = 'enriched';

-- Enrolled in sequences
SELECT COUNT(*) FROM sequence_enrollments WHERE status = 'active';

-- Emails sent today
SELECT COUNT(*) FROM email_sends
WHERE sent_at >= CURRENT_DATE;
```

## What Happens at 100K?

### Automatic Actions

1. ✅ **Scraper throttles** - No more lead collection
2. ✅ **Scoring continues** - Processes any unscored leads
3. ✅ **Enrichment continues** - Completes pending enrichments
4. ✅ **Outreach continues** - Sends all scheduled emails
5. ✅ **Matching continues** - Generates matches for users

### Manual Review

Once at 100K leads:
- Review qualification criteria (adjust fit_score threshold?)
- Analyze email open/reply rates
- Assess conversion funnel performance
- Decide on next phase strategy

## Scaling Beyond 100K

### Option 1: Increase Target

Edit `app/api/cron/scrape/route.ts`:
```typescript
const LEAD_TARGET = 250000; // Increase to 250K
```

### Option 2: Add More Sources

- Expand to Facebook groups
- Add LinkedIn outreach
- Integrate Twitter/X leads
- Partner with dating blogs/podcasts

### Option 3: Focus on Conversion

- Pause scraping (keep throttled)
- Optimize outreach sequences
- A/B test email templates
- Improve lead-to-user conversion rate

## Success Metrics

### Key Targets

- **100K leads scraped**: Primary goal
- **45K qualified** (45%): Quality threshold
- **45K enriched**: Enrichment success
- **45K emails sent**: Outreach volume
- **2-5% reply rate**: 900-2,250 interested leads
- **0.5-1% conversion**: 450-900 new users

**If achieved:** Substantial user base for matching system to operate effectively.

## Risk Management

### Potential Issues

1. **Reddit Rate Limiting**
   - Mitigation: Spread requests across sources
   - Fallback: Implement exponential backoff

2. **Email Deliverability**
   - Mitigation: Forbes Command Center has DKIM
   - Monitor: Check bounce rates

3. **Database Performance**
   - Mitigation: Optimized indexes
   - Monitor: Query performance logs

4. **Lead Quality Degradation**
   - Mitigation: Scoring algorithm filters
   - Monitor: Qualification rate trends

## Timeline Projections

### Conservative (50 leads/30min)

- **Week 1**: 16,800 leads (17%)
- **Week 2**: 33,600 leads (34%)
- **Week 3**: 50,400 leads (50%)
- **Week 4**: 67,200 leads (67%)
- **Week 5**: 84,000 leads (84%)
- **Week 6**: 100,000 leads ✅ (100%)

### Aggressive (100 leads/30min)

- **Week 1**: 33,600 leads (34%)
- **Week 2**: 67,200 leads (67%)
- **Week 3**: 100,000 leads ✅ (100%)

**Most Realistic:** 4-6 weeks to reach 100K leads.

---

## 🚀 10X MODE ACTIVATED - SEE 10X-SCRAPING.md

This configuration has been **SUPERSEDED** by 10X mode:
- Target increased: 100K → **1 MILLION leads**
- Frequency: Every 30min → **Every 3 minutes**
- Sources: 15 → **75+ subreddits**
- Processing: Sequential → **Parallel**
- **Expected timeline: 1-3 days to 1M leads**

See [10X-SCRAPING.md](./10X-SCRAPING.md) for details.
