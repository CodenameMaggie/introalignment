#!/usr/bin/env node
/**
 * Comprehensive IntroAlignment System Audit
 *
 * Checks:
 * 1. Attorney database counts and status
 * 2. Verification system health
 * 3. Email outreach history
 * 4. Automated systems status
 * 5. Data quality issues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('\n🔍 IntroAlignment System Audit');
  console.log('═'.repeat(60));
  console.log(`📅 ${new Date().toISOString()}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. ATTORNEY DATABASE STATS
  console.log('📊 ATTORNEY DATABASE');
  console.log('─'.repeat(60));

  const { data: allAttorneys, count: totalCount } = await supabase
    .from('partners')
    .select('*', { count: 'exact' });

  console.log(`Total Attorneys: ${totalCount}`);

  // Count by status
  const { count: approvedCount } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: pendingCount } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`  ✅ Approved: ${approvedCount}`);
  console.log(`  ⏳ Pending: ${pendingCount}`);

  // Count by source
  const sourceBreakdown = {};
  allAttorneys?.forEach(a => {
    sourceBreakdown[a.source] = (sourceBreakdown[a.source] || 0) + 1;
  });

  console.log('\nSources:');
  Object.entries(sourceBreakdown).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });

  // 2. EMAIL VERIFICATION STATUS
  console.log('\n\n📧 EMAIL VERIFICATION');
  console.log('─'.repeat(60));

  const validEmails = allAttorneys?.filter(a =>
    a.email &&
    !a.email.startsWith('pending.') &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(a.email)
  );

  const placeholderEmails = allAttorneys?.filter(a =>
    a.email && a.email.startsWith('pending.')
  );

  console.log(`✅ Valid Emails: ${validEmails?.length || 0}`);
  console.log(`⚠️  Placeholder Emails: ${placeholderEmails?.length || 0}`);
  console.log(`❌ Missing Emails: ${(totalCount || 0) - (validEmails?.length || 0) - (placeholderEmails?.length || 0)}`);

  // 3. PODCAST OUTREACH STATUS
  console.log('\n\n🎙️ PODCAST OUTREACH');
  console.log('─'.repeat(60));

  const { count: contactedCount } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('podcast_status', 'contacted');

  const { count: notContactedCount } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('podcast_status', 'not_contacted');

  const { count: respondedCount } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('podcast_status', 'responded');

  console.log(`📧 Contacted: ${contactedCount}`);
  console.log(`⏳ Not Contacted: ${notContactedCount}`);
  console.log(`✅ Responded: ${respondedCount || 0}`);

  // Show last contacted
  const { data: lastContacted } = await supabase
    .from('partners')
    .select('full_name, email, last_contact_date')
    .eq('podcast_status', 'contacted')
    .order('last_contact_date', { ascending: false })
    .limit(3);

  if (lastContacted && lastContacted.length > 0) {
    console.log('\nRecent Podcast Invitations:');
    lastContacted.forEach(a => {
      const date = new Date(a.last_contact_date);
      console.log(`  • ${a.full_name} (${date.toLocaleDateString()})`);
    });
  }

  // 4. JORDAN + ATLAS VERIFICATION
  console.log('\n\n🛡️ VERIFICATION SYSTEM');
  console.log('─'.repeat(60));

  // Check if attorney_verifications table exists
  const { data: verifications, error: verError } = await supabase
    .from('attorney_verifications')
    .select('*')
    .limit(5);

  if (verError) {
    console.log('⚠️  attorney_verifications table not found');
    console.log('   Run: node scripts/run-migration.js');
  } else {
    const { count: totalVerifications } = await supabase
      .from('attorney_verifications')
      .select('id', { count: 'exact', head: true });

    const { count: passedVerifications } = await supabase
      .from('attorney_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('verified', true);

    console.log(`Total Verification Checks: ${totalVerifications || 0}`);
    console.log(`✅ Passed: ${passedVerifications || 0}`);
    console.log(`❌ Failed: ${(totalVerifications || 0) - (passedVerifications || 0)}`);
  }

  // 5. QUALITY ISSUES
  console.log('\n\n⚠️  DATA QUALITY ISSUES');
  console.log('─'.repeat(60));

  // Attorneys ready for outreach (approved + valid email + not contacted)
  const readyForOutreach = allAttorneys?.filter(a =>
    a.status === 'approved' &&
    a.podcast_status === 'not_contacted' &&
    a.email &&
    !a.email.startsWith('pending.') &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(a.email)
  );

  console.log(`✅ Ready for Podcast Outreach: ${readyForOutreach?.length || 0}`);

  // Duplicates
  const emailCounts = {};
  allAttorneys?.forEach(a => {
    if (a.email && !a.email.startsWith('pending.')) {
      emailCounts[a.email] = (emailCounts[a.email] || 0) + 1;
    }
  });
  const duplicates = Object.entries(emailCounts).filter(([_, count]) => count > 1);

  if (duplicates.length > 0) {
    console.log(`⚠️  Duplicate Emails: ${duplicates.length}`);
    duplicates.slice(0, 3).forEach(([email, count]) => {
      console.log(`   • ${email} (${count} records)`);
    });
  } else {
    console.log(`✅ No Duplicate Emails`);
  }

  // 6. AUTOMATED SYSTEMS CHECK
  console.log('\n\n🤖 AUTOMATED SYSTEMS');
  console.log('─'.repeat(60));

  // Check Procfile
  const fs = require('fs');
  const procfileExists = fs.existsSync('./Procfile');

  if (procfileExists) {
    console.log('✅ Procfile found');
    const procfile = fs.readFileSync('./Procfile', 'utf8');
    const systems = {
      web: procfile.includes('web:'),
      scraper: procfile.includes('scraper:'),
      podcast: procfile.includes('podcast:'),
      newsletter: procfile.includes('newsletter:')
    };

    Object.entries(systems).forEach(([system, exists]) => {
      console.log(`   ${exists ? '✅' : '❌'} ${system}`);
    });

    // Check if using verified outreach
    if (procfile.includes('cron-podcast-outreach-verified.js')) {
      console.log('   ✅ Using verified podcast outreach');
    } else {
      console.log('   ⚠️  Not using verified podcast outreach');
    }
  } else {
    console.log('⚠️  Procfile not found');
  }

  // 7. ENVIRONMENT VARIABLES CHECK
  console.log('\n\n🔐 ENVIRONMENT VARIABLES');
  console.log('─'.repeat(60));

  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    'FORBES_COMMAND_API_URL': !!process.env.FORBES_COMMAND_API_URL,
    'FORBES_COMMAND_API_KEY': !!process.env.FORBES_COMMAND_API_KEY,
    'STRIPE_SECRET_KEY': !!process.env.STRIPE_SECRET_KEY,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  };

  Object.entries(requiredVars).forEach(([varName, exists]) => {
    console.log(`${exists ? '✅' : '❌'} ${varName}`);
  });

  // 8. SUMMARY
  console.log('\n\n📋 AUDIT SUMMARY');
  console.log('═'.repeat(60));

  const verifiedAttorneys = validEmails?.length || 0;
  const readyCount = readyForOutreach?.length || 0;

  console.log(`Total Attorneys: ${totalCount}`);
  console.log(`Verified (Valid Email): ${verifiedAttorneys}`);
  console.log(`Ready for Outreach: ${readyCount}`);
  console.log(`Already Contacted: ${contactedCount}`);
  console.log(`Placeholder Emails: ${placeholderEmails?.length || 0}`);
  console.log('');

  if (readyCount > 0) {
    console.log(`✅ ${readyCount} attorneys ready for verified podcast outreach`);
  }

  if ((placeholderEmails?.length || 0) > 0) {
    console.log(`⚠️  ${placeholderEmails?.length} attorneys need email enrichment`);
  }

  console.log('\n✨ Audit complete!\n');
}

main().catch(console.error);
