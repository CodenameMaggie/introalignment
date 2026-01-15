#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function prepareAttorneys() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n🎙️  Preparing Attorneys for Podcast Outreach\n');

  // Get our 5 attorneys from the scraper
  const { data: attorneys } = await supabase
    .from('partners')
    .select('*')
    .in('source', ['actec_directory', 'wealthcounsel_directory'])
    .order('created_at', { ascending: false });

  if (!attorneys || attorneys.length === 0) {
    console.log('❌ No attorneys found from scraper sources');
    return;
  }

  console.log(`Found ${attorneys.length} attorneys from scraper\n`);

  let updated = 0;

  for (const attorney of attorneys) {
    console.log(`Checking: ${attorney.full_name} (${attorney.email})`);
    console.log(`   Current status: ${attorney.status}`);
    console.log(`   Podcast status: ${attorney.podcast_status}`);
    console.log(`   Partner type: ${attorney.partner_type}`);

    // Update attorney to be ready for podcast outreach
    const updates = {};
    let needsUpdate = false;

    // Ensure they're approved prospects
    if (attorney.status !== 'approved') {
      updates.status = 'approved';
      needsUpdate = true;
    }

    if (attorney.partner_type !== 'prospect') {
      updates.partner_type = 'prospect';
      needsUpdate = true;
    }

    if (attorney.podcast_status !== 'not_contacted' && attorney.podcast_status !== null) {
      updates.podcast_status = 'not_contacted';
      needsUpdate = true;
    }

    // Ensure email_unsubscribed is false
    if (attorney.email_unsubscribed !== false) {
      updates.email_unsubscribed = false;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', attorney.id);

      if (error) {
        console.log(`   ❌ Error updating: ${error.message}`);
      } else {
        console.log(`   ✅ Updated - ready for podcast outreach`);
        updated++;
      }
    } else {
      console.log(`   ✓ Already ready`);
    }

    console.log('');
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total attorneys: ${attorneys.length}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Ready for outreach: ${attorneys.length}\n`);

  console.log('✅ All attorneys prepared for podcast invitations!\n');
}

prepareAttorneys().catch(console.error);
