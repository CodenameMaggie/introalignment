/**
 * Email sending via Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailParams {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(params: EmailParams): Promise<{success: boolean; error?: string}> {
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key-here') {
    console.warn('Resend API key not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: params.from || 'IntroAlignment <hello@introalignment.com>',
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
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
          <h1>IntroAlignment</h1>
          <p>Beyond compatibility. Into alignment.</p>
        </div>

        <div class="content">
          <h2 style="font-family: 'Playfair Display', Georgia, serif; color: #2C3E50;">Welcome, ${params.firstName}!</h2>

          <p>Thank you for joining the IntroAlignment waitlist. We're building something truly different — a matchmaking service that goes beyond surface-level compatibility to help you find genuine alignment.</p>

          <p><strong>What makes IntroAlignment different?</strong></p>

          <ul>
            <li><strong>Depth over volume:</strong> No endless swiping. We focus on quality introductions that have real potential.</li>
            <li><strong>Thoughtful matching:</strong> We use comprehensive data analysis, including psychometric profiling and compatibility algorithms, to understand who you truly are.</li>
            <li><strong>Curated introductions:</strong> Every match is thoughtfully considered and purposefully made.</li>
          </ul>

          <p>We're currently in our beta phase and will be opening to new members soon. You'll be among the first to know when we launch.</p>

          <p>In the meantime, feel free to reach out if you have any questions about IntroAlignment.</p>

          <p style="margin-top: 40px;">Looking forward to helping you find your person,</p>
          <p style="margin: 0;"><strong>The IntroAlignment Team</strong></p>
        </div>

        <div class="footer">
          <p>IntroAlignment, Inc.<br />
          Email: hello@introalignment.com</p>
          <p style="margin-top: 20px; font-size: 12px;">
            You're receiving this email because you joined our waitlist at introalignment.com.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Welcome to IntroAlignment, ${params.firstName}!

Thank you for joining our waitlist. We're building something truly different — a matchmaking service that goes beyond surface-level compatibility to help you find genuine alignment.

What makes IntroAlignment different?
- Depth over volume: No endless swiping. We focus on quality introductions that have real potential.
- Thoughtful matching: We use comprehensive data analysis to understand who you truly are.
- Curated introductions: Every match is thoughtfully considered and purposefully made.

We're currently in beta and will be opening to new members soon. You'll be among the first to know when we launch.

Looking forward to helping you find your person,
The IntroAlignment Team

IntroAlignment, Inc.
Email: hello@introalignment.com`;

  return sendEmail({
    to: params.email,
    subject: `Welcome to IntroAlignment, ${params.firstName}!`,
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
          <h2 style="color: #2C3E50;">Payment Issue with Your Subscription</h2>

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
          <p>To maintain uninterrupted access to IntroAlignment, please update your payment method within the next 7 days.</p>

          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" class="button">Update Payment Method</a>
          </p>

          <p>If you have any questions or need assistance, please don't hesitate to reach out to us at billing@introalignment.com.</p>

          <p style="margin-top: 40px;">Thank you,<br />
          <strong>The IntroAlignment Team</strong></p>
        </div>

        <div class="footer">
          <p>IntroAlignment, Inc.<br />
          Email: billing@introalignment.com</p>
        </div>
      </body>
    </html>
  `;

  const text = `Payment Issue with Your Subscription

Hi ${params.firstName},

We were unable to process your recent payment of ${formattedAmount}.

This could be due to insufficient funds, an expired card, card issuer decline, or billing address mismatch.

To maintain uninterrupted access to IntroAlignment, please update your payment method within the next 7 days.

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
