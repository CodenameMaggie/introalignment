import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getQuestionByNumber, getChapterInfo, TOTAL_QUESTIONS } from '@/lib/conversation/question-bank';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no conversation exists yet, return not started
    if (!conversation) {
      return NextResponse.json({
        exists: false,
        isComplete: false,
        currentQuestion: 1,
        totalQuestions: TOTAL_QUESTIONS,
        currentChapter: 1,
        progress: 0,
        questionsAnswered: 0
      });
    }

    // Get current question and chapter info
    const currentQuestion = getQuestionByNumber(conversation.current_question_number);
    const chapterInfo = currentQuestion ? getChapterInfo(currentQuestion.chapter) : null;

    // Calculate progress
    const progress = (conversation.questions_answered / TOTAL_QUESTIONS) * 100;

    return NextResponse.json({
      exists: true,
      conversationId: conversation.id,
      isComplete: conversation.is_complete,
      currentQuestion: conversation.current_question_number,
      totalQuestions: TOTAL_QUESTIONS,
      currentChapter: currentQuestion?.chapter || 1,
      chapterTitle: chapterInfo?.title,
      chapterEmoji: chapterInfo?.emoji,
      progress: Math.round(progress),
      questionsAnswered: conversation.questions_answered,
      startedAt: conversation.started_at,
      completedAt: conversation.completed_at,
      lastMessageAt: conversation.last_message_at
    });

  } catch (error: any) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
