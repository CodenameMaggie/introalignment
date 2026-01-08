import { NextResponse } from 'next/server';
import { verifyConnection, sendEmail } from '@/lib/email/smtp';
import { createClient } from 'net';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    config: {
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || '25',
      domain: process.env.SMTP_DOMAIN || 'introalignment.com'
    },
    tests: {}
  };

  // Test 1: TCP Port connectivity
  try {
    await new Promise((resolve, reject) => {
      const socket = createClient({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '25', 10),
        timeout: 5000
      });

      socket.on('connect', () => {
        results.tests.tcpConnection = {
          status: 'SUCCESS',
          message: `Port ${process.env.SMTP_PORT} is reachable`
        };
        socket.end();
        resolve(true);
      });

      socket.on('error', (err: Error) => {
        results.tests.tcpConnection = {
          status: 'FAILED',
          error: err.message
        };
        reject(err);
      });

      socket.on('timeout', () => {
        results.tests.tcpConnection = {
          status: 'FAILED',
          error: 'Connection timeout'
        };
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  } catch (error: any) {
    results.tests.tcpConnection = {
      status: 'FAILED',
      error: error.message
    };
  }

  // Test 2: SMTP Connection verification
  try {
    const smtpTest = await verifyConnection();
    results.tests.smtpVerification = {
      status: smtpTest.success ? 'SUCCESS' : 'FAILED',
      message: smtpTest.success ? 'SMTP handshake successful' : smtpTest.error
    };
  } catch (error: any) {
    results.tests.smtpVerification = {
      status: 'FAILED',
      error: error.message
    };
  }

  // Test 3: Send test email (if admin email configured)
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== 'henry@introalignment.com') {
    try {
      const emailTest = await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'IntroAlignment SMTP Test',
        html: `
          <h2>SMTP Connection Test</h2>
          <p>This is a test email from IntroAlignment.</p>
          <p><strong>Server:</strong> ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `,
        text: `SMTP Connection Test from ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`
      });

      results.tests.emailSend = {
        status: emailTest.success ? 'SUCCESS' : 'FAILED',
        messageId: emailTest.messageId,
        error: emailTest.error,
        recipient: process.env.ADMIN_EMAIL
      };
    } catch (error: any) {
      results.tests.emailSend = {
        status: 'FAILED',
        error: error.message
      };
    }
  } else {
    results.tests.emailSend = {
      status: 'SKIPPED',
      message: 'ADMIN_EMAIL not configured'
    };
  }

  // Overall status
  const allTests = Object.values(results.tests);
  const failedTests = allTests.filter((t: any) => t.status === 'FAILED');
  const successTests = allTests.filter((t: any) => t.status === 'SUCCESS');

  results.overall = {
    status: failedTests.length === 0 ? 'HEALTHY' : 'DEGRADED',
    passed: successTests.length,
    failed: failedTests.length,
    total: allTests.length
  };

  return NextResponse.json(results, {
    status: failedTests.length === 0 ? 200 : 500
  });
}
