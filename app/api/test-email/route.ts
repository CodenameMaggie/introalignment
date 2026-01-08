import { NextResponse } from 'next/server';
import { sendEmail, verifyConnection } from '@/lib/email/forbes-command-center';

export async function GET() {
  try {
    // Test Forbes Command Center API connection
    const connectionTest = await verifyConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        status: 'error',
        message: 'Forbes Command Center API connection failed',
        error: connectionTest.error,
        config: {
          apiUrl: process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api',
          hasApiKey: !!process.env.FORBES_COMMAND_API_KEY
        }
      }, { status: 500 });
    }

    // Send test email
    const testResult = await sendEmail({
      to: process.env.ADMIN_EMAIL || 'henry@introalignment.com',
      subject: 'IntroAlignment - Forbes Command Center Test',
      html: `
        <h1>Email Test via Forbes Command Center</h1>
        <p>This email was sent through the Forbes Command Center API.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>API URL: ${process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api'}</li>
          <li>From: ${process.env.SMTP_FROM_EMAIL || 'henry@maggieforbesstrategies.com'}</li>
          <li>Domain: ${process.env.SMTP_DOMAIN || 'maggieforbesstrategies.com'}</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
        <p>If you received this, Forbes Command Center is working correctly!</p>
      `,
      text: `Forbes Command Center Email Test - Sent at ${new Date().toISOString()}`
    });

    return NextResponse.json({
      status: 'success',
      connection: 'verified',
      emailSent: testResult.success,
      messageId: testResult.messageId,
      error: testResult.error,
      recipient: process.env.ADMIN_EMAIL || 'henry@introalignment.com',
      config: {
        apiUrl: process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api',
        from: process.env.SMTP_FROM_EMAIL || 'henry@maggieforbesstrategies.com',
        domain: process.env.SMTP_DOMAIN || 'maggieforbesstrategies.com'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
