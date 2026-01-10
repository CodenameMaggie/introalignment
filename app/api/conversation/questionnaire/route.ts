import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { QUESTION_BANK, getQuestionByNumber, getChapterInfo, TOTAL_QUESTIONS } from '@/lib/conversation/question-bank';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// AI-FREE QUESTIONNAIRE MODE
// This endpoint uses ZERO Claude API calls - completely free!
// Perfect for pre-revenue phase to avoid AI costs

export async function POST(req: NextRequest) {
  try {
    const { userId, answer, questionNumber, action } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Handle start action
    if (action === 'start') {
      return await startQuestionnaire(userId);
    }

    // Handle answer submission
    if (action === 'answer') {
      if (!answer || questionNumber === undefined) {
        return NextResponse.json({ error: 'Answer and question number required' }, { status: 400 });
      }

      return await saveAnswerAndGetNext(userId, questionNumber, answer);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Questionnaire error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startQuestionnaire(userId: string) {
  // Get or create conversation
  const conversation = await getOrCreateConversation(userId);

  // Get first question
  const firstQuestion = getQuestionByNumber(1);
  if (!firstQuestion) {
    return NextResponse.json({ error: 'Question bank error' }, { status: 500 });
  }

  const chapterInfo = getChapterInfo(firstQuestion.chapter);

  const supabase = getSupabase();
  // Get user profile for personalization
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('user_id', userId)
    .single();

  const firstName = profile?.first_name || 'there';

  return NextResponse.json({
    conversationId: conversation.id,
    currentQuestion: 1,
    totalQuestions: TOTAL_QUESTIONS,
    question: firstQuestion.question,
    chapter: {
      number: firstQuestion.chapter,
      title: chapterInfo?.title,
      emoji: getChapterEmoji(firstQuestion.chapter)
    },
    greeting: `Hi ${firstName}! I'm going to ask you some questions to help us understand what you're looking for and find someone who's truly aligned with you. There are ${TOTAL_QUESTIONS} questions total, organized into 7 chapters. Take your time and answer as openly as you'd like.`,
    isComplete: false,
    progress: 0
  });
}

async function saveAnswerAndGetNext(userId: string, questionNumber: number, answer: string) {
  // Get conversation
  const conversation = await getOrCreateConversation(userId);

  if (conversation.is_complete) {
    return NextResponse.json({
      error: 'Conversation already complete',
      isComplete: true
    }, { status: 400 });
  }

  // Get current question
  const currentQuestion = getQuestionByNumber(questionNumber);
  if (!currentQuestion) {
    return NextResponse.json({ error: 'Invalid question number' }, { status: 400 });
  }

  // Save the answer
  await saveAnswer(conversation.id, userId, questionNumber, currentQuestion, answer);

  // Get next question
  const nextQuestionNumber = questionNumber + 1;

  if (nextQuestionNumber > TOTAL_QUESTIONS) {
    // Conversation complete!
    await completeConversation(conversation.id);

    // Trigger automatic match generation (run in background)
    generateMatches(userId).catch(err => {
      console.error('Error generating matches:', err);
      // Don't fail the request if match generation fails
    });

    return NextResponse.json({
      isComplete: true,
      message: "Thank you so much for taking the time to share all of this with me. I feel like I've gotten to know you in a really meaningful way. I'm going to review everything you've shared and start looking for someone who's truly aligned with what you're looking for. I'll be in touch when I find someone I think could be a really good match.",
      currentQuestion: TOTAL_QUESTIONS,
      totalQuestions: TOTAL_QUESTIONS,
      progress: 100
    });
  }

  const nextQuestion = getQuestionByNumber(nextQuestionNumber);
  if (!nextQuestion) {
    return NextResponse.json({ error: 'Question bank error' }, { status: 500 });
  }

  const nextChapterInfo = getChapterInfo(nextQuestion.chapter);

  // Check if we're starting a new chapter
  const isNewChapter = nextQuestion.chapter !== currentQuestion.chapter;

  // Update conversation progress
  await updateConversationProgress(
    conversation.id,
    nextQuestionNumber,
    nextChapterInfo!.number
  );

  return NextResponse.json({
    isComplete: false,
    currentQuestion: nextQuestionNumber,
    totalQuestions: TOTAL_QUESTIONS,
    question: nextQuestion.question,
    chapter: {
      number: nextQuestion.chapter,
      title: nextChapterInfo?.title,
      emoji: getChapterEmoji(nextQuestion.chapter),
      isNew: isNewChapter
    },
    progress: Math.round((nextQuestionNumber / TOTAL_QUESTIONS) * 100)
  });
}

async function getOrCreateConversation(userId: string) {
  const supabase = getSupabase();
  // Try to get existing conversation
  let { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return existing;
  }

  // Get first chapter
  const { data: firstChapter } = await supabase
    .from('conversation_chapters')
    .select('id')
    .eq('chapter_number', 1)
    .single();

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      current_chapter_id: firstChapter?.id,
      current_question_number: 1,
      questions_answered: 0,
      total_questions: TOTAL_QUESTIONS,
      conversation_type: 'questionnaire' // Mark as non-AI mode
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return conversation;
}

async function saveAnswer(
  conversationId: string,
  userId: string,
  questionNumber: number,
  question: any,
  answer: string
) {
  const supabase = getSupabase();
  // Get chapter ID
  const chapterInfo = getChapterInfo(question.chapter);
  const { data: chapter } = await supabase
    .from('conversation_chapters')
    .select('id')
    .eq('chapter_number', chapterInfo?.number)
    .single();

  // Save as a user message
  const { error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: answer,
      chapter_id: chapter?.id,
      question_number: questionNumber,
      question_text: question.question
    });

  if (error) {
    console.error('Failed to save answer:', error);
    throw new Error(`Failed to save answer: ${error.message}`);
  }

  // In AI mode, this would trigger expensive extraction
  // In questionnaire mode, we skip it entirely - $0 cost!
  // Matchmakers can manually review answers later
}

async function updateConversationProgress(
  conversationId: string,
  nextQuestionNumber: number,
  nextChapterNumber: number
) {
  const supabase = getSupabase();
  // Get chapter ID
  const { data: chapter } = await supabase
    .from('conversation_chapters')
    .select('id')
    .eq('chapter_number', nextChapterNumber)
    .single();

  const { error } = await supabase
    .from('conversations')
    .update({
      current_chapter_id: chapter?.id,
      current_question_number: nextQuestionNumber,
      questions_answered: nextQuestionNumber - 1
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Failed to update progress:', error);
  }
}

async function completeConversation(conversationId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('conversations')
    .update({
      is_complete: true,
      completed_at: new Date().toISOString(),
      questions_answered: TOTAL_QUESTIONS
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Failed to complete conversation:', error);
  }
}

function getChapterEmoji(chapterNumber: number): string {
  const emojis: Record<number, string> = {
    1: '🌍',
    2: '📖',
    3: '💫',
    4: '🧠',
    5: '❤️',
    6: '🔮',
    7: '📍'
  };
  return emojis[chapterNumber] || '✨';
}

// Trigger automatic match generation
async function generateMatches(userId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/matches/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Match generation failed:', error);
    } else {
      const result = await response.json();
      console.log('Match generation result:', result);
    }
  } catch (error) {
    console.error('Error triggering match generation:', error);
  }
}
