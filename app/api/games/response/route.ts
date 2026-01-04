import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

// POST /api/games/response - Submit game answer and update profile
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      gameId,
      questionId,
      selectedOption,
      responseText,
      responseTimeMs
    } = await request.json() as {
      userId: string;
      gameId: string;
      questionId: string;
      selectedOption?: string;
      responseText?: string;
      responseTimeMs?: number;
    };

    if (!userId || !gameId || !questionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 1. Get the question with its scoring logic
    const { data: question, error: questionError } = await supabase
      .from('game_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // 2. Calculate scores from scoring logic
    const scoringLogic = question.scoring_logic || {};
    const scores = selectedOption ? scoringLogic[selectedOption] || {} : {};

    // 3. Save the game response
    const { error: responseError } = await supabase
      .from('game_responses')
      .insert({
        user_id: userId,
        game_id: gameId,
        question_id: questionId,
        selected_option: selectedOption,
        response_text: responseText,
        response_time_ms: responseTimeMs,
        extracted_data: scores,
        confidence_score: 0.7
      });

    if (responseError) {
      console.error('Error saving game response:', responseError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    // 4. Update profile extractions
    await updateProfileExtractions(userId, scores, responseTimeMs);

    // 5. Update engagement session
    await updateEngagementSession(userId, 'game');

    // 6. Check for new badges
    await checkAndAwardBadges(userId);

    return NextResponse.json({
      success: true,
      extracted: scores
    });

  } catch (error) {
    console.error('Game response API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Update profile extractions with new data
async function updateProfileExtractions(
  userId: string,
  scores: Record<string, any>,
  responseTimeMs?: number
) {
  const supabase = getAdminClient();

  // Get current profile or create new one
  const { data: profile } = await supabase
    .from('profile_extractions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    // Create new profile extraction record
    await supabase
      .from('profile_extractions')
      .insert({
        user_id: userId,
        total_games_played: 1
      });
    return;
  }

  // Update Big Five traits
  const updates: Record<string, any> = {};
  const bigFiveTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

  for (const trait of bigFiveTraits) {
    if (scores[trait] !== undefined) {
      const currentValue = profile[trait] || 0.5;
      const dataPoints = profile[`${trait}_data_points`] || 0;

      // Weighted moving average
      const delta = scores[trait];
      const newValue = (currentValue * dataPoints + (0.5 + delta)) / (dataPoints + 1);

      updates[trait] = Math.max(0, Math.min(1, newValue)); // Clamp to 0-1
      updates[`${trait}_data_points`] = dataPoints + 1;
      updates[`${trait}_confidence`] = Math.min(0.95, (dataPoints + 1) / 20);
    }
  }

  // Update lifestyle indicators
  const lifestyleIndicators = profile.lifestyle_indicators || {};
  for (const [key, value] of Object.entries(scores)) {
    if (!bigFiveTraits.includes(key) && typeof value === 'string') {
      lifestyleIndicators[key] = value;
    }
  }
  if (Object.keys(lifestyleIndicators).length > Object.keys(profile.lifestyle_indicators || {}).length) {
    updates.lifestyle_indicators = lifestyleIndicators;
  }

  // Update decision speed based on response time
  if (responseTimeMs) {
    if (responseTimeMs < 2000) {
      updates.decision_speed = 'quick';
    } else if (responseTimeMs < 5000) {
      updates.decision_speed = 'deliberate';
    } else {
      updates.decision_speed = 'slow';
    }
  }

  // Increment games played
  updates.total_games_played = (profile.total_games_played || 0) + 1;

  // Calculate profile completeness (simple version)
  const completeness = Math.min(1, updates.total_games_played / 50);
  updates.profile_completeness = completeness;

  updates.last_updated_at = new Date().toISOString();

  // Apply updates
  await supabase
    .from('profile_extractions')
    .update(updates)
    .eq('user_id', userId);
}

// Helper: Update engagement session
async function updateEngagementSession(userId: string, activityType: 'game' | 'puzzle' | 'article' | 'community') {
  const supabase = getAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Get today's session
  const { data: session } = await supabase
    .from('engagement_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', today)
    .single();

  if (!session) {
    // Create new session
    await supabase
      .from('engagement_sessions')
      .insert({
        user_id: userId,
        session_date: today,
        daily_game_completed: activityType === 'game',
        daily_puzzle_completed: activityType === 'puzzle',
        articles_read: activityType === 'article' ? 1 : 0,
        community_interactions: activityType === 'community' ? 1 : 0,
        points_earned_today: 10,
        total_points: 10,
        first_activity_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      });
  } else {
    // Update existing session
    const updates: Record<string, any> = {
      last_activity_at: new Date().toISOString()
    };

    if (activityType === 'game' && !session.daily_game_completed) {
      updates.daily_game_completed = true;
      updates.points_earned_today = session.points_earned_today + 10;
      updates.total_points = session.total_points + 10;
    }

    await supabase
      .from('engagement_sessions')
      .update(updates)
      .eq('user_id', userId)
      .eq('session_date', today);
  }

  // Update streak
  await updateStreak(userId, today);
}

// Helper: Update streak
async function updateStreak(userId: string, today: string) {
  const supabase = getAdminClient();

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if user was active yesterday
  const { data: yesterdaySession } = await supabase
    .from('engagement_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', yesterdayStr)
    .single();

  const { data: todaySession } = await supabase
    .from('engagement_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', today)
    .single();

  if (todaySession) {
    const currentStreak = yesterdaySession ? (yesterdaySession.current_streak + 1) : 1;
    const longestStreak = Math.max(currentStreak, todaySession.longest_streak || 0);

    await supabase
      .from('engagement_sessions')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak
      })
      .eq('user_id', userId)
      .eq('session_date', today);
  }
}

// Helper: Check and award badges
async function checkAndAwardBadges(userId: string) {
  const supabase = getAdminClient();

  // Get user's profile and engagement data
  const { data: profile } = await supabase
    .from('profile_extractions')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: todaySession } = await supabase
    .from('engagement_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', new Date().toISOString().split('T')[0])
    .single();

  if (!profile) return;

  // Get all badges user doesn't have yet
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = existingBadges?.map(b => b.badge_id) || [];

  const { data: allBadges } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true);

  const badgesToAward = [];

  for (const badge of allBadges || []) {
    if (existingBadgeIds.includes(badge.id)) continue;

    const criteria = badge.criteria;

    // Check if user meets criteria
    let meetsCard = false;

    if (criteria.type === 'games_completed') {
      meetsCard = (profile.total_games_played || 0) >= criteria.count;
    } else if (criteria.type === 'streak') {
      meetsCard = (todaySession?.current_streak || 0) >= criteria.days;
    } else if (criteria.type === 'personality_trait') {
      const traitValue = profile[criteria.trait];
      meetsCard = traitValue && traitValue >= criteria.threshold;
    } else if (criteria.type === 'profile_completion') {
      meetsCard = (profile.profile_completeness || 0) >= criteria.threshold;
    }

    if (meetsCard) {
      badgesToAward.push(badge.id);
    }
  }

  // Award badges
  for (const badgeId of badgesToAward) {
    await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId
      });
  }
}
