#!/usr/bin/env node

// Check database connection and tables
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('\n🔍 DATABASE CONNECTION CHECK\n');
  console.log('═══════════════════════════════════════════\n');

  // Test basic tables
  const tablesToCheck = [
    'users',
    'profiles',
    'conversations',
    'matches',
    'leads',
    'lead_sources',
    'outreach_sequences'
  ];

  const results = {};

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        results[table] = { exists: false, error: error.message, count: 0 };
      } else {
        // Get count
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        results[table] = {
          exists: true,
          count: count || 0,
          error: countError?.message
        };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message, count: 0 };
    }
  }

  // Display results
  console.log('Table Status:\n');

  for (const [table, result] of Object.entries(results)) {
    if (result.exists) {
      console.log(`  ✅ ${table.padEnd(20)} - ${result.count} records`);
    } else {
      console.log(`  ❌ ${table.padEnd(20)} - NOT FOUND (${result.error})`);
    }
  }

  console.log('\n═══════════════════════════════════════════\n');

  // Check specifically for leads
  if (!results.leads?.exists) {
    console.log('⚠️  LEADS TABLE NOT FOUND\n');
    console.log('The leads table hasn\'t been created yet.');
    console.log('You need to run this SQL migration in your Supabase dashboard:\n');
    console.log('  File: supabase/migrations/008_lead_scraper_system.sql\n');
    console.log('Steps:');
    console.log('  1. Go to: https://supabase.com/dashboard/project/cxiazrciueruvvsxaxcz/sql/new');
    console.log('  2. Copy contents of: supabase/migrations/008_lead_scraper_system.sql');
    console.log('  3. Paste and run in SQL Editor');
    console.log('  4. Also run: supabase/migrations/009_seed_lead_sources.sql\n');
  } else {
    console.log(`✅ Leads table exists with ${results.leads.count} records\n`);

    if (results.leads.count > 0) {
      // Show lead breakdown
      const { data: leads } = await supabase
        .from('leads')
        .select('status, source_type');

      if (leads) {
        const byStatus = {};
        const bySource = {};

        leads.forEach(lead => {
          byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
          bySource[lead.source_type] = (bySource[lead.source_type] || 0) + 1;
        });

        console.log('By Status:');
        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`  - ${status}: ${count}`);
        });

        console.log('\nBy Source:');
        Object.entries(bySource).forEach(([source, count]) => {
          console.log(`  - ${source}: ${count}`);
        });
      }
    } else {
      console.log('ℹ️  No leads have been scraped yet.\n');
      console.log('To start scraping leads:');
      console.log('  1. Configure lead sources in the database');
      console.log('  2. Run the scraper cron job: /api/cron/scrape');
      console.log('  3. Or manually add leads via /admin/leads\n');
    }
  }

  console.log('═══════════════════════════════════════════\n');
}

checkDatabase().catch(console.error);
