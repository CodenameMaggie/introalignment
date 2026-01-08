/**
 * SMTP Email Service (Port 25)
 * Direct mail server integration
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailParams {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

// Create SMTP transporter (lazy initialization)
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST || 'localhost';
  const smtpPort = parseInt(process.env.SMTP_PORT || '25', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true'; // false for port 25

  console.log(`[SMTP] Initializing mail server: ${smtpHost}:${smtpPort}`);

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? {
      user: smtpUser,
      pass: smtpPass,
    } : undefined,
    // Connection options for port 25
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    // Allow self-signed certificates for local development
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  return transporter;
}

/**
 * Send email via SMTP port 25
 */
export async function sendEmail(params: EmailParams): Promise<{success: boolean; error?: string; messageId?: string}> {
  try {
    const transport = getTransporter();

    // Prepare email
    const mailOptions = {
      from: params.from || `IntroAlignment <noreply@${process.env.SMTP_DOMAIN || 'introalignment.com'}>`,
      to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo
    };

    // Send email
    const info = await transport.sendMail(mailOptions);

    console.log('[SMTP] Email sent:', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: params.subject,
      response: info.response
    });

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error: any) {
    console.error('[SMTP] Email send failed:', error);
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

/**
 * Verify SMTP connection
 */
export async function verifyConnection(): Promise<{success: boolean; error?: string}> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('[SMTP] Connection verified successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[SMTP] Connection verification failed:', error);
    return { success: false, error: error.message };
  }
}
