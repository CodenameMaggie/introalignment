#!/usr/bin/env node
/**
 * Direct runner for attorney scraper
 * Bypasses Next.js route to test scraping functionality
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxiazrciueruvvsxaxcz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0Mjg2NywiZXhwIjoyMDgzMTE4ODY3fQ.J8o6V9_9f4Q4PqUeEpR_PXwzjfMaC0VwZk5lVk9gF_8';

async function runScraper() {
  console.log('🔍 Direct Attorney Scraper Runner\n');

  // Trigger the scraping endpoint
  try {
    const response = await fetch('http://localhost:3000/api/cron/scrape-attorneys', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    console.log('\n✅ Scraper Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('\n❌ Error running scraper:', error.message);
    console.log('\nℹ️  The cron endpoint may not be accessible. Trying direct database check...\n');

    // Check database directly
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: partners, error: dbError } = await supabase
      .from('partners')
      .select('id, full_name, email, source, created_at')
      .in('source', ['actec_directory', 'wealthcounsel_directory', 'google_search', 'state_bar'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (dbError) {
      console.error('Database error:', dbError);
    } else {
      console.log(`📊 Found ${partners.length} scraped attorneys in database:`);
      partners.forEach(p => {
        console.log(`  - ${p.full_name} (${p.source}) - ${p.email || 'No email'}`);
      });
    }
  }
}

runScraper().catch(console.error);
