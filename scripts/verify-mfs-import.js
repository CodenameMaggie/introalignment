#!/usr/bin/env node

// Verify MFS import into IntroAlignment partners table

const IA_URL = 'https://cxiazrciueruvvsxaxcz.supabase.co';
const IA_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0Mjg2NywiZXhwIjoyMDgzMTE4ODY3fQ.r3L64ZLdokiRU_bn_J_F1IuX8R11Q72bN5LYmSsjSn4';

async function verifyImport() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING MFS IMPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Query IA partners from IA_osm and IA_youtube sources
    const response = await fetch(
      `${IA_URL}/rest/v1/partners?select=full_name,email,source,firm_name,licensed_states,status,podcast_status,professional_title&or=(source.eq.IA_osm,source.eq.IA_youtube)&order=created_at.desc&limit=20`,
      {
        headers: {
          'apikey': IA_SERVICE_KEY,
          'Authorization': `Bearer ${IA_SERVICE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const partners = await response.json();

    console.log(`✅ Total partners from IA sources: ${partners.length}\n`);

    if (partners.length > 0) {
      console.log('📋 Sample Partners:\n');
      partners.slice(0, 15).forEach((p, i) => {
        console.log(`${i + 1}. ${p.full_name}`);
        console.log(`   Firm: ${p.firm_name || 'N/A'}`);
        console.log(`   State: ${p.licensed_states ? p.licensed_states[0] : 'N/A'}`);
        console.log(`   Source: ${p.source}`);
        console.log(`   Status: ${p.status} | Podcast: ${p.podcast_status}`);
        console.log(`   Email: ${p.email}\n`);
      });

      // Count by state
      const byState = {};
      partners.forEach(p => {
        const state = p.licensed_states && p.licensed_states[0] ? p.licensed_states[0] : 'Unknown';
        byState[state] = (byState[state] || 0) + 1;
      });

      console.log('\n📊 Partners by State:');
      Object.entries(byState)
        .sort((a, b) => b[1] - a[1])
        .forEach(([state, count]) => {
          console.log(`   ${state}: ${count}`);
        });

      // Count by source
      const bySource = {};
      partners.forEach(p => {
        bySource[p.source] = (bySource[p.source] || 0) + 1;
      });

      console.log('\n📊 Partners by Source:');
      Object.entries(bySource).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
      });

    } else {
      console.log('⚠️  No partners found from IA sources');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyImport();
