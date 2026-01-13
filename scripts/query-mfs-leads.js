// Query MFS Central Database for applicable estate planning leads
const fetch = require('node:fetch');

const MFS_SUPABASE_URL = 'https://bixudsnkdeafczzqfvdq.supabase.co';

// This will need the service role key for the MFS database
// For now, let's try with anon key to see the schema
const ANON_KEY = process.env.MFS_SUPABASE_ANON_KEY || '';

async function queryMFSLeads() {
  console.log('🔍 Querying MFS Central Database for estate planning leads...\n');

  // Sources most relevant to IntroAlignment (estate planning)
  const relevantSources = [
    'IC_osm',      // IntroConnected leads
    'YPEC_osm'     // Your Private Estate Chef leads (estate planning focused)
  ];

  try {
    // Query leads table
    const response = await fetch(
      `${MFS_SUPABASE_URL}/rest/v1/leads?source=in.(${relevantSources.join(',')})&limit=50&order=created_at.desc`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Response:', errorText);
      return;
    }

    const leads = await response.json();

    console.log(`✅ Found ${leads.length} leads from MFS database\n`);

    // Group by source
    const bySource = {};
    leads.forEach(lead => {
      const source = lead.source || 'unknown';
      if (!bySource[source]) {
        bySource[source] = [];
      }
      bySource[source].push(lead);
    });

    // Display summary
    console.log('📊 Leads by Source:');
    Object.entries(bySource).forEach(([source, sourceLeads]) => {
      console.log(`  ${source}: ${sourceLeads.length} leads`);
    });

    console.log('\n📋 Sample Leads:');
    leads.slice(0, 10).forEach((lead, i) => {
      console.log(`\n${i + 1}. ${lead.full_name || lead.name || 'Unknown'}`);
      console.log(`   Source: ${lead.source}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Company: ${lead.company || 'N/A'}`);
      console.log(`   Status: ${lead.status || 'N/A'}`);
    });

    // Check for estate planning keywords
    const estateKeywords = ['estate', 'trust', 'attorney', 'lawyer', 'legal', 'planning', 'wealth'];
    const matchingLeads = leads.filter(lead => {
      const searchText = [
        lead.full_name,
        lead.name,
        lead.company,
        lead.title,
        lead.notes,
        lead.description
      ].join(' ').toLowerCase();

      return estateKeywords.some(keyword => searchText.includes(keyword));
    });

    console.log(`\n🎯 Estate Planning Related: ${matchingLeads.length} leads`);

  } catch (error) {
    console.error('❌ Error querying MFS database:', error.message);
  }
}

queryMFSLeads();
