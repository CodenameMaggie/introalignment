import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

// GET /api/games/daily - Get today's daily games
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();

    // Get all active daily games with their questions
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(`
        *,
        game_questions (*)
      `)
      .eq('is_daily', true)
      .eq('is_active', true)
      .order('game_type');

    if (gamesError) {
      console.error('Error fetching daily games:', gamesError);
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    // Sort questions by sequence_order
    const gamesWithSortedQuestions = games?.map(game => ({
      ...game,
      game_questions: game.game_questions?.sort((a: any, b: any) =>
        a.sequence_order - b.sequence_order
      )
    }));

    return NextResponse.json({
      games: gamesWithSortedQuestions || []
    });

  } catch (error) {
    console.error('Daily games API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
