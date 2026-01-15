#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n🔍 Checking attorney_verifications table...\n');

  // Try to select from the table
  const { data, error } = await supabase
    .from('attorney_verifications')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('\nTable does not exist. Creating it now...\n');

    // Read the migration file
    const fs = require('fs');
    const sql = fs.readFileSync('./supabase/migrations/create_attorney_verifications.sql', 'utf8');

    console.log('SQL to run:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\nPlease run this SQL in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/cxiazrciueruvvsxaxcz/sql\n');

  } else {
    console.log('✅ Table exists!');
    console.log(`Found ${data?.length || 0} verification records\n`);

    if (data && data.length > 0) {
      console.log('Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  }
}

main().catch(console.error);
