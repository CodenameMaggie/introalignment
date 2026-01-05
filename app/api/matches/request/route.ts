import { NextRequest, NextResponse } from 'next/server';
import { generateMatchesForUser } from '@/lib/matching/match-generator';
import { generateIntroductionReport } from '@/lib/matching/report-generator';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * POST /api/matches/request
 *
 * User-triggered match generation (NO CRON JOBS)
 *
 * This is called when:
 * 1. A user completes their profile and wants to see matches
 * 2. A user clicks "Find My Matches" button
 * 3. A user requests new matches after viewing existing ones
 *
 * This ensures we ONLY generate matches when real clients need them.
 * No wasted compute, no wasted AI tokens.
 */
export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify user exists and has completed profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, profiles (*)')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'User must complete profile first' },
        { status: 400 }
      );
    }

    console.log(`Generating matches for user ${userId}...`);

    // Generate matches for this specific user
    const newMatches = await generateMatchesForUser(userId, {
      minOverallScore: 70,
      maxMatchesPerUser: 3,
      respectUserPreferences: true,
      excludeExistingMatches: true
    });

    if (newMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new matches found that meet your criteria.',
        matchesGenerated: 0
      });
    }

    // Insert matches into database
    const matchIds: string[] = [];
    for (const match of newMatches) {
      const { data: insertedMatch, error: insertError } = await supabase
        .from('matches')
        .insert({
          user_a_id: match.userAId,
          user_b_id: match.userBId,
          overall_score: match.overallScore,
          psychological_score: match.psychologicalScore,
          intellectual_score: match.intellectualScore,
          astrological_score: match.astrologicalScore,
          communication_score: match.communicationScore,
          life_alignment_score: match.lifeAlignmentScore,
          score_details: match.scoreDetails,
          status: 'pending'
        })
        .select()
        .single();

      if (!insertError && insertedMatch) {
        matchIds.push(insertedMatch.id);
      }
    }

    // Generate introduction reports for each match
    // Note: This will use placeholder reports unless ENABLE_AI_REPORTS=true
    const reportResults = {
      generated: 0,
      errors: [] as string[]
    };

    for (const matchId of matchIds) {
      try {
        await generateIntroductionReport(matchId);
        reportResults.generated++;
      } catch (error: any) {
        reportResults.errors.push(error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Found ${newMatches.length} great ${newMatches.length === 1 ? 'match' : 'matches'} for you!`,
      matchesGenerated: newMatches.length,
      reportsGenerated: reportResults.generated,
      reportErrors: reportResults.errors.length > 0 ? reportResults.errors : undefined
    });
  } catch (error: any) {
    console.error('Error generating matches:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate matches'
      },
      { status: 500 }
    );
  }
}
