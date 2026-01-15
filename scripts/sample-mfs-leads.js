#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sampleMFS() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: mfsLeads } = await supabase
    .from('partners')
    .select('full_name,email,firm_name,licensed_states,source')
    .eq('source', 'IA_osm')
    .limit(10);

  console.log('\n📋 Sample of 10 MFS Leads (IA_osm):\n');

  mfsLeads?.forEach((lead, i) => {
    console.log(`${i + 1}. ${lead.full_name}`);
    console.log(`   Email: ${lead.email}`);
    console.log(`   Firm: ${lead.firm_name || 'N/A'}`);
    console.log(`   States: ${lead.licensed_states?.join(', ') || 'N/A'}\n`);
  });
}

sampleMFS().catch(console.error);
