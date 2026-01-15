#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

async function testPodcastOutreach() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/cron/podcast-outreach`;

  console.log('\n🎙️  Testing Podcast Outreach System...\n');
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('\n');

    if (data.success) {
      console.log('✅ Podcast Outreach System Working!\n');
      console.log(`Outreach Status: ${data.outreach_status}`);
      console.log(`Emails Sent: ${data.emails_sent}`);
      console.log(`Partners Enrolled: ${data.partners_enrolled}`);

      if (data.stats) {
        console.log('\n📊 Stats:');
        console.log(`   Total Prospects: ${data.stats.total_prospects}`);
        console.log(`   Contacted: ${data.stats.contacted}`);
        console.log(`   Interested: ${data.stats.interested}`);
        console.log(`   Scheduled: ${data.stats.scheduled}`);
        console.log(`   Conversion Rate: ${data.stats.conversion_rate}`);
      }
    } else {
      console.log('❌ Podcast Outreach Failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Error testing podcast outreach:', error.message);
  }
}

testPodcastOutreach().catch(console.error);
