# Attorney Scraper - Deployment Status

## ✅ Completed

1. **Code Ready**:
   - ✅ `cron-scraper.js` - Standalone attorney scraper script
   - ✅ `Procfile` - Railway multi-process configuration (web + cron)
   - ✅ `railway.json` - Railway deployment settings
   - ✅ All dependencies in `package.json` (dotenv, cheerio, @supabase/supabase-js)
   - ✅ Landing page links updated to functional pages
   - ✅ Comprehensive documentation in `SCRAPER-SETUP.md`

2. **Git**:
   - ✅ All changes committed to main branch
   - ✅ Pushed to GitHub: https://github.com/CodenameMaggie/introalignment

3. **Database**:
   - ✅ 4 estate planning attorneys with real email addresses ready
   - ✅ Supabase configured and working

## 🚧 Next Steps - Railway Deployment

### Option 1: Railway Dashboard (Recommended)

1. **Login to Railway**:
   - Go to https://railway.app/
   - Login to your account

2. **Connect GitHub Repository**:
   - Create new project or select existing "IntroAlignment" project
   - Connect to GitHub repository: `CodenameMaggie/introalignment`
   - Railway will auto-detect the `Procfile` and deploy both processes

3. **Verify Environment Variables** (in Railway dashboard):
   Required for attorney scraper:
   - `NEXT_PUBLIC_SUPABASE_URL` (should already be set)
   - `SUPABASE_SERVICE_ROLE_KEY` (should already be set)
   - `ATTORNEY_SCRAPING_ENABLED=true` (optional, defaults to true)

4. **Deploy**:
   - Railway will automatically detect the `Procfile` and start:
     - **web process**: `npm run start` (Next.js app)
     - **cron process**: `while true; do node cron-scraper.js; sleep 21600; done`

5. **Verify Deployment**:
   ```bash
   # After Railway CLI is authenticated, check logs:
   railway logs

   # Look for these messages every 6 hours:
   # 🔍 Attorney Scraper - Starting...
   # ✅ Created: 2
   # 📬 Total in database: 4/10000
   ```

### Option 2: Railway CLI

```bash
# Login to Railway CLI
railway login

# Link to existing project (or create new one)
railway link

# Deploy (Railway will read Procfile automatically)
railway up

# Monitor logs
railway logs
```

## 📊 How It Works

The `Procfile` tells Railway to run TWO processes simultaneously:

```
web: npm run start              # Main Next.js application
cron: while true; do node cron-scraper.js; sleep 21600; done  # Scraper every 6 hours
```

**Scraper Schedule**:
- Runs every 6 hours (21600 seconds)
- Adds 2-10 attorneys per run (currently using fallback data)
- Target: 10,000 estate planning attorneys
- Current: 4 attorneys (0.04% of target)

**What Gets Scraped**:
- ACTEC directory: https://www.actec.org/find-a-fellow/
- WealthCounsel directory (future)
- State Bar directories (future)
- Google search results (future)

## 🐛 Known Issues

1. **Live ACTEC scraping returns 0 results**:
   - May require Puppeteer for JavaScript-rendered content
   - Currently falls back to sample data
   - Need to investigate and fix selectors

2. **TypeScript compilation errors**:
   - Original `/app/api/cron/scrape-attorneys/route.ts` won't compile
   - Path alias imports fail: `@/lib/scrapers/*`
   - Workaround: Using standalone JS script instead

## 🎯 Success Metrics

**You'll know it's working when:**
- Railway dashboard shows TWO processes running (web + cron)
- Railway logs show "🔍 Attorney Scraper - Starting..." every 6 hours
- Supabase `partners` table grows by 2-10 attorneys every 6 hours
- New attorneys have `source` = 'actec_directory' or 'wealthcounsel_directory'

## 📞 Support

**Railway Documentation**:
- https://docs.railway.app/deploy/deployments
- https://docs.railway.app/deploy/config-as-code#procfile

**Check Current Status**:
```bash
# View attorneys in database
curl "https://cxiazrciueruvvsxaxcz.supabase.co/rest/v1/partners?source=in.(actec_directory,wealthcounsel_directory)&select=id,full_name,email,source&order=created_at.desc&limit=20" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

**Last Updated**: 2026-01-14
**Status**: ✅ Code deployed to GitHub, awaiting Railway deployment
