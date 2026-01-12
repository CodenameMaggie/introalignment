import { NextResponse } from 'next/server';
import { verifyConnection, sendEmail } from '@/lib/email/forbes-command-center';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    config: {
      system: 'Forbes Command Center (Port 25)',
      api_url: process.env.FORBES_COMMAND_API_URL || 'http://5.78.139.9:3000/api/email-api',
      business_code: 'IA'
    },
    tests: {}
  };

  // Test 1: Forbes Command Center API connectivity
  try {
    const apiTest = await verifyConnection();
    results.tests.apiConnection = {
      status: apiTest.success ? 'SUCCESS' : 'FAILED',
      message: apiTest.success ? 'Forbes Command Center API connected' : apiTest.error
    };
  } catch (error: any) {
    results.tests.apiConnection = {
      status: 'FAILED',
      error: error.message
    };
  }

  // Test 2: Send test email (if admin email configured)
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== 'henry@introalignment.com') {
    try {
      const emailTest = await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'IntroAlignment Email System Test',
        html: `
          <h2>Forbes Command Center Email Test</h2>
          <p>This is a test email from IntroAlignment legal services network.</p>
          <p><strong>System:</strong> Forbes Command Center (Port 25)</p>
          <p><strong>Business Code:</strong> IA</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `,
        text: `Forbes Command Center Email Test for IntroAlignment (IA) - ${new Date().toISOString()}`
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
