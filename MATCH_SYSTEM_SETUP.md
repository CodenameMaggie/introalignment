# Match Generation System - Setup for Real Clients

⚠️ **IMPORTANT: This system is built but DORMANT until you have real clients** ⚠️

## Current State (Safe - No Costs)

- ✅ Match generation system is fully built
- ✅ Database schema is ready
- ✅ API endpoints exist
- ✅ Frontend pages are built
- ❌ AI reports are DISABLED (placeholder reports only)
- ❌ NO automated cron jobs running
- ❌ NO costs being incurred

## How It Works Now (User-Triggered Only)

When a real client signs up and completes their profile:

1. **User clicks "Find My Matches" button** in the UI
2. Frontend calls `POST /api/matches/request` with their userId
3. System generates matches (free - just database queries)
4. System generates placeholder introduction reports (free - no AI)
5. User sees their matches immediately

**NO BACKGROUND JOBS. NO AUTOMATED PROCESSING. NO COSTS.**

## When You Have Real Paying Clients

### Step 1: Enable AI Reports (When Ready for Costs)

Set this environment variable in Vercel:
```bash
ENABLE_AI_REPORTS=true
```

This will:
- Enable Claude AI for generating personalized introduction reports
- Cost approximately $0.10-0.30 per match report (depending on length)
- Create beautiful, personalized narratives instead of placeholder text

### Step 2: Add "Find My Matches" Button to Dashboard

In your user dashboard, add a button that calls:

```typescript
async function findMatches() {
  const response = await fetch('/api/matches/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.id })
  });

  const data = await response.json();

  if (data.success) {
    // Redirect to /matches to see their new matches
    router.push('/matches');
  }
}
```

### Step 3: Optional - Set Up Weekly Match Generation (Later)

Only after you have many active users and want to automate:

1. Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-matches",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

2. Set CRON_SECRET environment variable in Vercel
3. This will run weekly match generation for ALL active users
4. **Only do this when you have enough users to justify automation**

## Environment Variables Needed

### Required (Free)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### Optional (When You Enable AI)
- `ENABLE_AI_REPORTS=true` - Enable Claude AI reports
- `ANTHROPIC_API_KEY` - Your Anthropic API key (only needed if ENABLE_AI_REPORTS=true)

### Optional (For Automated Cron)
- `CRON_SECRET` - Secret token for cron endpoint security

## Database Migration

Run this when you're ready to use the match system:

```sql
-- Run migration 012_match_generation_system.sql
-- Located in: supabase/migrations/012_match_generation_system.sql
```

## Testing Without Costs

You can test the entire system with placeholder reports:

1. Complete a user profile
2. Call `POST /api/matches/request` with userId
3. View matches at `/matches`
4. See placeholder reports (no AI costs)
5. Everything works, just without the fancy AI-generated narratives

## Summary

**Right now:**
- Match system is built and ready
- Zero costs, zero automation
- User-triggered only

**When you have clients:**
1. Add "Find Matches" button to dashboard
2. Enable AI reports when you're ready for costs
3. Much later: Add cron job for automation (optional)

The system will scale with your business - no wasted resources or premature automation.
