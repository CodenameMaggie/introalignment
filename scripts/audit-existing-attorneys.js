#!/usr/bin/env node
/**
 * Audit All Existing Attorneys
 *
 * Runs verification on all existing attorneys in database
 * Generates report of which ones pass/fail Jordan + Atlas checks
 * DOES NOT send emails - just audits data quality
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyAttorney(supabase, attorney) {
  const issues = [];
  const warnings = [];

  // Email check
  const emailValid = attorney.email &&
    !attorney.email.startsWith('pending.') &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(attorney.email);

  if (!emailValid) issues.push('Invalid email');

  // Name check
  const nameParts = attorney.full_name?.trim().split(/\s+/) || [];
  const nameValid = nameParts.length >= 2;

  if (!nameValid) issues.push('Invalid name');

  // Source check
  const credibleSources = ['actec_directory', 'wealthcounsel_directory', 'state_bar'];
  const sourceValid = credibleSources.includes(attorney.source);

  if (!sourceValid) warnings.push(`Source: ${attorney.source}`);

  // Jordan check - duplicates
  const { count: duplicates } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('email', attorney.email);

  const jordanApproved = duplicates === 1;
  if (!jordanApproved) issues.push(`${duplicates} duplicates`);

  // Atlas check - specializations
  const validSpecs = ['Estate Planning', 'Dynasty Trusts', 'Asset Protection', 'Trust Administration'];
  let atlasApproved = true;

  if (attorney.specializations && Array.isArray(attorney.specializations)) {
    for (const spec of attorney.specializations) {
      if (!validSpecs.includes(spec) && !spec.includes('Planning') && !spec.includes('Trust')) {
        atlasApproved = false;
        warnings.push(`Unusual spec: ${spec}`);
      }
    }
  }

  const verified = emailValid && nameValid && sourceValid && jordanApproved && atlasApproved && issues.length === 0;

  return {
    verified,
    issues,
    warnings
  };
}

async function main() {
  console.log('\n🔍 Attorney Data Quality Audit\n');
  console.log('Checking all attorneys against Jordan + Atlas standards...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: attorneys } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false });

  if (!attorneys || attorneys.length === 0) {
    console.log('No attorneys found in database.\n');
    return;
  }

  console.log(`Found ${attorneys.length} attorneys to audit\n`);

  let verified = 0;
  let rejected = 0;
  const rejectedList = [];

  for (const attorney of attorneys) {
    const result = await verifyAttorney(supabase, attorney);

    if (result.verified) {
      verified++;
      console.log(`✅ ${attorney.full_name} (${attorney.email})`);
    } else {
      rejected++;
      console.log(`❌ ${attorney.full_name} (${attorney.email})`);
      console.log(`   Issues: ${result.issues.join(', ')}`);
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.join(', ')}`);
      }
      rejectedList.push({
        name: attorney.full_name,
        email: attorney.email,
        issues: result.issues,
        warnings: result.warnings
      });
    }
  }

  console.log(`\n📊 Audit Summary:`);
  console.log(`   ✅ Verified (ready for outreach): ${verified}`);
  console.log(`   ❌ Rejected (need fixing): ${rejected}`);
  console.log(`   📧 Total audited: ${attorneys.length}`);
  console.log(`   📈 Pass rate: ${Math.round((verified / attorneys.length) * 100)}%\n`);

  if (rejectedList.length > 0) {
    console.log(`⚠️  Rejected attorneys (cannot send outreach):\n`);
    rejectedList.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name} (${r.email})`);
      console.log(`   ${r.issues.join(', ')}`);
    });
    console.log('');
  }

  console.log('✨ Audit complete!\n');
}

main().catch(console.error);
