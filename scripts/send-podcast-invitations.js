#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'henry@introconnected.com';
const EMAIL_FROM_NAME = 'Maggie Forbes | Sovereignty Network';

async function sendPodcastInvitations() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n🎙️  Sending Podcast Invitations\n');
  console.log(`From: ${EMAIL_FROM_NAME} <${EMAIL_FROM}>\n`);

  // Get approved attorneys ready for podcast outreach
  const { data: attorneys } = await supabase
    .from('partners')
    .select('*')
    .eq('status', 'approved')
    .eq('podcast_status', 'not_contacted')
    .eq('partner_type', 'prospect')
    .not('email', 'is', null)
    .limit(5); // Send to 5 at a time

  if (!attorneys || attorneys.length === 0) {
    console.log('❌ No attorneys ready for podcast outreach');
    return;
  }

  console.log(`Found ${attorneys.length} attorneys to contact:\n`);

  // Create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let sent = 0;
  let failed = 0;

  for (const attorney of attorneys) {
    const firstName = attorney.full_name?.split(' ')[0] || 'there';

    console.log(`Sending to: ${attorney.full_name} (${attorney.email})`);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎙️ Invitation: Sovereignty Network Podcast</h1>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>

      <p>I'm Maggie Forbes, founder of the <strong>Sovereignty Network</strong> and host of our podcast series on wealth preservation and multi-generational asset protection.</p>

      <p>We're featuring leading estate planning attorneys who specialize in <strong>dynasty trusts</strong> and sophisticated wealth structures. Your expertise at <strong>${attorney.firm_name || 'your firm'}</strong> caught my attention.</p>

      <h3>Why This Podcast?</h3>
      <ul>
        <li><strong>Reach High-Net-Worth Clients</strong> - Our audience includes business owners, executives, and families with $5M+ estates</li>
        <li><strong>Establish Authority</strong> - Share your insights on dynasty trusts, asset protection, and generational wealth</li>
        <li><strong>Build Referral Network</strong> - Connect with complementary professionals (CPAs, wealth advisors, business attorneys)</li>
      </ul>

      <h3>Format</h3>
      <ul>
        <li>30-minute interview (virtual)</li>
        <li>Topics: Dynasty trusts, estate planning strategies, asset protection</li>
        <li>Published on our network + distributed to wealth advisors nationwide</li>
      </ul>

      <p><strong>Interested in joining us?</strong> Reply to this email and I'll send you available dates.</p>

      <p>Best regards,<br>
      <strong>Maggie Forbes</strong><br>
      Founder, Sovereignty Network<br>
      <a href="https://www.maggieforbesstrategies.com">maggieforbesstrategies.com</a></p>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
        📍 Licensed in: ${attorney.licensed_states?.join(', ') || 'Multiple states'}<br>
        🏛️ Source: ${attorney.source === 'actec_directory' ? 'ACTEC Fellow' : 'WealthCounsel Member'}
      </p>
    </div>
    <div class="footer">
      <p>Sovereignty Network | Wealth Preservation & Multi-Generational Asset Protection</p>
      <p><a href="mailto:${EMAIL_FROM}?subject=Unsubscribe">Unsubscribe</a> | <a href="https://www.maggieforbesstrategies.com">Visit Website</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const emailText = `
Hi ${firstName},

I'm Maggie Forbes, founder of the Sovereignty Network and host of our podcast series on wealth preservation and multi-generational asset protection.

We're featuring leading estate planning attorneys who specialize in dynasty trusts and sophisticated wealth structures. Your expertise at ${attorney.firm_name || 'your firm'} caught my attention.

WHY THIS PODCAST?
- Reach High-Net-Worth Clients - Our audience includes business owners, executives, and families with $5M+ estates
- Establish Authority - Share your insights on dynasty trusts, asset protection, and generational wealth
- Build Referral Network - Connect with complementary professionals (CPAs, wealth advisors, business attorneys)

FORMAT:
- 30-minute interview (virtual)
- Topics: Dynasty trusts, estate planning strategies, asset protection
- Published on our network + distributed to wealth advisors nationwide

Interested in joining us? Reply to this email and I'll send you available dates.

Best regards,
Maggie Forbes
Founder, Sovereignty Network
maggieforbesstrategies.com

Licensed in: ${attorney.licensed_states?.join(', ') || 'Multiple states'}
Source: ${attorney.source === 'actec_directory' ? 'ACTEC Fellow' : 'WealthCounsel Member'}

---
Sovereignty Network | Wealth Preservation & Multi-Generational Asset Protection
Unsubscribe: ${EMAIL_FROM}?subject=Unsubscribe
    `;

    try {
      await transporter.sendMail({
        from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
        to: attorney.email,
        subject: '🎙️ Podcast Invitation: Share Your Dynasty Trust Expertise',
        text: emailText,
        html: emailHtml,
        replyTo: EMAIL_FROM
      });

      // Update attorney status
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
      console.error(`   ❌ Failed:`, error.message, '\n');
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
}

sendPodcastInvitations().catch(console.error);
