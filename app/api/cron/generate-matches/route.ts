import { NextRequest, NextResponse } from 'next/server';
import { generateMatchesBatch } from '@/lib/matching/match-generator';
import { generateReportsBatch } from '@/lib/matching/report-generator';

// Force dynamic rendering - prevent build-time execution
export const dynamic = 'force-dynamic';
export const revalidate = 0;


/**
 * POST /api/cron/generate-matches
 *
 * ⚠️ TODO: DO NOT USE UNTIL YOU HAVE REAL CLIENTS ⚠️
 *
 * This endpoint should ONLY be called when:
 * 1. You have real paying clients who need matches
 * 2. A user manually requests match generation
 * 3. A user signs up and completes their profile
 *
 * DO NOT set up automated cron jobs until you have real users!
 *
 * Match generation is free (just database queries), but AI report generation
 * costs money via Claude API. Set ENABLE_AI_REPORTS=true only when ready.
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
