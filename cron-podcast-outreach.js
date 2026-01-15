#!/usr/bin/env node
/**
 * Podcast Outreach - Standalone Cron Job
 *
 * Sends podcast invitations to approved attorneys via Forbes Command Center
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FORBES_API = process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api';
const FORBES_KEY = process.env.FORBES_COMMAND_API_KEY || 'forbes-command-2026';
const BUSINESS_CODE = 'IA';

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
    .benefits { background-color: #f7fafc; padding: 20px; border-left: 4px solid #d4a574; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #d4a574; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">🎙️ IntroAlignment Podcast</h1>
    <p style="margin: 10px 0 0 0;">Elite Legal Network & Podcast</p>
  </div>
  <div class="content">
    <h2>Podcast Invitation</h2>

    <p>Hi ${firstName},</p>

    <p>We came across your profile as ${professionalTitle} and were impressed by your expertise in ${specializations.join(', ')}.</p>

    <p>We'd like to invite you to be featured on the <strong>IntroAlignment Legal Podcast</strong>, where we showcase top estate planning attorneys sharing insights on dynasty trusts, asset protection, and generational wealth strategies. Our audience includes high-net-worth clients actively seeking expert counsel and fellow professionals.</p>

    <div class="podcast-badge">
      <h3 style="margin: 0 0 10px 0;">🎙️ IntroAlignment Legal Podcast</h3>
      <p style="margin: 0; opacity: 0.9;">Elite Estate Planning & Wealth Preservation Insights</p>
    </div>

    <div class="benefits">
      <p style="margin-top: 0;"><strong>What You'll Gain:</strong></p>
      <ul style="margin-bottom: 0;">
        <li><strong>Exposure:</strong> Reach high-net-worth clients actively seeking estate planning counsel</li>
        <li><strong>Authority:</strong> Establish yourself as a thought leader in wealth preservation</li>
        <li><strong>Networking:</strong> Connect with other top-tier legal professionals</li>
        <li><strong>Flexibility:</strong> 45-60 minute Zoom recordings on Wednesdays</li>
      </ul>
    </div>

    <p><strong>Typical Topics:</strong></p>
    <ul>
      <li>Dynasty trust structures and generational wealth transfer</li>
      <li>Asset protection strategies for high-net-worth families</li>
      <li>Cross-border estate planning and international tax</li>
      <li>Advanced tax optimization techniques</li>
      <li>Family office legal considerations</li>
    </ul>

    <p style="text-align: center;">
      <a href="https://calendly.com/maggie-maggieforbesstrategies/podcast-introalignment" class="button">Schedule Your Podcast Session</a>
    </p>

    <p>Sessions are recorded on Wednesdays and typically last 45-60 minutes. We handle all promotion and distribution across our network.</p>

    <p>If you'd prefer to discuss this opportunity first, simply reply to this email. I'd be happy to answer any questions.</p>

    <p style="margin-top: 40px;">Looking forward to featuring your expertise,</p>
    <p style="margin: 0;"><strong>The IntroAlignment Team</strong><br/>
    Elite Legal Network & Podcast<br/>
    Connecting Top Estate Planning Attorneys with UHNW Clients</p>
  </div>

  <div class="footer">
    <p>IntroAlignment Legal Network | Email: hello@introalignment.com</p>
    <p style="margin-top: 10px; font-size: 11px;">
      You're receiving this email because your professional profile indicates expertise in estate planning and wealth preservation.<br/>
      Not interested? <a href="mailto:hello@introalignment.com?subject=Unsubscribe%20from%20Podcast%20Invitations">Let us know</a>.
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
      subject: '🎙️ Podcast Invitation: Share Your Dynasty Trust Expertise',
      html,
      from: 'hello@introalignment.com',
      replyTo: 'hello@introalignment.com'
    })
  });

  if (!response.ok) {
    throw new Error(`Forbes API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function main() {
  console.log('\n🎙️  Podcast Outreach - Starting...\n');
  console.log(`📅 ${new Date().toISOString()}\n`);

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

  console.log(`Found ${attorneys.length} attorneys to contact\n`);

  let sent = 0;
  let failed = 0;

  for (const attorney of attorneys) {
    try {
      console.log(`Sending to: ${attorney.full_name} (${attorney.email})`);

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

      console.log(`   ✅ Sent successfully\n`);
      sent++;

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📧 Total: ${attorneys.length}\n`);

  if (sent > 0) {
    console.log('✨ Podcast invitations sent successfully!\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
