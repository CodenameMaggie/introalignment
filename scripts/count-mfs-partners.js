#!/usr/bin/env node

// Count total MFS partners imported

const IA_URL = 'https://cxiazrciueruvvsxaxcz.supabase.co';
const IA_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0Mjg2NywiZXhwIjoyMDgzMTE4ODY3fQ.r3L64ZLdokiRU_bn_J_F1IuX8R11Q72bN5LYmSsjSn4';

async function countPartners() {
  try {
    const response = await fetch(
      `${IA_URL}/rest/v1/partners?select=id,full_name,licensed_states&or=(source.eq.IA_osm,source.eq.IA_youtube)`,
      {
        headers: {
          'apikey': IA_SERVICE_KEY,
          'Authorization': `Bearer ${IA_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );

    const partners = await response.json();
    const total = response.headers.get('content-range')?.split('/')[1] || partners.length;

    console.log(`\n✅ Total MFS IA partners imported: ${total}\n`);

    // Count by state
    const byState = {};
    partners.forEach(p => {
      const state = p.licensed_states && p.licensed_states[0] ? p.licensed_states[0] : 'Unknown';
      byState[state] = (byState[state] || 0) + 1;
    });

    console.log('📊 Breakdown by State:');
    Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .forEach(([state, count]) => {
        console.log(`   ${state}: ${count}`);
      });

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

countPartners();
