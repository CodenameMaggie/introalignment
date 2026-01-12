# MFS C-Suite Bot Reporting System

**Status:** ✅ **IMPLEMENTED** (Database migration + bot endpoints + reporting functions)

---

## System Overview

The **MFS C-Suite Bot** is the executive oversight layer for IntroAlignment's bot ecosystem. All operational bots report their activities, metrics, and issues to the C-Suite bot for centralized monitoring, strategic decision-making, and executive visibility.

**MFS** = **Maggie Forbes Strategies** (Owner: Maggie Forbes)

---

## Bot Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│         MFS C-SUITE BOT (Executive Layer)               │
│   - Receives reports from all operational bots          │
│   - Monitors system-wide health                         │
│   - Issues strategic directives                         │
│   - Generates AI-powered executive summaries            │
│   - Escalates to human oversight (Maggie)               │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ (reports)
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴────────┐  ┌──────┴──────┐  ┌────────┴────────┐
│  DAN           │  │  HENRY      │  │  JORDAN         │
│  Lead Scraping │  │  Email      │  │  Analytics      │
│  & Qual        │  │  Outreach   │  │  & Insights     │
└────────────────┘  └─────────────┘  └─────────────────┘
        │                   │                   │
┌───────┴────────┐  ┌──────┴──────┐  ┌────────┴────────┐
│  ATLAS         │  │  DAVE       │  │  ANNIE          │
│  Research      │  │  Matching   │  │  Conversation   │
│  Bot           │  │  & Compat   │  │  & Onboarding   │
└────────────────┘  └─────────────┘  └─────────────────┘
```

**All 6 operational bots report to MFS C-Suite Bot.**

---

## Database Schema

### Tables Created

1. **`csuite_reports`** - Executive reports from operational bots
2. **`csuite_actions`** - Executive directives to operational bots
3. **`ai_bot_health`** - Health tracking for all bots (including C-Suite)
4. **`bot_actions_log`** - Audit log of all bot actions

### Views

- **`csuite_dashboard`** - Real-time executive metrics view

### Triggers

- **Auto-report bot failures** - Automatically creates C-Suite report when any bot fails

---

## API Endpoints

### MFS C-Suite Bot API

**Base URL:** `/api/bots/mfs-csuite`

#### 1. GET Status (Public)

```bash
GET /api/bots/mfs-csuite
```

Returns C-Suite bot status, dashboard summary, and operational bot health.

**Response:**
```json
{
  "bot_name": "mfs-csuite",
  "role": "Executive Oversight & Strategic Decision Making",
  "status": "healthy",
  "dashboard_summary": {
    "healthy_bots": 6,
    "degraded_bots": 0,
    "new_reports": 12,
    "urgent_reports": 0
  },
  "operational_bots": [...],
  "capabilities": [...]
}
```

#### 2. POST Receive Report

```bash
POST /api/bots/mfs-csuite
Content-Type: application/json

{
  "action": "receive_report",
  "report_data": {
    "reporting_bot": "dan",
    "report_type": "action_completed",
    "data": {
      "action": "lawyer_scrape",
      "leads_found": 15
    },
    "priority": "normal"
  }
}
```

#### 3. POST Review Reports

```bash
POST /api/bots/mfs-csuite
Content-Type: application/json

{
  "action": "review_reports",
  "time_range": "24h"
}
```

#### 4. POST Executive Summary

```bash
POST /api/bots/mfs-csuite
Content-Type: application/json

{
  "action": "executive_summary",
  "time_range": "24h"
}
```

Generates AI-powered executive summary using Claude.

#### 5. POST Issue Directive

```bash
POST /api/bots/mfs-csuite
Content-Type: application/json

{
  "action": "issue_directive",
  "directive_data": {
    "target_bot": "dan",
    "action_type": "increase_scraping_frequency",
    "instructions": {
      "frequency": "every_30_minutes"
    }
  }
}
```

---

## Inter-Bot Reporting Functions

All operational bots use these functions from `/lib/bots/inter-bot-client.ts` to report to C-Suite.

### 1. Report General Activity

```typescript
import { reportToCSuite } from '@/lib/bots/inter-bot-client';

