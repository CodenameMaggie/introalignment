import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * POST /api/matches/respond
 * Respond to a match (interested/not_interested/maybe)
 */
export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const { matchId, response, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!matchId || !response) {
      return NextResponse.json(
        { error: 'matchId and response are required' },
        { status: 400 }
      );
    }

    if (!['interested', 'not_interested', 'maybe'].includes(response)) {
      return NextResponse.json(
        { error: 'response must be interested, not_interested, or maybe' },
        { status: 400 }
      );
    }

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is part of this match
    if (match.user_a_id !== userId && match.user_b_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Determine which user is responding
    const isUserA = match.user_a_id === userId;

    // Prepare update
    const updates: any = {
      ...(isUserA
        ? {
            user_a_response: response,
            user_a_responded_at: new Date().toISOString()
          }
        : {
            user_b_response: response,
            user_b_responded_at: new Date().toISOString()
          })
    };

    // Check if both users have responded
    const otherUserResponse = isUserA ? match.user_b_response : match.user_a_response;

    if (otherUserResponse) {
      // Both users have responded - update status
      if (response === 'interested' && otherUserResponse === 'interested') {
        updates.status = 'connected';
        updates.introduced_at = new Date().toISOString();
      } else if (response === 'not_interested' || otherUserResponse === 'not_interested') {
        updates.status = 'declined';
      } else {
        updates.status = 'introduced'; // At least one person is interested or maybe
      }
    } else {
      // First response
      if (response === 'interested') {
        updates.status = 'introduced';
      }
    }

    // Update the match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating match:', updateError);
      return NextResponse.json(
        { error: 'Failed to update match' },
        { status: 500 }
      );
    }

    // If both users are interested, enable messaging
    if (updatedMatch.status === 'connected') {
      return NextResponse.json({
        success: true,
        mutualMatch: true,
        message: "It's a match! You can now message each other."
      });
    }

    return NextResponse.json({
      success: true,
      mutualMatch: false,
      message: 'Response recorded. Waiting for their response.'
    });
  } catch (error) {
    console.error('Error in respond endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
