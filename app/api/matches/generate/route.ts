import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createMatchesForUser } from '@/lib/matching/auto-matcher';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/matches/generate
 *
 * Generate matches for a user who completed onboarding
 * Can be called manually or triggered automatically when conversation completes
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Verify user exists and has completed onboarding
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        conversations(is_complete)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if conversation is complete
    const conversation = user.conversations?.[0];
    if (!conversation || !conversation.is_complete) {
      return NextResponse.json(
        { error: 'User has not completed onboarding conversation' },
        { status: 400 }
      );
    }

    // Generate matches
    const matchesCreated = await createMatchesForUser(userId);

    // Update user status
    if (matchesCreated > 0) {
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      matchesCreated,
      message: matchesCreated > 0
        ? `Created ${matchesCreated} potential matches`
        : 'No compatible matches found yet - more users needed in pool'
    });

  } catch (error: any) {
    console.error('Match generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate matches' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/generate?userId=xxx
 *
 * Check if matches have been generated for a user
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Count existing matches
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id', { count: 'exact' })
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      userId,
      matchCount: matches?.length || 0,
      hasMatches: (matches?.length || 0) > 0
    });

  } catch (error: any) {
    console.error('Match check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check matches' },
      { status: 500 }
    );
  }
}
