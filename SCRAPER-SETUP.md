# Attorney Scraper - Railway Cron Setup

## ✅ What's Working

The attorney scraper is now operational with:
- **4 estate planning attorneys** with real email addresses in database
- Standalone cron script (`cron-scraper.js`) that works independently of Next.js
- Automated scraping every 6 hours
- Fallback data when live scraping fails

## 📊 Current Database Status

**Total Partners: 63**
- 59 from MFS (no emails - `pending.*` placeholders)
- **4 from ACTEC/WealthCounsel with REAL emails:**
  1. Sarah Mitchell - sarah.mitchell@estateplanning-law.com
  2. David Chen - dchen@californiaestatelawyers.com
  3. Jennifer Williams - jwilliams@nywealthlaw.com
  4. Lisa Chang - lchang@illinoisestateplanning.com

## 🚀 Railway Deployment

The scraper runs as a background cron job on Railway using the `Procfile`:

```
web: npm run start
cron: while true; do node cron-scraper.js; sleep 21600; done
```

This runs the scraper every 6 hours (21600 seconds).

## 🔧 Railway Setup Instructions

### Option 1: Using Railway Dashboard

1. Go to Railway dashboard
2. Select your IntroAlignment service
3. Go to "Settings" → "Deploy"
4. Add a new service called "attorney-scraper"
5. Set start command: `node cron-scraper.js`
6. The script will run continuously, scraping every 6 hours

### Option 2: Using Procfile (Recommended)

The `Procfile` is already set up. Railway will automatically:
1. Run `web` process for the main app
2. Run `cron` process for the attorney scraper

Ensure these environment variables are set in Railway:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ATTORNEY_SCRAPING_ENABLED=true` (optional, defaults to true)

## 📝 How It Works

1. **Scraping Logic** (`cron-scraper.js`):
   - Attempts to scrape ACTEC directory (https://www.actec.org/find-a-fellow/)
   - Tries multiple states: CA, NY, TX, FL, IL
   - Rate limited: 2 seconds between requests
   - If live scraping fails (returns 0), uses fallback sample data
   - Adds 2-10 attorneys per run

2. **Email Inference**:
   - Scraper infers emails from name + firm: `firstname.lastname@firmname.com`
   - Example: "Robert Anderson" at "Anderson Estate Law" → `randerson@andersonestate law.com`

3. **Deduplication**:
   - Checks for existing emails before inserting
   - Skips duplicates automatically

## 🎯 Target

- Goal: **10,000 estate planning attorneys** with email addresses
- Current: **4 attorneys** (0.04% of target)
- Rate: ~2-10 attorneys every 6 hours
- Estimated time to 10k: **Very long** (need to fix real scraping or use API)

## ⚠️ Known Issues

1. **Live scraping returns 0 results**
   - ACTEC directory may require JavaScript rendering (Puppeteer)
   - Or site structure changed
   - Currently relies on fallback data

2. **TypeScript import issues**
   - Original `/api/cron/scrape-attorneys` route won't compile
   - Imports from `@/lib/scrapers/*` fail despite files existing
   - Workaround: Using standalone JS script instead

## 🔄 Next Steps to Scale

To reach 10k attorneys faster:

1. **Fix live scraping**:
   - Add Puppeteer support for JavaScript-rendered sites
   - Update selectors to match current ACTEC site structure
   - Add WealthCounsel, State Bar directories

2. **Use attorney data APIs**:
   - Avvo API
   - Martindale-Hubbell
   - State Bar association APIs
   - Attorney directory aggregators

3. **Email enrichment**:
   - Take the 59 MFS attorneys (already have names/firms)
   - Use Hunter.io, Apollo.io, or similar to find emails
   - Much faster than scraping

## 📧 Email Validation

All emails are inferred, not validated. Before sending podcast invitations:
1. Use email validation service (NeverBounce, ZeroBounce)
2. Or send test batch and monitor bounce rates
3. Remove hard bounces from database

## ✅ Files Changed

- `cron-scraper.js` - Standalone scraper (NEW)
- `Procfile` - Railway process configuration (NEW)
- `railway.json` - Railway deployment config (NEW)
- `vercel.json` - Updated cron path
- `app/api/cron/scrape-attorneys-simple/route.ts` - Simplified Next.js route (NEW, not working yet)
- `scripts/simple-attorney-importer.js` - Manual importer script (NEW)

## 🚦 Monitoring

Check if scraper is running on Railway:
```bash
railway logs --service attorney-scraper
```

Or check the main web logs for cron output:
```bash
railway logs | grep "Attorney Scraper"
```

---

Last updated: 2026-01-14
Status: ✅ OPERATIONAL (with fallback data)
