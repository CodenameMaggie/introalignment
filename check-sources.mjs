import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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

async function checkSources() {
  console.log('\n📡 CHECKING LEAD SOURCES\n');

  // Check all sources
  const { data: allSources, error: allError } = await supabase
    .from('lead_sources')
    .select('*');

  if (allError) {
    console.log('❌ Error:', allError.message);
    return;
  }

  console.log(`Total sources: ${allSources?.length || 0}`);

  if (allSources && allSources.length > 0) {
    console.log('\nAll Sources:');
    allSources.forEach(s => {
      console.log(`  - ${s.source_name}`);
      console.log(`    Type: ${s.source_type}`);
      console.log(`    Active: ${s.is_active}`);
      console.log(`    Frequency: ${s.scrape_frequency}`);
    });
  }

  // Check active sources
  const { data: activeSources, error: activeError } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('is_active', true);

  console.log(`\nActive sources: ${activeSources?.length || 0}`);

  // Check Reddit sources specifically
  const { data: redditSources, error: redditError } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('source_type', 'reddit')
    .eq('is_active', true);

  console.log(`Active Reddit sources: ${redditSources?.length || 0}`);
}

checkSources().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
