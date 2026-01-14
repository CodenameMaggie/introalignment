#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function findRobert() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Search for Robert Anderson
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .or('full_name.ilike.%robert%anderson%,email.ilike.%randerson%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nSearching for Robert Anderson...\n');
  console.log(`Found ${data?.length || 0} matches\n`);

  if (data && data.length > 0) {
    data.forEach(partner => {
      console.log('Match found:');
      console.log(`  Name: ${partner.full_name}`);
      console.log(`  Email: ${partner.email}`);
      console.log(`  Source: ${partner.source}`);
      console.log(`  Created: ${partner.created_at}\n`);
    });
  }
}

findRobert().catch(console.error);
