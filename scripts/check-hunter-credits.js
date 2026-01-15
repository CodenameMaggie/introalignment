#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

async function checkHunterCredits() {
  if (!HUNTER_API_KEY) {
    console.log('\n❌ No Hunter.io API key found in .env.local\n');
    console.log('To add Hunter.io:');
    console.log('1. Go to https://hunter.io/users/sign_up');
    console.log('2. Sign up for free account (25 searches/month)');
    console.log('3. Get API key from https://hunter.io/api_keys');
    console.log('4. Add to .env.local: HUNTER_API_KEY=your_key_here\n');
    return;
  }

  console.log('\n🔍 Checking Hunter.io Account Status...\n');

  try {
    const response = await fetch(
      `https://api.hunter.io/v2/account?api_key=${HUNTER_API_KEY}`
    );

    if (!response.ok) {
      console.error('❌ Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const account = data.data;

    console.log('📊 Hunter.io Account Info:');
    console.log(`   Email: ${account.email}`);
    console.log(`   Plan: ${account.plan_name || 'Free'}`);
    console.log(`   Team: ${account.team_id || 'Personal'}\n`);

    console.log('📈 API Usage:');
    console.log(`   Searches used this month: ${account.requests.searches.used}/${account.requests.searches.available}`);
    console.log(`   Email verifications used: ${account.requests.verifications?.used || 0}/${account.requests.verifications?.available || 0}`);
    console.log(`   Remaining searches: ${account.requests.searches.available - account.requests.searches.used}\n`);

    const remaining = account.requests.searches.available - account.requests.searches.used;

    if (remaining > 0) {
      console.log(`✅ You can enrich ${remaining} MFS attorney emails this month!`);
      console.log(`   Total MFS attorneys needing emails: 59\n`);

      if (remaining < 59) {
        console.log(`⚠️  Note: You'll need ${Math.ceil(59 / remaining)} months to enrich all 59 at this rate`);
        console.log(`   Or upgrade to a paid plan for more searches\n`);
      } else {
        console.log(`✅ Enough credits to enrich all 59 MFS attorneys!\n`);
      }
    } else {
      console.log('❌ No searches remaining this month');
      console.log(`   Resets on: ${account.reset_date || 'unknown'}\n`);
    }

  } catch (error) {
    console.error('❌ Error checking Hunter.io:', error.message);
  }
}

checkHunterCredits().catch(console.error);