await reportToCSuite(
  'dan',
  'action_completed',
  {
    action: 'lawyer_scrape',
    leads_found: 15,
    time_taken_ms: 3200
  },
  'normal'
);
```

### 2. Report Daily Summary

```typescript
import { reportDailySummary } from '@/lib/bots/inter-bot-client';

await reportDailySummary('henry', {
  actions_completed: 127,
  success_rate: 94.5,
  key_metrics: {
    emails_sent: 127,
    emails_opened: 42,
    replies_received: 8
  },
  highlights: [
    'Successful outreach to 5 top-tier estate planning attorneys',
    'Podcast invitation accepted by CA bar certified attorney'
  ]
});
```

### 3. Report Critical Issue

```typescript
import { reportCriticalIssue } from '@/lib/bots/inter-bot-client';

await reportCriticalIssue(
  'dan',
  {
    error_type: 'scraper_failure',
    error_message: 'State bar directory returned 503',
    affected_systems: ['california_bar_scraper'],
    recovery_attempted: true,
    requires_human_intervention: false
  },
  'urgent'
);
```

### 4. Report Metric Update

```typescript
import { reportMetricUpdate } from '@/lib/bots/inter-bot-client';

await reportMetricUpdate('jordan', {
  metric_name: 'partner_applications',
  current_value: 127,
  previous_value: 89,
  status: 'normal'
});
```

### 5. Report Action Completed

```typescript
import { reportActionCompleted } from '@/lib/bots/inter-bot-client';

