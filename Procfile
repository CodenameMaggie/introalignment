# Railway Procfile
# Defines services to run on Railway

# Main web server
web: npm run start

# Attorney scraper cron (runs every 6 hours)
cron: while true; do node cron-scraper.js; sleep 21600; done
