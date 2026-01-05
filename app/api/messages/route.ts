import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * GET /api/messages?matchId=xxx&userId=xxx
 * Get all messages for a match
 */
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  // Verify user is part of this match
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.user_a_id !== userId && match.user_b_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Only allow messages if match is connected
  if (match.status !== 'connected') {
    return NextResponse.json(
      { error: 'Messages not available until both users are interested' },
      { status: 403 }
    );
  }

  // Get messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey (
        id,
        full_name
      )
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  return NextResponse.json({ messages });
}

/**
 * POST /api/messages
 * Send a new message
 */
export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const { matchId, content, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!matchId || !content) {
      return NextResponse.json(
        { error: 'matchId and content are required' },
        { status: 400 }
      );
    }

    // Verify user is part of this match and it's connected
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.user_a_id !== userId && match.user_b_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (match.status !== 'connected') {
      return NextResponse.json(
        { error: 'Can only message after both users are interested' },
        { status: 403 }
      );
    }

    // Create message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: userId,
        content: content.trim()
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          full_name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in messages endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
