# SovereigntyIntroAlignment - Railway Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] 6-bot AI system built and tested
- [x] All bot endpoints responding (`/api/bots/*`)
- [x] Database migrations created and tested
- [x] Railway configuration files created
- [x] Cron job schedules defined
- [x] Environment variable templates created
- [x] Health check endpoint implemented
- [x] Deployment documentation written

## 📋 Railway Deployment Steps

### Step 1: Railway PostgreSQL Setup

- [ ] Log in to Railway: https://railway.app/dashboard
- [ ] Open project: `introalignment`
- [ ] Add PostgreSQL service:
  - Click "New Service" → "Database" → "PostgreSQL"
  - Wait for provisioning (`ghcr.io/railwayapp-templates/postgres-ssl:17`)
- [ ] Copy DATABASE_URL from PostgreSQL service variables
- [ ] Run database migrations (see `RAILWAY_DEPLOYMENT.md` Step 1.3)

### Step 2: Environment Variables

- [ ] Go to Railway → Your Service → "Variables" tab
- [ ] Add these variables:

#### Required:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXT_PUBLIC_SUPABASE_URL=https://cxiazrciueruvvsxaxcz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-api03-your-key
RESEND_API_KEY=re_your-key
CRON_SECRET=generate-with-openssl-rand-hex-32
NODE_ENV=production
PORT=3000
```

#### Optional:
```bash
NEXT_PUBLIC_APP_URL=https://introalignment.railway.app
ADMIN_EMAIL=your-admin@example.com
```

### Step 3: Deploy Application

- [ ] Option A: Connect GitHub repo and push
- [ ] Option B: Use Railway CLI: `railway up`
- [ ] Monitor deployment logs
- [ ] Wait for "Deployment successful" message

### Step 4: Test Deployment

- [ ] Test health endpoint:
  ```bash
  curl https://introalignment.railway.app/api/health
  ```

- [ ] Test bot endpoints:
  ```bash
  curl https://introalignment.railway.app/api/bots/status
  curl https://introalignment.railway.app/api/bots/atlas
  curl https://introalignment.railway.app/api/bots/annie
  ```

- [ ] Verify all bots respond with JSON

### Step 5: Set Up Cron Jobs

Choose ONE option:

#### Option A: Cron-Job.org (Recommended - Free)
- [ ] Sign up at https://cron-job.org
- [ ] Add 4 cron jobs (see `RAILWAY_DEPLOYMENT.md` Step 3)
- [ ] Configure headers with CRON_SECRET
- [ ] Enable jobs

#### Option B: GitHub Actions
- [ ] Create `.github/workflows/cron.yml`
- [ ] Add CRON_SECRET to GitHub secrets
- [ ] Commit and push
- [ ] Verify workflows appear in Actions tab

### Step 6: Initialize Bot System

- [ ] Run SQL in Railway PostgreSQL:
  ```sql
  INSERT INTO ai_bot_health (bot_name, status) VALUES
    ('atlas', 'healthy'),
    ('annie', 'healthy'),
    ('henry', 'healthy'),
    ('dave', 'healthy'),
    ('dan', 'healthy'),
    ('jordan', 'healthy')
  ON CONFLICT (bot_name) DO NOTHING;
  ```

- [ ] Verify bot health:
  ```sql
  SELECT * FROM ai_bot_health;
  ```

### Step 7: Test Cron Jobs

- [ ] Manually trigger each cron job:
  ```bash
  curl -X POST https://introalignment.railway.app/api/cron/generate-matches \
    -H "Authorization: Bearer YOUR_CRON_SECRET" \
    -H "Content-Type: application/json"
  ```

- [ ] Check logs in Railway dashboard
- [ ] Verify bot actions logged in database:
  ```sql
  SELECT * FROM ai_action_log ORDER BY created_at DESC LIMIT 10;
  ```

### Step 8: Vercel Frontend (Optional)

If deploying frontend separately to Vercel:

- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Set environment variables (same as Railway)
- [ ] Add: `NEXT_PUBLIC_API_URL=https://introalignment.railway.app`
- [ ] Test frontend connects to Railway API

## 🔍 Verification Tests

### Database Connection
```bash
# Should return "healthy" and "connected"
curl https://introalignment.railway.app/api/health
```

Expected:
```json
{
  "status": "healthy",
  "database": "connected",
  "bots": {
    "active": 6,
    "total": 6
  }
}
```

### Bot System
```bash
# Should return bot dashboard
curl https://introalignment.railway.app/api/bots/status
```

Expected:
```json
{
  "systemHealth": "healthy",
  "metrics": {
    "healthyBots": 6
  }
}
```

### Authentication
```bash
# Should return 401 Unauthorized
curl -X POST https://introalignment.railway.app/api/bots/atlas \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

Expected:
```json
{"error": "Unauthorized"}
```

### Cron Jobs
```bash
# Should execute successfully (with valid CRON_SECRET)
curl -X POST https://introalignment.railway.app/api/cron/generate-matches \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected:
```json
{
  "success": true,
  "matches": {...},
  "reports": {...}
}
```

## 📊 Monitoring Setup

### Railway Logs
- [ ] Bookmark: https://railway.app/project/YOUR_PROJECT/logs
- [ ] Set up log filters for errors
- [ ] Enable email notifications for failures

### Database Monitoring
- [ ] Create saved queries in Railway PostgreSQL:
  - Bot health status
  - Recent bot actions
  - Failed cron jobs
  - Database size

### Uptime Monitoring (Optional)
- [ ] Set up UptimeRobot or Pingdom
- [ ] Monitor `/api/health` endpoint
- [ ] Alert on downtime

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection failed | Check DATABASE_URL in Railway variables |
| Bots return 401 | Verify Supabase credentials are set |
| Cron jobs not running | Check CRON_SECRET matches, test manually |
| Build fails | Review `railway.json`, check Node.js version |
| Health check fails | Check database migrations ran successfully |

## 📁 Deployment Files Created

All configuration files are in place:

- `railway.toml` - Railway configuration
- `railway.json` - Alternative Railway config
- `.railwayignore` - Files to exclude from deployment
- `Procfile` - Process definition
- `.env.railway.example` - Environment variable template
- `cron.config.json` - Cron job definitions
- `app/api/health/route.ts` - Health check endpoint
- `lib/database/client.ts` - Database client abstraction
- `RAILWAY_DEPLOYMENT.md` - Full deployment guide (20+ pages)
- `BOT_SYSTEM_TEST_REPORT.md` - System test results

## 🎯 Success Criteria

Deployment is complete when:

- [x] Railway PostgreSQL is provisioned
- [x] Environment variables are set
- [x] Application builds successfully
- [x] Health endpoint returns "healthy"
- [x] All 6 bot endpoints respond
- [x] Cron jobs are scheduled
- [x] Database migrations are run
- [x] Bot health records initialized
- [x] Manual cron test succeeds

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Cron Syntax**: https://crontab.guru
- **Project Docs**: See `RAILWAY_DEPLOYMENT.md`

## 🚀 Post-Deployment

After successful deployment:

1. **Monitor for 24 hours**
   - Check Railway logs hourly
   - Verify cron jobs execute on schedule
   - Monitor database growth

2. **Optimize as needed**
   - Adjust cron schedules based on load
   - Review bot action logs
   - Tune governance rules

3. **Set up alerts**
   - Railway deployment failures
   - Database connection errors
   - Cron job failures
   - Bot system health degradation

---

**Ready to deploy!** Follow the steps above in order. See `RAILWAY_DEPLOYMENT.md` for detailed instructions.
