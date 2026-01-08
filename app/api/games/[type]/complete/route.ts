import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/db/supabase';

// Helper functions for badge system
async function checkUserBadge(userId: string, badgeSlug: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_slug', badgeSlug)
    .single();

  return !!data;
}

async function awardBadge(userId: string, badgeSlug: string, badgeName: string, description: string): Promise<void> {
  const supabase = getAdminClient();
  await supabase.from('user_badges').insert({
    user_id: userId,
    badge_slug: badgeSlug,
    badge_name: badgeName,
    description,
    earned_at: new Date().toISOString()
  });
}

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

    // Check for badges/achievements
    const badgesEarned: string[] = [];

    // Streak-based badges
    if (streak === 3) {
      const hasThis = await checkUserBadge(user.id, 'first_streak');
      if (!hasThis) {
        await awardBadge(user.id, 'first_streak', 'First Streak', '3 days in a row!');
        badgesEarned.push('First Streak');
      }
    }
    if (streak === 7) {
      const hasThis = await checkUserBadge(user.id, 'week_warrior');
      if (!hasThis) {
        await awardBadge(user.id, 'week_warrior', 'Week Warrior', '7 days in a row!');
        badgesEarned.push('Week Warrior');
      }
    }
    if (streak === 30) {
      const hasThis = await checkUserBadge(user.id, 'monthly_master');
      if (!hasThis) {
        await awardBadge(user.id, 'monthly_master', 'Monthly Master', '30 days in a row!');
        badgesEarned.push('Monthly Master');
      }
    }

    // Points-based badges
    if (newTotalPoints >= 100) {
      const hasThis = await checkUserBadge(user.id, 'century_club');
      if (!hasThis) {
        await awardBadge(user.id, 'century_club', 'Century Club', '100 points earned!');
        badgesEarned.push('Century Club');
      }
    }
    if (newTotalPoints >= 500) {
      const hasThis = await checkUserBadge(user.id, 'point_champion');
      if (!hasThis) {
        await awardBadge(user.id, 'point_champion', 'Point Champion', '500 points earned!');
        badgesEarned.push('Point Champion');
      }
    }

    return NextResponse.json({
      success: true,
      streak,
      points: game.points_value,
      totalPoints: newTotalPoints,
      badgesEarned
    });
  } catch (error) {
    console.error('Error completing game:', error);
    return NextResponse.json(
      { error: 'Failed to complete game' },
      { status: 500 }
    );
  }
}
