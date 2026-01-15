#!/usr/bin/env node
/**
 * Attorney Newsletter - Weekly Digest
 *
 * Sends weekly newsletter to all subscribed attorneys
 * Content: Legal insights, case studies, networking opportunities
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FORBES_API = process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api';
const FORBES_KEY = process.env.FORBES_COMMAND_API_KEY || 'forbes-command-2026';
const BUSINESS_CODE = 'IA';
const NEWSLETTER_ENABLED = process.env.NEWSLETTER_ENABLED !== 'false'; // Default enabled

// Newsletter content for this week
const NEWSLETTER_CONTENT = {
  week: 'Week of January 15, 2026',
  headline: 'Dynasty Trust Strategies for 2026',
  articles: [
    {
      title: '🏛️ New Estate Tax Exemption Changes',
      summary: 'The IRS announced updates to estate tax exemptions. Here\'s what your high-net-worth clients need to know.',
      link: 'https://introalignment.com/insights/estate-tax-2026',
      category: 'Tax Planning'
    },
    {
      title: '💼 Multi-Generational Wealth Structures',
      summary: 'Case study: How one family preserved $50M across 4 generations using dynasty trusts and LLCs.',
      link: 'https://introalignment.com/case-studies/multi-gen-wealth',
      category: 'Case Study'
    },
    {
      title: '🤝 Networking Spotlight',
      summary: 'Meet 3 estate planning attorneys who joined our podcast this month and shared their expertise.',
      link: 'https://introalignment.com/podcast',
      category: 'Community'
    }
  ],
  upcomingEvents: [
    {
      title: 'Dynasty Trust Masterclass Webinar',
      date: 'January 25, 2026 @ 2 PM EST',
      link: 'https://introalignment.com/events/dynasty-trust-masterclass'
    },
    {
      title: 'IntroAlignment Attorney Networking Happy Hour',
      date: 'January 30, 2026 @ 5 PM EST (Virtual)',
      link: 'https://introalignment.com/events/networking-happy-hour'
    }
  ],
  podcastSpotlight: {
    title: 'Latest Podcast Episode',
    guest: 'Sarah Mitchell, ACTEC Fellow',
    topic: 'Advanced Asset Protection Strategies for Ultra-High-Net-Worth Families',
    link: 'https://introalignment.com/podcast/sarah-mitchell'
  }
};

async function sendNewsletter(attorney) {
  const firstName = attorney.full_name?.split(' ')[0] || 'there';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #2c3e50; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa; }
    .container { background: white; }
    .header { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 2px; }
    .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; font-style: italic; }
    .content { padding: 40px 30px; }
    .headline { font-size: 24px; color: #2c3e50; margin: 0 0 10px 0; font-weight: normal; }
    .week-label { color: #7f8c8d; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 30px 0; }
    .article { margin: 30px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #d4a574; border-radius: 4px; }
    .article-title { font-size: 18px; margin: 0 0 10px 0; color: #2c3e50; }
    .article-category { display: inline-block; background: #d4a574; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .article-summary { margin: 10px 0; color: #555; font-size: 15px; }
    .read-more { color: #d4a574; text-decoration: none; font-weight: bold; font-size: 14px; }
    .section-title { font-size: 20px; color: #2c3e50; margin: 40px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #d4a574; }
    .event { margin: 15px 0; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; }
    .event-title { font-size: 16px; color: #2c3e50; margin: 0 0 5px 0; font-weight: bold; }
    .event-date { color: #7f8c8d; font-size: 14px; margin: 0; }
    .podcast-spotlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; margin: 30px 0; }
    .podcast-spotlight h3 { margin: 0 0 10px 0; font-size: 18px; }
    .podcast-spotlight p { margin: 5px 0; opacity: 0.95; }
    .cta-button { display: inline-block; background: #d4a574; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 15px 0; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; font-size: 13px; }
    .footer a { color: #d4a574; text-decoration: none; }
    .social-links { margin: 15px 0; }
    .social-links a { color: #d4a574; margin: 0 10px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>INTROALIGNMENT</h1>
      <p>Elite Legal Network Newsletter</p>
    </div>

    <div class="content">
      <p class="week-label">${NEWSLETTER_CONTENT.week}</p>
      <h2 class="headline">${NEWSLETTER_CONTENT.headline}</h2>

      <p>Hi ${firstName},</p>

      <p>Welcome to this week's IntroAlignment newsletter. Here are the latest insights, case studies, and opportunities for estate planning attorneys in our network.</p>

      ${NEWSLETTER_CONTENT.articles.map(article => `
        <div class="article">
          <span class="article-category">${article.category}</span>
          <h3 class="article-title">${article.title}</h3>
          <p class="article-summary">${article.summary}</p>
          <a href="${article.link}" class="read-more">Read Full Article →</a>
        </div>
      `).join('')}

      <div class="podcast-spotlight">
        <h3>🎙️ ${NEWSLETTER_CONTENT.podcastSpotlight.title}</h3>
        <p><strong>Guest:</strong> ${NEWSLETTER_CONTENT.podcastSpotlight.guest}</p>
        <p><strong>Topic:</strong> ${NEWSLETTER_CONTENT.podcastSpotlight.topic}</p>
        <a href="${NEWSLETTER_CONTENT.podcastSpotlight.link}" class="cta-button" style="color: white;">Listen Now</a>
      </div>

      <h3 class="section-title">📅 Upcoming Events</h3>

      ${NEWSLETTER_CONTENT.upcomingEvents.map(event => `
        <div class="event">
          <p class="event-title">${event.title}</p>
          <p class="event-date">${event.date}</p>
          <a href="${event.link}" class="read-more">Register →</a>
        </div>
      `).join('')}

      <div style="margin: 40px 0; padding: 25px; background: #f8f9fa; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 10px 0;">Want to Be Featured?</h3>
        <p style="margin: 0 0 15px 0;">Join our podcast and share your expertise with high-net-worth clients nationwide.</p>
        <a href="https://introalignment.com/podcast-booking" class="cta-button">Schedule Your Podcast Session</a>
      </div>

      <p style="margin-top: 40px; color: #7f8c8d; font-size: 14px;">
        That's all for this week! We're always looking to feature exceptional estate planning attorneys. If you have insights to share or want to contribute to future newsletters, simply reply to this email.
      </p>

      <p style="margin-top: 20px;">Best regards,<br>
      <strong>Maggie Forbes</strong><br>
      Founder, IntroAlignment Legal Network</p>
    </div>

    <div class="footer">
      <p><strong>IntroAlignment Legal Network</strong></p>
      <p>Connecting Elite Estate Planning Attorneys with High-Net-Worth Clients</p>

      <div class="social-links">
        <a href="https://introalignment.com">Website</a> |
        <a href="https://introalignment.com/podcast">Podcast</a> |
        <a href="https://introalignment.com/community">Community</a> |
        <a href="mailto:hello@introalignment.com">Contact</a>
      </div>

      <p style="margin-top: 20px; font-size: 11px; opacity: 0.8;">
        You're receiving this newsletter as a member of the IntroAlignment Legal Network.<br>
        <a href="mailto:hello@introalignment.com?subject=Unsubscribe%20from%20Newsletter">Unsubscribe</a> |
        <a href="mailto:hello@introalignment.com?subject=Update%20Preferences">Update Preferences</a>
      </p>
    </div>
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
      subject: `📰 ${NEWSLETTER_CONTENT.headline} | IntroAlignment Weekly`,
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
  console.log('\n📰 Newsletter Sender - Starting...\n');
  console.log(`📅 ${new Date().toISOString()}\n`);

  if (!NEWSLETTER_ENABLED) {
    console.log('⏸️  Newsletter sending DISABLED (set NEWSLETTER_ENABLED=true to enable)\n');
    process.exit(0);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all attorneys who haven't unsubscribed
  // Send to partners who have been contacted at least once (not_contacted excluded)
  const { data: attorneys } = await supabase
    .from('partners')
    .select('*')
    .not('podcast_status', 'eq', 'not_contacted')
    .eq('email_unsubscribed', false)
    .not('email', 'is', null)
    .limit(100); // Send to 100 at a time

  if (!attorneys || attorneys.length === 0) {
    console.log('⏸️  No subscribers found for newsletter\n');
    process.exit(0);
  }

  console.log(`Found ${attorneys.length} subscribers\n`);

  let sent = 0;
  let failed = 0;

  for (const attorney of attorneys) {
    try {
      console.log(`Sending to: ${attorney.full_name} (${attorney.email})`);

      await sendNewsletter(attorney);

      console.log(`   ✅ Sent successfully\n`);
      sent++;

      // Rate limiting - don't overwhelm the email server
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between emails

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
    console.log('✨ Newsletter sent successfully!\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
