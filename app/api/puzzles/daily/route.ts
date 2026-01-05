import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all available puzzles
    const { data: allPuzzles } = await supabase
      .from('puzzles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!allPuzzles || allPuzzles.length === 0) {
      return NextResponse.json({ error: 'No puzzles available' }, { status: 404 });
    }

    // Determine today's puzzle using day-of-year rotation
    // This ensures the same puzzle for all users on the same day
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const puzzleIndex = dayOfYear % allPuzzles.length;
    const todaysPuzzle = allPuzzles[puzzleIndex];

    // Check if user already attempted today's puzzle today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAttempt } = await supabase
      .from('puzzle_attempts')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('puzzle_id', todaysPuzzle.id)
      .gte('created_at', today)
      .single();

    if (existingAttempt) {
      return NextResponse.json({
        alreadyAttempted: true,
        attemptedAt: existingAttempt.created_at
      });
    }

    return NextResponse.json({
      alreadyAttempted: false,
      puzzle: {
        id: todaysPuzzle.id,
        title: todaysPuzzle.title,
        puzzle_type: todaysPuzzle.puzzle_type,
        puzzle_data: todaysPuzzle.puzzle_data,
        points_value: todaysPuzzle.points_value,
        time_limit_seconds: todaysPuzzle.time_limit_seconds
      }
    });
  } catch (error) {
    console.error('Error fetching daily puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}
