/**
 * Forbes Command Center Email API
 * Centralized email sending for all businesses via Port 25
 */

export interface EmailParams {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

const FORBES_COMMAND_API = process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api';
const FORBES_COMMAND_KEY = process.env.FORBES_COMMAND_API_KEY || 'forbes-command-2026';
const BUSINESS_CODE = 'IA'; // SovereigntyIntroAlignment business code

/**
 * Send email via Forbes Command Center API
 */
export async function sendEmail(params: EmailParams): Promise<{success: boolean; error?: string; messageId?: string}> {
  try {
    const response = await fetch(FORBES_COMMAND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'send',
        api_key: FORBES_COMMAND_KEY,
        business: BUSINESS_CODE,
        to: Array.isArray(params.to) ? params.to[0] : params.to, // API expects single recipient
        subject: params.subject,
        html: params.html,
        from: params.from || process.env.SMTP_FROM_EMAIL || 'henry@maggieforbesstrategies.com',
        replyTo: params.replyTo
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('[Forbes Command Center] API error:', errorData);
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();

    console.log('[Forbes Command Center] Email sent:', {
      messageId: data.messageId,
      to: params.to,
      subject: params.subject
    });

    return {
      success: true,
      messageId: data.messageId
    };

  } catch (error: any) {
    console.error('[Forbes Command Center] Request failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send waitlist welcome email
 */
export async function sendWaitlistWelcome(params: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<{success: boolean; error?: string}> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #2C3E50;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 2px solid #D4A574;
          }
          .header h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 32px;
            margin: 0;
            color: #2C3E50;
          }
          .header p {
            font-style: italic;
            color: #D4A574;
            margin-top: 8px;
          }
          .content {
            padding: 40px 0;
          }
          .footer {
            text-align: center;
            padding-top: 40px;
            border-top: 1px solid #E2E0DB;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>IntroAlignment</h1>
          <p>Elite Legal Network for Estate Planning Attorneys</p>
        </div>

        <div class="content">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; color: #2C3E50;">Welcome, ${params.firstName}!</h2>

          <p>Thank you for your interest in IntroAlignment. We're building an exclusive network connecting estate planning attorneys with high-net-worth clients seeking sophisticated legal services.</p>

          <p><strong>What makes IntroAlignment different?</strong></p>

          <ul>
            <li><strong>Quality over quantity:</strong> We focus on qualified estate planning attorneys (5+ years experience) serving $10M+ estates.</li>
            <li><strong>Specialized matching:</strong> Dynasty trusts, asset protection, multi-generational wealth planning.</li>
            <li><strong>Professional support:</strong> Podcast opportunities, client referrals, and networking.</li>
          </ul>

          <p>We're currently building our network and will be contacting qualified attorneys soon. You'll be among the first to know when partnership opportunities become available.</p>

          <p>In the meantime, feel free to reach out if you have any questions about IntroAlignment.</p>

          <p style="margin-top: 40px;">Looking forward to building together,</p>
          <p style="margin: 0;"><strong>The IntroAlignment Team</strong></p>
        </div>

        <div class="footer">
          <p>IntroAlignment Legal Network<br />
          Email: hello@introalignment.com</p>
          <p style="margin-top: 20px; font-size: 12px;">
            You're receiving this email because you expressed interest in joining our legal network at introalignment.com.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Welcome to IntroAlignment, ${params.firstName}!

Thank you for your interest in IntroAlignment. We're building an exclusive network connecting estate planning attorneys with high-net-worth clients seeking sophisticated legal services.

What makes IntroAlignment different?
- Quality over quantity: We focus on qualified estate planning attorneys (5+ years experience) serving $10M+ estates.
- Specialized matching: Dynasty trusts, asset protection, multi-generational wealth planning.
- Professional support: Podcast opportunities (sovereigndesign.it.com), client referrals, and networking.

We're currently building our network and will be contacting qualified attorneys soon. You'll be among the first to know when partnership opportunities become available.

Looking forward to building together,
The IntroAlignment Team

IntroAlignment Legal Network
Email: hello@introalignment.com`;

  return sendEmail({
    to: params.email,
    subject: `Welcome to IntroAlignment Legal Network, ${params.firstName}`,
    html,
    text,
    replyTo: 'hello@introalignment.com'
  });
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedNotification(params: {
  email: string;
  firstName: string;
  amount: number;
  currency: string;
}): Promise<{success: boolean; error?: string}> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: params.currency.toUpperCase()
  }).format(params.amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #2C3E50;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 2px solid #D4A574;
          }
          .alert {
            background-color: #FEF2F2;
            border-left: 4px solid #EF4444;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #D4A574;
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding-top: 40px;
            border-top: 1px solid #E2E0DB;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="font-family: 'Playfair Display', Georgia, serif; margin: 0;">IntroAlignment</h1>
        </div>

        <div style="padding: 40px 0;">
          <h2 style="color: #2C3E50;">Payment Issue with Your Partnership</h2>

          <p>Hi ${params.firstName},</p>

          <div class="alert">
            <p style="margin: 0; font-weight: 600;">We were unable to process your recent payment of ${formattedAmount}.</p>
          </div>

          <p>This could be due to:</p>
          <ul>
            <li>Insufficient funds</li>
            <li>Expired card</li>
            <li>Card issuer decline</li>
            <li>Billing address mismatch</li>
          </ul>

          <p><strong>What happens next?</strong></p>
          <p>To maintain your IntroAlignment partnership benefits, please update your payment method within the next 7 days.</p>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" class="button">Update Payment Method</a>
          </p>

          <p>If you have any questions or need assistance, please don't hesitate to reach out to us at billing@introalignment.com.</p>

          <p style="margin-top: 40px;">Thank you,<br />
          <strong>The IntroAlignment Team</strong></p>
        </div>

        <div class="footer">
          <p>IntroAlignment Legal Network<br />
          Email: billing@introalignment.com</p>
        </div>
      </body>
    </html>
  `;

  const text = `Payment Issue with Your Partnership

Hi ${params.firstName},

We were unable to process your recent payment of ${formattedAmount}.

This could be due to insufficient funds, an expired card, card issuer decline, or billing address mismatch.

To maintain your IntroAlignment partnership benefits, please update your payment method within the next 7 days.

Update your payment method at: ${process.env.NEXT_PUBLIC_APP_URL}/settings/billing

If you have questions, contact us at billing@introalignment.com.

Thank you,
The IntroAlignment Team`;

  return sendEmail({
    to: params.email,
    subject: 'Payment Issue - Action Required',
    html,
    text,
    replyTo: 'billing@introalignment.com'
  });
}

/**
 * Send podcast invitation email
 */
export async function sendPodcastInvitation(params: {
  email: string;
  firstName: string;
  professionalTitle?: string;
  specializations?: string[];
}): Promise<{success: boolean; error?: string; messageId?: string}> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #2C3E50;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 2px solid #D4A574;
          }
          .header h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 32px;
            margin: 0;
            color: #2C3E50;
          }
          .header p {
            font-style: italic;
            color: #D4A574;
            margin-top: 8px;
          }
          .content {
            padding: 40px 0;
          }
          .podcast-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #D4A574;
            color: white !important;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin: 20px 0;
          }
          .benefits {
            background-color: #F7FAFC;
            padding: 20px;
            border-left: 4px solid #D4A574;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding-top: 40px;
            border-top: 1px solid #E2E0DB;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>IntroAlignment</h1>
          <p>Elite Legal Network & Podcast</p>
        </div>

        <div class="content">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; color: #2C3E50;">🎙️ Podcast Invitation</h2>

          <p>Hi ${params.firstName},</p>

          <p>I came across your profile${params.professionalTitle ? ` as ${params.professionalTitle}` : ''} and was impressed by your expertise${params.specializations && params.specializations.length > 0 ? ` in ${params.specializations.join(', ')}` : ''}.</p>

          <p>I'd love to invite you to be a guest on <strong>sovereigndesign.it.com</strong>, our podcast focused on dynasty trusts, asset protection, and legal strategies for generational wealth. We feature top estate planning attorneys sharing insights with our audience of high-net-worth clients and fellow professionals.</p>

          <div class="podcast-badge">
            <h3 style="margin: 0 0 10px 0; font-size: 24px;">🎙️ sovereigndesign.it.com</h3>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Legal Architecture for Sovereign Living</p>
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

          <p style="text-align: center; margin: 40px 0;">
            <a href="https://calendly.com/maggie-maggieforbesstrategies/podcast-introalignment" class="button">Schedule Your Podcast Session</a>
          </p>

          <p>Sessions are recorded on Wednesdays and typically last 45-60 minutes. We handle all promotion and distribution across our network.</p>

          <p>If you'd prefer to discuss this opportunity first, simply reply to this email. I'd be happy to answer any questions.</p>

          <p style="margin-top: 40px;">Looking forward to featuring your expertise,</p>
          <p style="margin: 0;"><strong>Maggie Forbes</strong><br />
          Host, sovereigndesign.it.com<br />
          IntroAlignment Legal Network</p>
        </div>

        <div class="footer">
          <p>IntroAlignment Legal Network<br />
          Email: hello@introalignment.com</p>
          <p style="margin-top: 20px; font-size: 12px;">
            You're receiving this email because your professional profile indicates expertise in estate planning and wealth preservation. <br />
            Not interested? <a href="mailto:hello@introalignment.com?subject=Unsubscribe%20from%20Podcast%20Invitations" style="color: #718096;">Let us know</a>.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `🎙️ Podcast Invitation - sovereigndesign.it.com

Hi ${params.firstName},

I came across your profile${params.professionalTitle ? ` as ${params.professionalTitle}` : ''} and was impressed by your expertise${params.specializations && params.specializations.length > 0 ? ` in ${params.specializations.join(', ')}` : ''}.

I'd love to invite you to be a guest on sovereigndesign.it.com, our podcast focused on dynasty trusts, asset protection, and legal strategies for generational wealth.

What You'll Gain:
- Exposure: Reach high-net-worth clients actively seeking estate planning counsel
- Authority: Establish yourself as a thought leader in wealth preservation
- Networking: Connect with other top-tier legal professionals
- Flexibility: 45-60 minute Zoom recordings on Wednesdays

Typical Topics:
- Dynasty trust structures and generational wealth transfer
- Asset protection strategies for high-net-worth families
- Cross-border estate planning and international tax
- Advanced tax optimization techniques
- Family office legal considerations

Schedule Your Session: https://calendly.com/maggie-maggieforbesstrategies/podcast-introalignment

If you'd prefer to discuss this opportunity first, simply reply to this email.

Looking forward to featuring your expertise,

Maggie Forbes
Host, sovereigndesign.it.com
IntroAlignment Legal Network

---
You're receiving this email because your professional profile indicates expertise in estate planning. Not interested? Reply with "unsubscribe".`;

  return sendEmail({
    to: params.email,
    subject: `Podcast Invitation: Share Your Expertise on sovereigndesign.it.com`,
    html,
    text,
    replyTo: 'hello@introalignment.com',
    from: 'maggie@maggieforbesstrategies.com'
  });
}

/**
 * Verify Forbes Command Center API connectivity
 */
export async function verifyConnection(): Promise<{success: boolean; error?: string}> {
  try {
    const response = await fetch(FORBES_COMMAND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'status',
        api_key: FORBES_COMMAND_KEY
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Forbes Command Center] Connection verified:', data);
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `API returned ${response.status}`
      };
    }
  } catch (error: any) {
    console.error('[Forbes Command Center] Connection failed:', error);
    return { success: false, error: error.message };
  }
}
