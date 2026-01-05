import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * GET /api/matches/[id]
 * Get full details for a single match including introduction report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Get match with full details
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      user_a:users!matches_user_a_id_fkey (
        id,
        full_name,
        profiles (*)
      ),
      user_b:users!matches_user_b_id_fkey (
        id,
        full_name,
        profiles (*)
      ),
      introduction_reports (*)
    `)
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // Verify user is part of this match
  if (match.user_a_id !== userId && match.user_b_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Transform match data
  const isUserA = match.user_a_id === userId;
  const otherUser = isUserA ? match.user_b : match.user_a;
  const myResponse = isUserA ? match.user_a_response : match.user_b_response;
  const theirResponse = isUserA ? match.user_b_response : match.user_a_response;

  const transformedMatch = {
    id: match.id,
    otherUser: {
      id: otherUser.id,
      firstName: otherUser.full_name?.split(' ')[0] || 'Someone',
      fullName: otherUser.full_name,
      age: otherUser.profiles?.[0]?.age,
      gender: otherUser.profiles?.[0]?.gender,
      location: {
        city: otherUser.profiles?.[0]?.location_city,
        country: otherUser.profiles?.[0]?.location_country
      },
      relationshipStatus: otherUser.profiles?.[0]?.relationship_status,
      hasChildren: otherUser.profiles?.[0]?.has_children,
      wantsChildren: otherUser.profiles?.[0]?.wants_children
    },
    scores: {
      overall: match.overall_score,
      psychological: match.psychological_score,
      intellectual: match.intellectual_score,
      communication: match.communication_score,
      lifeAlignment: match.life_alignment_score,
      astrological: match.astrological_score
    },
    scoreDetails: match.score_details,
    status: match.status,
    myResponse,
    theirResponse,
    introducedAt: match.introduced_at,
    createdAt: match.created_at,
    report: match.introduction_reports?.[0] ? {
      executiveSummary: match.introduction_reports[0].executive_summary,
      compatibilityNarrative: match.introduction_reports[0].compatibility_narrative,
      growthOpportunities: match.introduction_reports[0].growth_opportunities,
      conversationStarters: match.introduction_reports[0].conversation_starters,
      potentialChallenges: match.introduction_reports[0].potential_challenges,
      astrologicalInsights: match.introduction_reports[0].astrological_insights
    } : null
  };

  return NextResponse.json({ match: transformedMatch });
}
