import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

// GET /api/engagement/streak - Get user's streak and engagement stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Get today's session
    const { data: todaySession } = await supabase
      .from('engagement_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', today)
      .single();

    // Get last 7 days of sessions for activity calendar
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: recentSessions } = await supabase
      .from('engagement_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('session_date', sevenDaysAgoStr)
      .order('session_date', { ascending: false });

    // Get total stats
    const { data: allSessions } = await supabase
      .from('engagement_sessions')
      .select('total_points')
      .eq('user_id', userId);

    const totalPoints = allSessions?.reduce((sum, s) => sum + (s.total_points || 0), 0) || 0;

    return NextResponse.json({
      streak: {
        current: todaySession?.current_streak || 0,
        longest: todaySession?.longest_streak || 0
      },
      today: {
        points_earned: todaySession?.points_earned_today || 0,
        daily_game_completed: todaySession?.daily_game_completed || false,
        daily_puzzle_completed: todaySession?.daily_puzzle_completed || false,
        articles_read: todaySession?.articles_read || 0,
        community_interactions: todaySession?.community_interactions || 0
      },
      totals: {
        points: totalPoints,
        level: todaySession?.current_level || 1,
        days_active: recentSessions?.length || 0
      },
      recent_activity: recentSessions || []
    });

  } catch (error) {
    console.error('Engagement streak API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
