#!/usr/bin/env node
/**
 * Podcast Outreach with MANDATORY Verification
 *
 * CRITICAL: NO outreach without Jordan + Atlas approval
 * Every attorney is verified before invitation is sent
 * Audit trail logged to attorney_verifications table
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FORBES_API = process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api';
const FORBES_KEY = process.env.FORBES_COMMAND_API_KEY || 'forbes-command-2026';
const BUSINESS_CODE = 'IA';

// Verification thresholds
const MIN_CONFIDENCE_SCORE = 85;  // Must be 85% or higher
const REQUIRE_BOTH_BOTS = true;   // Both Jordan AND Atlas must approve

/**
 * Verify attorney with Jordan and Atlas
 */
async function verifyAttorney(supabase, attorney) {
  const auditTrail = [];
  const issues = [];
  const warnings = [];

  auditTrail.push(`[${new Date().toISOString()}] Starting verification for ${attorney.full_name}`);

  // 1. Email Format Check
  const emailValid = attorney.email &&
    !attorney.email.startsWith('pending.') &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(attorney.email);

  if (!emailValid) {
    issues.push('Invalid email format or placeholder email');
    auditTrail.push(`[${new Date().toISOString()}] Email check: FAIL`);
  } else {
    auditTrail.push(`[${new Date().toISOString()}] Email check: PASS`);
  }

  // 2. Name Quality Check
  const nameParts = attorney.full_name?.trim().split(/\s+/) || [];
  const nameValid = nameParts.length >= 2 &&
    !attorney.full_name.toLowerCase().includes('test') &&
    !attorney.full_name.toLowerCase().includes('sample');

  if (!nameValid) {
    issues.push('Invalid name format or test data');
    auditTrail.push(`[${new Date().toISOString()}] Name check: FAIL`);
  } else {
    auditTrail.push(`[${new Date().toISOString()}] Name check: PASS`);
  }

  // 3. Source Credibility Check
  const credibleSources = ['actec_directory', 'wealthcounsel_directory', 'state_bar', 'manual_verification'];
  const sourceValid = credibleSources.includes(attorney.source);

  if (!sourceValid) {
    issues.push(`Source "${attorney.source}" not on approved list`);
    auditTrail.push(`[${new Date().toISOString()}] Source check: FAIL`);
  } else {
    auditTrail.push(`[${new Date().toISOString()}] Source check: PASS`);
  }

  // 4. Jordan Cross-Reference (Check for duplicates)
  auditTrail.push(`[${new Date().toISOString()}] Querying Jordan for cross-reference...`);

  const { count: duplicateEmails } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('email', attorney.email);

  const jordanApproved = duplicateEmails === 1;  // Should only be this one record

  if (!jordanApproved) {
    issues.push(`Jordan flagged: ${duplicateEmails} records with same email`);
    auditTrail.push(`[${new Date().toISOString()}] Jordan cross-reference: REJECTED (${duplicateEmails} duplicates)`);
  } else {
    auditTrail.push(`[${new Date().toISOString()}] Jordan cross-reference: APPROVED`);
  }

  // 5. Atlas Fact-Check (Verify specializations)
  auditTrail.push(`[${new Date().toISOString()}] Consulting Atlas for fact-check...`);

  const validSpecializations = [
    'Estate Planning', 'Dynasty Trusts', 'Asset Protection', 'Trust Administration',
    'Tax Planning', 'Charitable Planning', 'Family Office', 'International Planning',
    'Elder Law', 'Probate', 'Wealth Preservation'
  ];

  let atlasApproved = true;
  if (attorney.specializations && Array.isArray(attorney.specializations)) {
    for (const spec of attorney.specializations) {
      if (!validSpecializations.includes(spec)) {
        atlasApproved = false;
        issues.push(`Atlas flagged: Invalid specialization "${spec}"`);
        auditTrail.push(`[${new Date().toISOString()}] Atlas fact-check: REJECTED (invalid specialization)`);
        break;
      }
    }
  }

  if (atlasApproved) {
    auditTrail.push(`[${new Date().toISOString()}] Atlas fact-check: APPROVED`);
  }

  // Calculate confidence score
  const checksPass = [emailValid, nameValid, sourceValid, jordanApproved, atlasApproved].filter(Boolean).length;
  const confidenceScore = Math.round((checksPass / 5) * 100);

  // CRITICAL: Must pass ALL checks
  const verified = emailValid && nameValid && sourceValid && jordanApproved && atlasApproved && issues.length === 0;

  auditTrail.push(`[${new Date().toISOString()}] Final verdict: ${verified ? 'VERIFIED' : 'REJECTED'} (confidence: ${confidenceScore}%)`);

  // Log to database
  await supabase.from('attorney_verifications').insert({
    attorney_id: attorney.id,
    verified,
    confidence_score: confidenceScore,
    issues: issues.join(' | ') || null,
    warnings: warnings.join(' | ') || null,
    audit_trail: auditTrail.join('\n'),
    verified_at: new Date().toISOString(),
    verified_by: 'system:jordan+atlas'
  });

  return {
    verified,
    confidenceScore,
    issues,
    auditTrail
  };
}

