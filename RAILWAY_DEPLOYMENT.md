# IntroAlignment - Railway Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    INTROALIGNMENT                           │
│              Romantic Matchmaking Platform                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Vercel          │         │  Railway         │
│  (Frontend)      │◄────────┤  (Backend)       │
│  - Next.js App   │   API   │  - Next.js API   │
│  - Static Pages  │  Calls  │  - 6 AI Bots     │
│  - User Auth     │         │  - Cron Jobs     │
└────────┬─────────┘         └────────┬─────────┘
         │                             │
         │                             │
         └──────────┬──────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│           DATABASES                          │
├──────────────────┬───────────────────────────┤
│  Railway         │  Supabase                 │
│  PostgreSQL      │  (Auth + Features)        │
│  - Bot data      │  - User auth              │
│  - Matches       │  - RLS policies           │
│  - Messages      │  - Real-time subs         │
│  - Cron logs     │  - Storage                │
└──────────────────┴───────────────────────────┘
```

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **Supabase Project**: Create at https://supabase.com
3. **Anthropic API Key**: Get from https://console.anthropic.com
4. **Resend Account**: Sign up at https://resend.com

## Step 1: Railway PostgreSQL Setup

### 1.1 Create PostgreSQL Database

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Click on your `introalignment` project
3. Click **"New Service"** → **"Database"** → **"PostgreSQL"**
4. Railway will provision: `ghcr.io/railwayapp-templates/postgres-ssl:17`

### 1.2 Get Database Connection String

Once PostgreSQL is created:
1. Click on the PostgreSQL service
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL` (starts with `postgresql://`)

Example:
```
postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway
```

### 1.3 Run Database Migrations

Option A - Via Railway PostgreSQL Dashboard:
1. Click on PostgreSQL service → **"Query"** tab
2. Copy contents from each migration file in order:
   - `/Users/Kristi/Desktop/▶️ RUN_FIRST_040_bot_system.sql`
   - `/Users/Kristi/Desktop/▶️ RUN_SECOND_041_governance.sql`
3. Paste and execute each file

Option B - Via CLI (if you have psql installed):
```bash
# Set your Railway DATABASE_URL
export DATABASE_URL="postgresql://postgres:password@..."

# Run migrations
psql $DATABASE_URL < /Users/Kristi/Desktop/▶️\ RUN_FIRST_040_bot_system.sql
psql $DATABASE_URL < /Users/Kristi/Desktop/▶️\ RUN_SECOND_041_governance.sql
```

### 1.4 Verify Database Setup

Run this query in Railway PostgreSQL dashboard:

```sql
-- Check bot health table exists
SELECT * FROM ai_bot_health LIMIT 5;

-- Check governance rules
SELECT rule_name, bot_name, action_type FROM ai_governance_rules LIMIT 10;

-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- `ai_bot_health`
- `ai_conversations`
- `ai_action_log`
- `ai_governance_rules`
- `ai_kill_switch`
- `support_tickets`
- `user_onboarding`
- `user_reports`
- `safety_violations`
- `privacy_requests`
- `user_blocks`
- `email_tracking`

## Step 2: Environment Variables

### 2.1 Set Railway Variables

Go to Railway → Your Service → **"Variables"** tab

#### **Railway PostgreSQL** (Auto-configured)
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### **Supabase** (Copy from Supabase Dashboard)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://cxiazrciueruvvsxaxcz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **AI & Email Services**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
RESEND_API_KEY=re_...
```

#### **Cron Security**
```bash
# Generate with: openssl rand -hex 32
CRON_SECRET=a1b2c3d4e5f6...
```

#### **Application Config**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://introalignment.railway.app
PORT=3000
```

### 2.2 Reference Variables Between Services

Railway allows referencing variables from other services:

```bash
# Reference PostgreSQL from your web service
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

This automatically connects your Next.js app to the Railway PostgreSQL database.

## Step 3: Cron Job Configuration

Railway doesn't have built-in cron scheduling, so we'll use **Railway's HTTP endpoints + External Cron Service**.

