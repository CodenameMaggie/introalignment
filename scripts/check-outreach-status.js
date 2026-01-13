#!/usr/bin/env node

// Check podcast outreach status and email tracking

const IA_URL = 'https://cxiazrciueruvvsxaxcz.supabase.co';
const IA_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0Mjg2NywiZXhwIjoyMDgzMTE4ODY3fQ.r3L64ZLdokiRU_bn_J_F1IuX8R11Q72bN5LYmSsjSn4';

async function checkOutreachStatus() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 PODCAST OUTREACH STATUS CHECK');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Check total partners
    const partnersRes = await fetch(
      `${IA_URL}/rest/v1/partners?select=id,full_name,email,source,podcast_status,status&or=(source.eq.IA_osm,source.eq.IA_youtube)`,
      {
        headers: {
          'apikey': IA_SERVICE_KEY,
          'Authorization': `Bearer ${IA_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );

    const partners = await partnersRes.json();
    const totalCount = partnersRes.headers.get('content-range')?.split('/')[1] || partners.length;

    console.log(`📊 Total IA Partners: ${totalCount}`);

    // Count by podcast status
    const byStatus = {};
    partners.forEach(p => {
      const status = p.podcast_status || 'null';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    console.log('\n📋 Podcast Status Breakdown:');
    Object.entries(byStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

    // Count by partner status
    const byPartnerStatus = {};
    partners.forEach(p => {
      const status = p.status || 'null';
      byPartnerStatus[status] = (byPartnerStatus[status] || 0) + 1;
    });

    console.log('\n📋 Partner Status Breakdown:');
    Object.entries(byPartnerStatus)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

    // Check if outreach sequences table exists
    console.log('\n🔍 Checking outreach system...');

    const sequencesRes = await fetch(
      `${IA_URL}/rest/v1/outreach_sequences?select=*`,
      {
        headers: {
          'apikey': IA_SERVICE_KEY,
          'Authorization': `Bearer ${IA_SERVICE_KEY}`
        }
      }
    );

    if (sequencesRes.ok) {
      const sequences = await sequencesRes.json();
      console.log(`✅ Outreach sequences table exists: ${sequences.length} sequences found`);

      if (sequences.length > 0) {
        sequences.forEach(seq => {
          console.log(`\n   Sequence: ${seq.name}`);
          console.log(`   Type: ${seq.sequence_type}`);
          console.log(`   Active: ${seq.is_active}`);
          console.log(`   Min Fit Score: ${seq.target_fit_score_min || 'N/A'}`);
        });
      }

      // Check outreach messages
      const messagesRes = await fetch(
        `${IA_URL}/rest/v1/outreach_messages?select=id,status,sent_at,opened_at,responded_at&order=created_at.desc&limit=100`,
        {
          headers: {
            'apikey': IA_SERVICE_KEY,
            'Authorization': `Bearer ${IA_SERVICE_KEY}`,
            'Prefer': 'count=exact'
          }
        }
      );

      if (messagesRes.ok) {
        const messages = await messagesRes.json();
        const totalMessages = messagesRes.headers.get('content-range')?.split('/')[1] || messages.length;

        console.log(`\n📨 Total Outreach Messages: ${totalMessages}`);

        if (messages.length > 0) {
          const messagesByStatus = {};
          messages.forEach(m => {
            messagesByStatus[m.status] = (messagesByStatus[m.status] || 0) + 1;
          });

          console.log('\n📊 Message Status:');
          Object.entries(messagesByStatus).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
          });

          // Count responses
          const opened = messages.filter(m => m.opened_at).length;
          const responded = messages.filter(m => m.responded_at).length;

          console.log(`\n📬 Engagement:`);
          console.log(`   Opened: ${opened}`);
          console.log(`   Responded: ${responded}`);
          if (totalMessages > 0) {
            console.log(`   Open Rate: ${((opened / totalMessages) * 100).toFixed(1)}%`);
            console.log(`   Response Rate: ${((responded / totalMessages) * 100).toFixed(1)}%`);
          }

          // Show recent messages
          console.log('\n📝 Recent Messages (last 10):');
          messages.slice(0, 10).forEach((m, i) => {
            console.log(`   ${i + 1}. Status: ${m.status}, Sent: ${m.sent_at ? new Date(m.sent_at).toLocaleString() : 'Not sent'}`);
          });
        } else {
          console.log('⚠️  No outreach messages found');
        }
      }

    } else {
      console.log('⚠️  Outreach sequences table not found or not accessible');
    }

    // Check if any partners have valid emails (not placeholder)
    const withValidEmail = partners.filter(p => p.email && !p.email.includes('pending.'));
    const withPlaceholderEmail = partners.filter(p => p.email && p.email.includes('pending.'));

    console.log('\n📧 Email Status:');
    console.log(`   Valid emails: ${withValidEmail.length}`);
    console.log(`   Placeholder emails: ${withPlaceholderEmail.length}`);
    console.log(`   No email: ${partners.filter(p => !p.email).length}`);

    if (withPlaceholderEmail.length > 0) {
      console.log('\n⚠️  Note: Partners with placeholder emails cannot receive outreach');
      console.log('   Add real email addresses to enable podcast invitations');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✨ STATUS CHECK COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOutreachStatus();
