#!/usr/bin/env node

// Quick script to check leads in database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
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

async function checkLeads() {
  try {
    console.log('Connecting to database...\n');

    // Check if table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('leads')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accessing leads table:', tableError.message);
      console.log('\nℹ️  The leads table may not exist yet.');
      console.log('   Run this migration to create it: supabase/migrations/008_lead_scraper_system.sql\n');
      return;
    }

    // Total leads
    const { data: allLeads, error: totalError } = await supabase
      .from('leads')
      .select('*');

    if (totalError) {
      console.error('Error fetching leads:', totalError.message);
      return;
    }

    const totalLeads = allLeads?.length || 0;

    // By status
    const { data: byStatus, error: statusError } = await supabase
      .from('leads')
      .select('status')
      .then(res => {
        if (res.error) return res;
        const grouped = {};
        res.data.forEach(lead => {
          grouped[lead.status] = (grouped[lead.status] || 0) + 1;
        });
        return { data: grouped, error: null };
      });

    // By source
    const { data: bySource, error: sourceError } = await supabase
      .from('leads')
      .select('source_type')
      .then(res => {
        if (res.error) return res;
        const grouped = {};
        res.data.forEach(lead => {
          grouped[lead.source_type] = (grouped[lead.source_type] || 0) + 1;
        });
        return { data: grouped, error: null };
      });

    // Converted count
    const { count: convertedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted');

    // Recent leads
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('id, source_type, status, fit_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\n📊 LEAD STATISTICS\n');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total Leads: ${totalLeads || 0}`);
    console.log(`Converted to Users: ${convertedCount || 0}`);
    if (totalLeads > 0) {
      const conversionRate = ((convertedCount / totalLeads) * 100).toFixed(2);
      console.log(`Conversion Rate: ${conversionRate}%`);
    }

    if (byStatus && Object.keys(byStatus).length > 0) {
      console.log('\nBy Status:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
    }

    if (bySource && Object.keys(bySource).length > 0) {
      console.log('\nBy Source:');
      Object.entries(bySource).forEach(([source, count]) => {
        console.log(`  - ${source}: ${count}`);
      });
    }

    if (recentLeads && recentLeads.length > 0) {
      console.log('\nMost Recent Leads:');
      recentLeads.forEach(lead => {
        const date = new Date(lead.created_at).toLocaleDateString();
        console.log(`  - ${lead.source_type} | Score: ${lead.fit_score || 'N/A'} | Status: ${lead.status} | ${date}`);
      });
    }

    console.log('\n═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkLeads();
