import { NextRequest, NextResponse } from 'next/server';
import { generateMatchesBatch } from '@/lib/matching/match-generator';
import { generateReportsBatch } from '@/lib/matching/report-generator';

/**
 * POST /api/cron/generate-matches
 * Cron job to generate matches and introduction reports
 *
 * This should be called daily or weekly via a cron scheduler (Vercel Cron, Railway Cron, etc.)
 *
 * Authorization: Bearer token set in CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret-key'}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting match generation batch...');

    // Step 1: Generate matches
    const matchResult = await generateMatchesBatch({
      minOverallScore: 70,
      maxMatchesPerUser: 3,
      respectUserPreferences: true,
      excludeExistingMatches: true
    });

    console.log('Match generation complete:', matchResult);

    // Step 2: Generate introduction reports for new matches
    const reportResult = await generateReportsBatch();

    console.log('Report generation complete:', reportResult);

    // Return results
    return NextResponse.json({
      success: true,
      matches: {
        runId: matchResult.runId,
        usersEvaluated: matchResult.usersEvaluated,
        matchesGenerated: matchResult.matchesGenerated,
        errors: matchResult.errors
      },
      reports: {
        reportsGenerated: reportResult.reportsGenerated,
        errors: reportResult.errors
      }
    });
  } catch (error: any) {
    console.error('Error in match generation cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/generate-matches
 * For manual testing (requires same authorization)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