### Option A: Use Cron-Job.org (Free)

1. Go to https://cron-job.org/en/
2. Create account and add jobs:

**Job 1: Generate Matches (Every 6 hours)**
```
URL: https://introalignment.railway.app/api/cron/generate-matches
Method: POST
Schedule: 0 */6 * * *
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
```

**Job 2: User Outreach (Weekdays 9am-5pm)**
```
URL: https://introalignment.railway.app/api/cron/outreach
Method: POST
Schedule: 0 9-17 * * 1-5
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
```

**Job 3: Compatibility Scoring (Every 3 hours)**
```
URL: https://introalignment.railway.app/api/cron/score
Method: POST
Schedule: 0 */3 * * *
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
```

**Job 4: Profile Scraper (Every 12 hours)** - DISABLED BY DEFAULT
```
URL: https://introalignment.railway.app/api/cron/scrape
Method: POST
Schedule: 0 */12 * * *
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
Status: Disabled (enable when needed)
```

### Option B: Use GitHub Actions

Create `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs

on:
  schedule:
    # Generate matches every 6 hours
    - cron: '0 */6 * * *'
    # User outreach (weekdays 9am-5pm ET)
    - cron: '0 14-22 * * 1-5'
    # Compatibility scoring every 3 hours
    - cron: '0 */3 * * *'

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Matches
        if: github.event.schedule == '0 */6 * * *'
        run: |
          curl -X POST https://introalignment.railway.app/api/cron/generate-matches \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"

      - name: User Outreach
        if: github.event.schedule == '0 14-22 * * 1-5'
        run: |
          curl -X POST https://introalignment.railway.app/api/cron/outreach \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"

      - name: Compatibility Scoring
        if: github.event.schedule == '0 */3 * * *'
        run: |
          curl -X POST https://introalignment.railway.app/api/cron/score \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

## Step 4: Deploy to Railway

### 4.1 Connect GitHub Repository

1. Go to Railway Dashboard → Your Project
2. Click **"New Service"** → **"GitHub Repo"**
3. Select `introalignment` repository
4. Railway will auto-detect Next.js and deploy

### 4.2 Configure Build Settings (if needed)

Railway auto-detects from `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health"
  }
}
```

### 4.3 Monitor Deployment

1. Watch the deployment logs in Railway dashboard
2. Look for:
   - ✅ Dependencies installed
   - ✅ Next.js build successful
   - ✅ Server started on port 3000
   - ✅ Database connection established

### 4.4 Verify Deployment

```bash
# Test health endpoint
curl https://introalignment.railway.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-05T...",
  "database": "connected",
  "bots": {
    "active": 6,
    "total": 6
  },
  "deployment": "railway"
}
```

## Step 5: Test the Bot System

### 5.1 Test Bot Health Endpoints

```bash
# Test all bots
curl https://introalignment.railway.app/api/bots/status
curl https://introalignment.railway.app/api/bots/atlas
curl https://introalignment.railway.app/api/bots/annie
curl https://introalignment.railway.app/api/bots/henry
curl https://introalignment.railway.app/api/bots/dave
curl https://introalignment.railway.app/api/bots/dan
curl https://introalignment.railway.app/api/bots/jordan
```

### 5.2 Test Cron Jobs Manually

```bash
# Generate matches (requires authentication)
curl -X POST https://introalignment.railway.app/api/cron/generate-matches \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# User outreach
curl -X POST https://introalignment.railway.app/api/cron/outreach \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Compatibility scoring
curl -X POST https://introalignment.railway.app/api/cron/score \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 5.3 Monitor Bot Activity

Check Railway PostgreSQL dashboard:

```sql
-- Recent bot actions
SELECT
  bot_name,
  action_type,
  status,
  created_at
FROM ai_action_log
ORDER BY created_at DESC
LIMIT 20;

-- Bot health status
SELECT * FROM ai_bot_health;

-- Cron job history (if logging to database)
SELECT * FROM ai_action_log
WHERE action_type LIKE 'cron_%'
ORDER BY created_at DESC
LIMIT 10;
```

