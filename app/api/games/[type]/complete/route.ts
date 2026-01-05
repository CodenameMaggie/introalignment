import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gameId } = body;

    // Get game details
    const { data: game } = await supabase
      .from('games')
      .select('points_value')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find or create today's engagement session
    const { data: existingSession } = await supabase
      .from('engagement_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .single();

    let session;
    let streak = 1;

    if (existingSession) {
      session = existingSession;
      streak = existingSession.current_streak || 1;
    } else {
      // Check yesterday's session to calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdaySession } = await supabase
        .from('engagement_sessions')
        .select('current_streak')
        .eq('user_id', user.id)
        .gte('created_at', yesterdayStr)
        .lt('created_at', today)
        .single();

      // If played yesterday, increment streak; otherwise reset to 1
      if (yesterdaySession) {
        streak = (yesterdaySession.current_streak || 0) + 1;
      }

      // Create new session for today
      const { data: newSession } = await supabase
        .from('engagement_sessions')
        .insert({
          user_id: user.id,
          daily_game_completed: true,
          current_streak: streak,
          longest_streak: streak,
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      session = newSession;
    }

    // Update session if it already existed
    if (existingSession) {
      const longestStreak = Math.max(
        session.longest_streak || 0,
        streak
      );

      await supabase
        .from('engagement_sessions')
        .update({
          daily_game_completed: true,
          current_streak: streak,
          longest_streak: longestStreak,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', session.id);
    }

    // Award points to user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', user.id)
      .single();

    const newTotalPoints = (profile?.total_points || 0) + game.points_value;

    await supabase
      .from('profiles')
      .update({ total_points: newTotalPoints })
      .eq('id', user.id);

    // TODO: Check for badges/achievements based on streak and points
    // For now, return basic response

    return NextResponse.json({
      success: true,
      streak,
      points: game.points_value,
      totalPoints: newTotalPoints
    });
  } catch (error) {
    console.error('Error completing game:', error);
    return NextResponse.json(
      { error: 'Failed to complete game' },
      { status: 500 }
    );
  }
}
