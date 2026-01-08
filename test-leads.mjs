import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read env file
const envContent = readFileSync('.env.local', 'utf-8');
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

async function checkLeads() {
  console.log('\n📊 CHECKING LEAD STATUS\n');
  console.log('═══════════════════════════════════════════\n');

  // Check lead_sources first
  const { data: sources, error: sourcesError } = await supabase
    .from('lead_sources')
    .select('*');

  if (sourcesError) {
    console.log('❌ Error checking lead_sources:', sourcesError.message);
  } else {
    console.log(`Lead Sources: ${sources?.length || 0}`);
    if (sources && sources.length > 0) {
      console.log('\nConfigured Sources:');
      sources.forEach(s => {
        console.log(`  - ${s.source_name} (${s.source_type})`);
      });
    }
  }

  // Check leads
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*');

  if (leadsError) {
    console.log('\n❌ Error checking leads:', leadsError.message);
  } else {
    const total = leads?.length || 0;
    console.log(`\nTotal Leads: ${total}`);

    if (total > 0) {
      const byStatus = {};
      const bySource = {};

      leads.forEach(lead => {
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
        bySource[lead.source_type] = (bySource[lead.source_type] || 0) + 1;
      });

      console.log('\nBy Status:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });

      console.log('\nBy Source:');
      Object.entries(bySource).forEach(([source, count]) => {
        console.log(`  - ${source}: ${count}`);
      });

      const converted = leads.filter(l => l.status === 'converted').length;
      if (total > 0) {
        const conversionRate = ((converted / total) * 100).toFixed(2);
        console.log(`\nConversion Rate: ${conversionRate}%`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════\n');
}

checkLeads().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
