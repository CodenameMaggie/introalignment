#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkMFSLeads() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n📊 MFS Leads Database Status\n');

  // Get total count
  const { count: totalCount } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true });

  console.log(`Total Partners in Database: ${totalCount}\n`);

  // Get MFS leads (IA_osm and IA_youtube sources)
  const { data: mfsLeads, error: mfsError, count: mfsCount } = await supabase
    .from('partners')
    .select('id,full_name,email,firm_name,licensed_states,source,created_at', { count: 'exact' })
    .in('source', ['IA_osm', 'IA_youtube'])
    .order('created_at', { ascending: false });

  if (mfsError) {
    console.error('Error fetching MFS leads:', mfsError);
    return;
  }

  console.log(`MFS Leads (IA_osm + IA_youtube): ${mfsCount}\n`);

  // Count emails
  const leadsWithEmails = mfsLeads?.filter(l => l.email && !l.email.startsWith('pending.')) || [];
  const leadsWithoutEmails = mfsCount - leadsWithEmails.length;

  console.log(`✅ With real emails: ${leadsWithEmails.length}`);
  console.log(`❌ Without emails (pending.*): ${leadsWithoutEmails}\n`);

  if (leadsWithEmails.length > 0) {
    console.log('MFS Leads with Real Emails:');
    leadsWithEmails.slice(0, 10).forEach((lead, i) => {
      console.log(`${i + 1}. ${lead.full_name}`);
      console.log(`   Email: ${lead.email}`);
      console.log(`   Firm: ${lead.firm_name || 'N/A'}`);
      console.log(`   States: ${lead.licensed_states?.join(', ') || 'N/A'}`);
      console.log(`   Source: ${lead.source}\n`);
    });
  }

  // Get attorney scraper leads
  const { count: scraperCount } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .in('source', ['actec_directory', 'wealthcounsel_directory', 'google_search', 'state_bar']);

  console.log(`\nAttorney Scraper Leads: ${scraperCount}/10000`);

  // Get breakdown by source
  console.log('\n📋 Breakdown by Source:');
  const { data: sourceBreakdown } = await supabase
    .from('partners')
    .select('source');

  if (sourceBreakdown) {
    const sourceCounts = {};
    sourceBreakdown.forEach(p => {
      sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
    });

    Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`);
    });
  }

  console.log('\n');
}

checkMFSLeads().catch(console.error);