## Step 6: Connect Vercel Frontend

### 6.1 Deploy Frontend to Vercel

```bash
cd /Users/Kristi/introalignment
vercel --prod
```

### 6.2 Set Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

```bash
# Supabase (same as Railway)
NEXT_PUBLIC_SUPABASE_URL=https://cxiazrciueruvvsxaxcz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Point API calls to Railway backend
NEXT_PUBLIC_API_URL=https://introalignment.railway.app

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-...
RESEND_API_KEY=re_...

# App config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://introalignment.vercel.app
```

## Cron Job Schedule Reference

```
┌─────────── minute (0-59)
│ ┌───────── hour (0-23)
│ │ ┌─────── day of month (1-31)
│ │ │ ┌───── month (1-12)
│ │ │ │ ┌─── day of week (0-6, 0=Sunday)
│ │ │ │ │
* * * * *
```

### IntroAlignment Cron Schedule:

| Job | Schedule | Cron Expression | Description |
|-----|----------|----------------|-------------|
| **Generate Matches** | Every 6 hours | `0 */6 * * *` | Create new matches for users |
| **User Outreach** | Mon-Fri 9am-5pm | `0 9-17 * * 1-5` | Send introduction emails |
| **Compatibility Scoring** | Every 3 hours | `0 */3 * * *` | Update match scores |
| **Profile Scraper** | Every 12 hours | `0 */12 * * *` | Update user data (disabled by default) |

## Monitoring & Maintenance

### Check Railway Logs

```bash
railway logs --service introalignment-web
```

Look for:
- ✅ Cron job executions
- ✅ Bot activity
- ✅ Database queries
- ❌ Errors or warnings

### Database Health

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

## Troubleshooting

### Issue: Database connection failed
**Solution:**
1. Check DATABASE_URL is set correctly in Railway
2. Verify PostgreSQL service is running
3. Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

### Issue: Cron jobs not running
**Solution:**
1. Verify CRON_SECRET matches between cron service and Railway
2. Check cron endpoint is accessible: `curl https://your-app.railway.app/api/health`
3. Review Railway logs for auth errors

### Issue: Bot endpoints return 401
**Solution:**
1. Check Supabase auth is configured
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Test with authenticated request

### Issue: Build fails on Railway
**Solution:**
1. Check `railway.json` configuration
2. Verify all dependencies in `package.json`
3. Check Node.js version compatibility
4. Review build logs for specific errors

## Security Checklist

- [ ] CRON_SECRET is securely generated (32+ characters)
- [ ] Database credentials are never committed to git
- [ ] SUPABASE_SERVICE_ROLE_KEY is kept private
- [ ] RLS policies are enabled on all tables
- [ ] Bot governance rules are configured
- [ ] Kill switch is tested and working
- [ ] Rate limiting is enabled on cron endpoints

## Cost Estimation

**Railway (with PostgreSQL):**
- Free tier: $5 credit/month
- PostgreSQL: ~$5-10/month
- Web service: ~$10-20/month (based on usage)

**Supabase:**
- Free tier includes:
  - 500MB database
  - 50,000 monthly active users
  - Unlimited API requests

**Anthropic Claude API:**
- Pay-per-use
- ~$0.01-0.10 per match generation (depending on AI report complexity)

**Total estimated cost:** $20-40/month for low-traffic production deployment

## Next Steps

1. ✅ Railway PostgreSQL deployed
2. ✅ Environment variables configured
3. ✅ Cron jobs scheduled
4. ✅ Bot system tested
5. ⏭️ Set up custom domain
6. ⏭️ Configure SSL/TLS
7. ⏭️ Set up monitoring alerts
8. ⏭️ Create admin dashboard

## Support

- Railway docs: https://docs.railway.app
- Supabase docs: https://supabase.com/docs
- IntroAlignment issues: Check `BOT_SYSTEM_TEST_REPORT.md`

---

**Your IntroAlignment bot system is ready for production!** 🚀
