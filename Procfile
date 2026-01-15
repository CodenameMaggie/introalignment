# Railway Procfile
# Defines services to run on Railway

# Main web server
web: npm run start

# Attorney scraper cron (runs every 6 hours = 21600 seconds)
scraper: while true; do node cron-scraper.js; sleep 21600; done

# Podcast outreach cron (runs every 10 minutes = 600 seconds)
podcast: while true; do node cron-podcast-outreach.js; sleep 600; done
