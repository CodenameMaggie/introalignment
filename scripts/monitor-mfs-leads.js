#!/usr/bin/env node

// Monitor MFS database for estate planning attorney leads
const MFS_URL = 'https://bixudsnkdeafczzqfvdq.supabase.co';
const MFS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHVkc25rZGVhZmN6enFmdmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUyOTQsImV4cCI6MjA3OTMzMTI5NH0.a3fXuai1t8CGM7XlthgcDwOS76G_KnQ4k2wWBOifVLU';

async function checkForAttorneys() {
  console.log(`\n[${new Date().toLocaleTimeString()}] Checking MFS database for estate planning attorneys...`);

  try {
    // Check IC_osm source with legal keywords
    const keywords = [
      'attorney', 'lawyer', 'legal', 'law firm',
      'estate planning', 'trust', 'wealth', 'counsel',
      'esq', 'j.d.', 'barrister', 'solicitor'
    ];

    // Query IA_osm and IA_youtube leads
    const response = await fetch(
      `${MFS_URL}/rest/v1/leads?or=(source.eq.IA_osm,source.eq.IA_youtube)&select=*&order=created_at.desc&limit=100`,
      {
        headers: {
          'apikey': MFS_KEY,
          'Authorization': `Bearer ${MFS_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      return;
    }

    const allLeads = await response.json();
    console.log(`📊 Total IA leads (IA_osm + IA_youtube): ${allLeads.length}`);

    // Filter for estate planning related
    const attorneyLeads = allLeads.filter(lead => {
      const searchText = [
        lead.name || '',
        lead.company || '',
        lead.email || '',
        lead.notes || '',
        lead.description || ''
      ].join(' ').toLowerCase();

      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });

    console.log(`⚖️  Estate planning related leads: ${attorneyLeads.length}`);

    if (attorneyLeads.length > 0) {
      console.log('\n🎯 Found estate planning leads:');
      attorneyLeads.slice(0, 10).forEach((lead, i) => {
        console.log(`\n${i + 1}. ${lead.name || 'Unknown'}`);
        console.log(`   Company: ${lead.company || 'N/A'}`);
        console.log(`   Email: ${lead.email || 'N/A'}`);
        console.log(`   Source: ${lead.source}`);
        console.log(`   Created: ${new Date(lead.created_at).toLocaleString()}`);
      });

      if (attorneyLeads.length > 10) {
        console.log(`\n   ... and ${attorneyLeads.length - 10} more`);
      }
    } else {
      console.log('⏳ No estate planning attorneys found yet. Will check again...');
    }

    // Sample recent leads to show what's being added
    console.log('\n📝 Recent IA leads (last 5):');
    allLeads.slice(0, 5).forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.name} - ${lead.company || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Check immediately
checkForAttorneys();

// Then check every 30 seconds
setInterval(checkForAttorneys, 30000);

console.log('\n🔍 Monitoring MFS database for estate planning attorneys...');
console.log('Press Ctrl+C to stop\n');
