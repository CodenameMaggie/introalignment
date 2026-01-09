# Qualified Leads for Email Campaigns

This folder contains exported leads that are ready to be contacted via email.

## What makes a lead "qualified"?

- ✅ **Enriched**: Has a generated email address
- ✅ **Email confidence**: ≥ 0.4 (reasonable confidence)
- ✅ **Fit score**: ≥ 60 (high quality match)
- ✅ **Outreach status**: pending (not yet contacted)

## How to export qualified leads

### Method 1: API Endpoint (Recommended)
```bash
curl http://localhost:3000/api/admin/export-qualified-leads
```

### Method 2: Command Line Script
```bash
npx ts-node scripts/export-qualified-leads.ts
```

This will create:
- `qualified-leads-YYYY-MM-DDTHH-MM-SS.json` - Timestamped JSON export
- `qualified-leads-YYYY-MM-DDTHH-MM-SS.csv` - Timestamped CSV export
- `latest-qualified-leads.json` - Always points to most recent JSON
- `latest-qualified-leads.csv` - Always points to most recent CSV

## File format

### JSON Format
```json
[
  {
    "id": "uuid",
    "username": "reddit_user123",
    "email": "reddit_user123@gmail.com",
    "email_confidence": 0.7,
    "full_name": "John Doe",
    "fit_score": 85,
    "interests": ["dating", "relationships"],
    "relationship_goal": "long_term",
    "source_type": "reddit",
    "source_url": "https://reddit.com/r/dating/...",
    "trigger_content": "I'm looking for...",
    "created_at": "2026-01-09T..."
  }
]
```

### CSV Format
```
ID,Username,Email,Email Confidence,Full Name,Fit Score,Relationship Goal,Source,Created At
uuid,reddit_user123,reddit_user123@gmail.com,0.7,John Doe,85,long_term,reddit,2026-01-09T...
```

## Current stats

Check real-time stats:
```bash
curl http://localhost:3000/api/bots/jordan | jq '.system_metrics'
```

## Security

⚠️ **IMPORTANT**: This folder is gitignored to protect user privacy. Lead data should never be committed to version control.

## Email sending

Dan bot can read from these exports to send invitation emails via Forbes Command Center (Port 25 SMTP).

Current status: **OUTREACH_ENABLED=false** (3-day collection period)