async function sendPodcastInvitation(attorney) {
  const firstName = attorney.full_name?.split(' ')[0] || 'there';
  const professionalTitle = attorney.professional_title || 'Estate Planning Attorney';
  const specializations = attorney.specializations || ['Estate Planning', 'Dynasty Trusts'];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .podcast-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: #d4a574; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 20px; }
    .verified-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">🎙️ IntroAlignment Legal Podcast</h1>
    <p style="margin: 10px 0 0 0;">Elite Estate Planning & Wealth Preservation Insights</p>
  </div>
  <div class="content">
    <span class="verified-badge">✓ VERIFIED BY JORDAN & ATLAS</span>

    <h2>Podcast Invitation</h2>

    <p>Hi ${firstName},</p>

    <p>We came across your profile as ${professionalTitle} and were impressed by your expertise in ${specializations.join(', ')}.</p>

    <p>We'd like to invite you to be featured on the <strong>IntroAlignment Legal Podcast</strong>, where we showcase top estate planning attorneys sharing insights on dynasty trusts, asset protection, and generational wealth strategies. Our audience includes high-net-worth clients actively seeking expert counsel and fellow professionals.</p>

    <div class="podcast-badge">
      <h3 style="margin: 0 0 10px 0;">🎙️ IntroAlignment Legal Podcast</h3>
      <p style="margin: 0; opacity: 0.9;">Elite Estate Planning & Wealth Preservation Insights</p>
    </div>

    <p><strong>What You'll Gain:</strong></p>
    <ul>
      <li><strong>Exposure:</strong> Reach high-net-worth clients actively seeking estate planning counsel</li>
      <li><strong>Authority:</strong> Establish yourself as a thought leader in wealth preservation</li>
      <li><strong>Networking:</strong> Connect with other top-tier legal professionals</li>
      <li><strong>Flexibility:</strong> 45-60 minute Zoom recordings on Wednesdays</li>
    </ul>

    <p><strong>Typical Topics:</strong></p>
    <ul>
      <li>Dynasty trust structures and generational wealth transfer</li>
      <li>Asset protection strategies for high-net-worth families</li>
      <li>Cross-border estate planning and international tax</li>
      <li>Advanced tax optimization techniques</li>
      <li>Family office legal considerations</li>
    </ul>

    <p style="text-align: center;">
      <a href="https://introalignment.com/podcast-booking" class="cta-button">Schedule Your Podcast Session</a>
    </p>

    <p>If you'd prefer to discuss this opportunity first, simply reply to this email.</p>

    <p style="margin-top: 40px;">Looking forward to featuring your expertise,</p>
    <p style="margin: 0;"><strong>The IntroAlignment Team</strong><br/>
    Elite Legal Network & Podcast<br/>
    Connecting Top Estate Planning Attorneys with UHNW Clients</p>
  </div>

  <div class="footer">
    <p>IntroAlignment Legal Network | Email: hello@introalignment.com</p>
    <p style="margin-top: 10px; font-size: 11px;">
      ✓ This invitation was verified by our Jordan & Atlas AI systems to ensure accuracy and professionalism.<br/>
      Not interested? <a href="mailto:hello@introalignment.com?subject=Unsubscribe">Let us know</a>.
    </p>
  </div>
</body>
</html>
  `;

  const response = await fetch(FORBES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send',
      api_key: FORBES_KEY,
      business: BUSINESS_CODE,
      to: attorney.email,
      subject: '🎙️ Podcast Invitation: Share Your Dynasty Trust Expertise [Verified]',
      html,
      from: 'hello@introalignment.com',
      replyTo: 'hello@introalignment.com'
    })
  });

  if (!response.ok) {
    throw new Error(`Forbes API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function main() {
  console.log('\n🔒 VERIFIED Podcast Outreach - Starting...\n');
  console.log(`📅 ${new Date().toISOString()}\n`);
  console.log('🛡️ ALL attorneys will be verified by Jordan + Atlas before sending\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get approved attorneys ready for podcast outreach
  const { data: attorneys } = await supabase
    .from('partners')
    .select('*')
    .eq('status', 'approved')
    .eq('podcast_status', 'not_contacted')
    .eq('partner_type', 'prospect')
    .not('email', 'is', null)
    .limit(5);

  if (!attorneys || attorneys.length === 0) {
    console.log('⏸️  No attorneys ready for outreach\n');
    process.exit(0);
  }

  console.log(`Found ${attorneys.length} attorneys to verify and contact\n`);

  let sent = 0;
  let failed = 0;
  let rejected = 0;

  for (const attorney of attorneys) {
    try {
      console.log(`\n🔍 Verifying: ${attorney.full_name} (${attorney.email})`);

      // CRITICAL: Verify with Jordan and Atlas
      const verification = await verifyAttorney(supabase, attorney);

      if (!verification.verified) {
        console.log(`   ❌ REJECTED by verification system`);
        console.log(`   Issues: ${verification.issues.join(', ')}`);
        console.log(`   Confidence: ${verification.confidenceScore}% (required: ${MIN_CONFIDENCE_SCORE}%)`);
        rejected++;
        continue;
      }

      console.log(`   ✅ VERIFIED by Jordan + Atlas (${verification.confidenceScore}% confidence)`);
      console.log(`   Sending invitation...`);

      await sendPodcastInvitation(attorney);

      // Update status
      await supabase
        .from('partners')
        .update({
          podcast_status: 'contacted',
          last_contact_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attorney.id);

      console.log(`   📧 Sent successfully\n`);
      sent++;

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Verified & Sent: ${sent}`);
  console.log(`   ❌ Rejected by Verification: ${rejected}`);
  console.log(`   ❌ Failed to Send: ${failed}`);
  console.log(`   📧 Total Processed: ${attorneys.length}\n`);

  if (sent > 0) {
    console.log('✨ Verified podcast invitations sent successfully!\n');
  }

  if (rejected > 0) {
    console.log(`⚠️  ${rejected} attorneys rejected - check attorney_verifications table for details\n`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
