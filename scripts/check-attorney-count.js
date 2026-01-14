#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAttorneys() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all attorneys from scraper sources
  const { data: attorneys, error, count } = await supabase
    .from('partners')
    .select('id,full_name,email,source,created_at', { count: 'exact' })
    .in('source', ['actec_directory', 'wealthcounsel_directory', 'google_search', 'state_bar'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 Attorney Scraper Database Status\n');
  console.log(`Total Attorneys: ${count}/10000\n`);

  if (attorneys && attorneys.length > 0) {
    console.log('Recent Attorneys:');
    attorneys.slice(0, 10).forEach((a, i) => {
      console.log(`${i + 1}. ${a.full_name}`);
      console.log(`   Email: ${a.email}`);
      console.log(`   Source: ${a.source}`);
      console.log(`   Added: ${new Date(a.created_at).toLocaleString()}\n`);
    });
  }
}

checkAttorneys().catch(console.error);
