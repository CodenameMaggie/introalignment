#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: attorneys } = await supabase
    .from('partners')
    .select('full_name, email, podcast_status, status')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n📊 Latest 10 Attorneys:\n');
  attorneys?.forEach(a => {
    console.log(`${a.full_name}`);
    console.log(`  Email: ${a.email}`);
    console.log(`  Status: ${a.status}`);
    console.log(`  Podcast: ${a.podcast_status}`);
    console.log('');
  });
}

main().catch(console.error);