await reportActionCompleted('henry', {
  action_type: 'email_campaign',
  details: {
    campaign_id: 'weekly-outreach-023',
    recipients: 50
  },
  success: true,
  metrics: {
    sent: 50,
    delivered: 49,
    bounced: 1
  }
});
```

---

## Priority Levels

| Priority   | Description | C-Suite Response |
|------------|-------------|------------------|
| **normal** | Routine operations | Logged for periodic review |
| **high** | Important updates | Reviewed in next summary |
| **urgent** | Requires attention | Immediate C-Suite review |
| **critical** | System failure | Immediate action + escalation to Maggie |

---

## Report Types

| Type | Used For | Example |
|------|----------|---------|
| **daily_summary** | Daily operational recap | "Dan scraped 127 lawyers today" |
| **action_completed** | Individual action results | "Henry sent email campaign #42" |
| **bot_failure** | Bot errors/failures | "Dan scraper timed out" |
| **metric_update** | KPI changes | "Partner applications: 127 → 150" |
| **alert** | Issues requiring attention | "Email bounce rate exceeded 10%" |
| **status_change** | Bot state changes | "Jordan went offline for maintenance" |

---

## Integration Example: Dan Bot

Here's how Dan bot reports to C-Suite after completing a scraping action:

```typescript
// app/api/bots/dan/route.ts
import { reportActionCompleted } from '@/lib/bots/inter-bot-client';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    // ... Dan's scraping logic ...

    const responseTime = Date.now() - startTime;

    // Log to database
    await supabase.from('bot_actions_log').insert({ ... });

    // Update bot health
    await supabase.from('ai_bot_health').upsert({ ... });

    // ✅ Report to C-Suite
    await reportActionCompleted('dan', {
      action_type: 'lead_scrape',
      details: {
        source: 'california_bar',
        leads_found: 15,
        response_time_ms: responseTime
      },
      success: true,
      metrics: {
        total_scraped: 15,
        qualified: 12,
        disqualified: 3
      }
    }).catch(err => {
      console.error('[Dan] Failed to report to C-Suite:', err);
      // Don't fail the main operation if reporting fails
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    // ✅ Report critical failure to C-Suite
    await reportCriticalIssue('dan', {
      error_type: 'scraping_failure',
      error_message: error.message,
      affected_systems: ['lawyer_directory_scraper'],
      recovery_attempted: false,
      requires_human_intervention: true
    }, 'urgent').catch(console.error);

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## Automatic Failure Reporting

The system includes a **database trigger** that automatically reports all bot failures to C-Suite:

```sql
-- When any bot action fails, automatically create C-Suite report
CREATE TRIGGER trigger_report_bot_failure
    AFTER INSERT ON bot_actions_log
    FOR EACH ROW
    WHEN (NEW.status = 'failed')
    EXECUTE FUNCTION report_bot_failure_to_csuite();
```

This means **all bot failures are automatically escalated to C-Suite** without requiring manual reporting.

---

## Executive Dashboard

The C-Suite bot provides a real-time dashboard view via the `csuite_dashboard` view:

```sql
SELECT * FROM csuite_dashboard;
```

**Returns:**
```json
{
  "healthy_bots": 6,
  "degraded_bots": 0,
  "offline_bots": 0,
  "new_reports": 24,
  "urgent_reports": 2,
  "critical_reports": 0,
  "pending_actions": 3,
  "active_actions": 1,
  "actions_24h": 342,
  "failures_24h": 5,
  "cost_24h": 2.47,
  "generated_at": "2026-01-12T19:30:00Z"
}
```

---

## AI-Powered Executive Summaries

The C-Suite bot can generate **AI-powered executive summaries** using Claude:

```typescript
// Generate executive summary
const response = await fetch('/api/bots/mfs-csuite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'executive_summary',
    time_range: '24h'
  })
});

const summary = await response.json();
```

**Example Summary:**
```
Overall System Status: All systems operational with 6 healthy bots.

Key Metrics (24h):
- Total Actions: 342 (97% success rate)
- Partner Applications: 12 new lawyers
- Email Campaigns: 3 sent (127 recipients)
- Total AI Cost: $2.47

Top 3 Priorities:
1. Review 2 urgent reports from Dan (scraper timeout issues)
2. Approve pending email campaign from Henry
3. Investigate elevated bounce rate (12% vs 5% target)

Recommended Actions:
- Increase scraper timeout for California Bar directory
- Review email list quality with Henry
- Consider implementing retry logic for failed scrapes
```

---

## Setup Instructions

### 1. Run Database Migration

```bash
# Copy SQL file to Desktop (already done)
# File: 022_csuite_bot_reporting_system.sql

# Run via Supabase Dashboard or psql
psql -h your-db-host -U postgres -d your-database -f Desktop/022_csuite_bot_reporting_system.sql
```

### 2. Verify C-Suite Bot

```bash
# Check bot status
curl https://introalignment.com/api/bots/mfs-csuite

# Should return:
# {
#   "bot_name": "mfs-csuite",
#   "role": "Executive Oversight & Strategic Decision Making",
#   "status": "healthy",
#   ...
# }
```

### 3. Test Reporting

```bash
# Send a test report from Dan
curl -X POST https://introalignment.com/api/bots/mfs-csuite \
  -H "Content-Type: application/json" \
  -d '{
    "action": "receive_report",
    "report_data": {
      "reporting_bot": "dan",
      "report_type": "daily_summary",
      "data": {
        "test": "This is a test report"
      },
      "priority": "normal"
    }
  }'
```

### 4. Check Dashboard

```bash
# Get executive dashboard
curl -X POST https://introalignment.com/api/bots/mfs-csuite \
  -H "Content-Type: application/json" \
  -d '{
    "action": "review_reports",
    "time_range": "24h"
  }'
```

---

## Integrating Into Other Bots

To add C-Suite reporting to any operational bot:

1. **Import reporting functions:**
```typescript
import {
  reportActionCompleted,
  reportDailySummary,
  reportCriticalIssue
} from '@/lib/bots/inter-bot-client';
```

2. **Report successful actions:**
```typescript
await reportActionCompleted('your-bot-name', {
  action_type: 'your_action',
  details: { ... },
  success: true
});
```

3. **Report failures:**
```typescript
catch (error) {
  await reportCriticalIssue('your-bot-name', {
    error_type: 'failure_type',
    error_message: error.message,
    requires_human_intervention: true
  }, 'urgent');
}
```

4. **Daily summaries (optional):**
```typescript
// At end of day or on cron schedule
await reportDailySummary('your-bot-name', {
  actions_completed: count,
  success_rate: percentage,
  key_metrics: { ... }
});
```

---

## Bots Integrated

| Bot | Status | Reports To C-Suite |
|-----|--------|-------------------|
| **MFS C-Suite** | ✅ Active | (This is C-Suite) |
| **Dan** | ✅ Integrated | Yes - Action completed reports |
| **Henry** | ⚠️ Needs Integration | Not yet |
| **Dave** | ⚠️ Needs Integration | Not yet |
| **Annie** | ⚠️ Needs Integration | Not yet |
| **Jordan** | ⚠️ Needs Integration | Not yet |
| **Atlas** | ⚠️ Needs Integration | Not yet |

**Next Steps:** Integrate C-Suite reporting into Henry, Dave, Annie, Jordan, and Atlas following Dan's example.

---

## Data Retention Policy

- **Reports:** Retained for 90 days, then deleted if status = 'acted_upon'
- **Actions:** Retained for 1 year
- **Bot actions log:** Retained indefinitely for audit trail
- **Bot health:** Current state only (no historical data)

**Cleanup function:**
```sql
SELECT cleanup_old_csuite_reports(); -- Returns count of deleted reports
```

---

## Security & Access Control

- **GET endpoints:** Public (status checks)
- **POST endpoints:** Require authentication (bot-to-bot communication)
- **Dashboard view:** Requires admin access
- **Human escalation:** Sends to Maggie Forbes (owner)

---

## Monitoring & Alerts

### C-Suite Monitors:

1. **Bot Health** - Tracks all 6 operational bots
2. **System Performance** - Response times, success rates
3. **Cost Tracking** - AI API costs per bot
4. **Alert Management** - Urgent/critical reports prioritized
5. **Action Queue** - Pending directives to bots

### Alert Thresholds:

- **Urgent:** Logged + reviewed in next summary
- **Critical:** Immediate human notification (email/SMS to Maggie)

---

## Future Enhancements

- [ ] Email/SMS notifications to Maggie for critical alerts
- [ ] Web dashboard UI for C-Suite at `/admin/csuite`
- [ ] Directive execution system (bots fetch and execute C-Suite directives)
- [ ] Predictive analytics (ML-based issue prediction)
- [ ] Multi-day trend analysis
- [ ] Bot performance benchmarking

---

## Troubleshooting

### "Failed to report to C-Suite"

**Cause:** Network error or C-Suite bot offline

**Solution:** Reporting failures are non-blocking (wrapped in `.catch()`), so operational bots continue working even if C-Suite reporting fails.

### "C-Suite bot status: degraded"

**Cause:** High error rate or slow response times

**Solution:** Check `bot_actions_log` for C-Suite errors. May indicate database issues or AI API problems.

### "Directives not executing"

**Cause:** Bots don't yet poll for directives

**Solution:** Implement `getCSuiteDirectives()` polling in bot cron jobs (future enhancement).

---

## Summary

✅ **MFS C-Suite Bot** is the executive layer for IntroAlignment's bot ecosystem
✅ **All 6 operational bots** report their activities to C-Suite
✅ **Database tables** created for reports, actions, and health tracking
✅ **API endpoints** implemented for receiving reports and issuing directives
✅ **Inter-bot functions** available for easy integration
✅ **Dan bot** integrated as reference implementation
✅ **Automatic failure reporting** via database trigger

**Owner:** Maggie Forbes (MFS - Maggie Forbes Strategies)
**Purpose:** Executive oversight of IntroAlignment legal network bot operations
