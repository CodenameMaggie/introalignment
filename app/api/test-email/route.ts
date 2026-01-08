import { NextResponse } from 'next/server';
import { sendEmail, verifyConnection } from '@/lib/email/smtp';

export async function GET() {
  try {
    // Test SMTP connection
    const connectionTest = await verifyConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        status: 'error',
        message: 'SMTP connection failed',
        error: connectionTest.error,
        config: {
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || '25',
          domain: process.env.SMTP_DOMAIN || 'introalignment.com'
        }
      }, { status: 500 });
    }

    // Send test email
    const testResult = await sendEmail({
      to: process.env.ADMIN_EMAIL || 'test@example.com',
      subject: 'IntroAlignment SMTP Port 25 Test',
      html: `
        <h1>SMTP Test Email</h1>
        <p>This email was sent via direct SMTP port 25.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>Host: ${process.env.SMTP_HOST || 'localhost'}</li>
          <li>Port: ${process.env.SMTP_PORT || '25'}</li>
          <li>Domain: ${process.env.SMTP_DOMAIN || 'introalignment.com'}</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
      `,
      text: `SMTP Test Email - Sent via port 25 at ${new Date().toISOString()}`
    });

    return NextResponse.json({
      status: 'success',
      connection: 'verified',
      emailSent: testResult.success,
      messageId: testResult.messageId,
      recipient: process.env.ADMIN_EMAIL || 'test@example.com',
      config: {
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || '25',
        domain: process.env.SMTP_DOMAIN || 'introalignment.com'
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
