import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if played today
  const today = new Date().toISOString().split('T')[0];
  const { data: responses } = await supabase
    .from('game_responses')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('game_type', type)
    .gte('created_at', today)
    .limit(1);

  if (responses && responses.length > 0) {
    return NextResponse.json({
      alreadyPlayed: true,
      playedAt: responses[0].created_at
    });
  }

  // Fetch game and questions
  const { data: game, error } = await supabase
    .from('games')
    .select(`
      id,
      game_type,
      title,
      description,
      points_value,
      game_questions (
        id,
        question_text,
        question_type,
        options,
        sequence_order
      )
    `)
    .eq('game_type', type)
    .eq('is_active', true)
    .single();

  if (error || !game) {
    return NextResponse.json(
      { error: 'Game not found' },
      { status: 404 }
    );
  }

  // Sort questions by sequence_order
  if (game?.game_questions) {
    game.game_questions.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
  }

  return NextResponse.json({ alreadyPlayed: false, game });
}
