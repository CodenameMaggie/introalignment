import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * GET /api/matches
 * Get all matches for the current user
 */
export async function GET(request: NextRequest) {
  // Get userId from query or session
  // For now, we'll assume it's passed in the URL or we get it from auth header
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Get status filter from query params
  const status = searchParams.get('status');

  // Build query
  let query = supabase
    .from('matches')
    .select(`
      *,
      user_a:users!matches_user_a_id_fkey (
        id,
        full_name,
        profiles (
          age,
          location_city,
          location_country,
          gender
        )
      ),
      user_b:users!matches_user_b_id_fkey (
        id,
        full_name,
        profiles (
          age,
          location_city,
          location_country,
          gender
        )
      ),
      introduction_reports (
        executive_summary
      )
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  // Filter by status if provided
  if (status) {
    query = query.eq('status', status);
  }

  const { data: matches, error } = await query;

  if (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }

  // Transform matches to show the "other person" for the current user
  const transformedMatches = matches.map((match) => {
    const isUserA = match.user_a_id === userId;
    const otherUser = isUserA ? match.user_b : match.user_a;
    const myResponse = isUserA ? match.user_a_response : match.user_b_response;
    const theirResponse = isUserA ? match.user_b_response : match.user_a_response;

    return {
      id: match.id,
      otherUser: {
        id: otherUser.id,
        firstName: otherUser.full_name?.split(' ')[0] || 'Someone',
        age: otherUser.profiles?.[0]?.age,
        location: `${otherUser.profiles?.[0]?.location_city || ''}, ${otherUser.profiles?.[0]?.location_country || ''}`.trim(),
        gender: otherUser.profiles?.[0]?.gender
      },
      scores: {
        overall: match.overall_score,
        psychological: match.psychological_score,
        intellectual: match.intellectual_score,
        communication: match.communication_score,
        lifeAlignment: match.life_alignment_score,
        astrological: match.astrological_score
      },
      status: match.status,
      myResponse,
      theirResponse,
      introducedAt: match.introduced_at,
      createdAt: match.created_at,
      hasReport: !!match.introduction_reports?.[0],
      reportSummary: match.introduction_reports?.[0]?.executive_summary
    };
  });

  return NextResponse.json({ matches: transformedMatches });
}
