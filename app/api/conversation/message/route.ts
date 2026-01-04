import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  getConversationSystemPrompt,
  getOpeningMessage,
  getChapterTransition,
  getCompletionMessage
} from '@/lib/conversation/system-prompt';
import {
  getExtractionPrompt,
  parseExtractionResponse,
  type ExtractionResult
} from '@/lib/conversation/extraction-prompt';
import {
  getQuestionByNumber,
  getChapterInfo,
  TOTAL_QUESTIONS
} from '@/lib/conversation/question-bank';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export async function POST(req: NextRequest) {
  try {
    const { userId, message, action } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Handle special actions
    if (action === 'start') {
      return await startConversation(userId);
    }

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(userId);

    if (conversation.is_complete) {
      return NextResponse.json({
        error: 'Conversation already complete',
        isComplete: true
      }, { status: 400 });
    }

    // Save user message
    await saveMessage(conversation.id, 'user', message, conversation.current_chapter_id, conversation.current_question_number);

    // Get conversation history
    const history = await getConversationHistory(conversation.id);

    // Get current question
    const currentQuestion = getQuestionByNumber(conversation.current_question_number);
    if (!currentQuestion) {
      return NextResponse.json({ error: 'Invalid question number' }, { status: 500 });
    }

    const chapterInfo = getChapterInfo(currentQuestion.chapter);
    if (!chapterInfo) {
      return NextResponse.json({ error: 'Invalid chapter' }, { status: 500 });
    }

    // Generate AI response
    const systemPrompt = getConversationSystemPrompt(
      currentQuestion.question,
      chapterInfo.title,
      conversation.current_question_number,
      TOTAL_QUESTIONS
    );

    const aiResponse = await generateAIResponse(systemPrompt, history, message);

    // Save AI message
    await saveMessage(conversation.id, 'assistant', aiResponse, conversation.current_chapter_id, conversation.current_question_number);

    // Extract psychological insights from user's message
    // Run this in background - don't wait for it
    extractAndSaveInsights(conversation.id, userId, currentQuestion, message).catch(err => {
      console.error('Extraction error:', err);
    });

    // Determine if we should move to next question
    // Simple heuristic: Move on after 2-3 exchanges per question
    const messageCount = await getMessageCountForQuestion(conversation.id, conversation.current_question_number);

    let shouldAdvance = false;
    let nextMessage = aiResponse;

    // If we've had 3+ messages on this question, consider advancing
    if (messageCount >= 3) {
      shouldAdvance = true;
    }

    // Check if AI response seems to be transitioning
    const transitionIndicators = [
      'next question',
      'move on',
      'let\'s talk about',
      'speaking of',
      'i\'m curious',
      'tell me about'
    ];

    const lowerResponse = aiResponse.toLowerCase();
    const hasTransitionIndicator = transitionIndicators.some(indicator =>
      lowerResponse.includes(indicator)
    );

    if (hasTransitionIndicator && messageCount >= 2) {
      shouldAdvance = true;
    }

    // Advance to next question if appropriate
    if (shouldAdvance) {
      const nextQuestionNumber = conversation.current_question_number + 1;

      if (nextQuestionNumber <= TOTAL_QUESTIONS) {
        const nextQuestion = getQuestionByNumber(nextQuestionNumber);
        if (!nextQuestion) {
          return NextResponse.json({ error: 'Invalid next question' }, { status: 500 });
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

        // If new chapter, add transition message
        if (isNewChapter) {
          const transitionMsg = getChapterTransition(
            nextChapterInfo!.number,
            nextChapterInfo!.title,
            nextChapterInfo!.emoji
          );

          // Save transition as assistant message
          await saveMessage(
            conversation.id,
            'assistant',
            transitionMsg,
            nextChapterInfo!.number,
            nextQuestionNumber
          );

          nextMessage = aiResponse + '\n\n' + transitionMsg;
        }
      } else {
        // Conversation complete!
        await completeConversation(conversation.id);

        const completionMsg = getCompletionMessage();
        await saveMessage(conversation.id, 'assistant', completionMsg, null, null);

        nextMessage = aiResponse + '\n\n' + completionMsg;

        return NextResponse.json({
          message: nextMessage,
          isComplete: true,
          currentQuestion: TOTAL_QUESTIONS,
          totalQuestions: TOTAL_QUESTIONS,
          currentChapter: 7
        });
      }
    }

    // Get updated conversation state
    const updated = await getConversation(conversation.id);

    return NextResponse.json({
      message: nextMessage,
      isComplete: updated.is_complete,
      currentQuestion: updated.current_question_number,
      totalQuestions: TOTAL_QUESTIONS,
      currentChapter: currentQuestion.chapter,
      progress: (updated.questions_answered / TOTAL_QUESTIONS) * 100
    });

  } catch (error: any) {
    console.error('Conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function startConversation(userId: string) {
  const conversation = await getOrCreateConversation(userId);

  // Get user profile for personalization
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('user_id', userId)
    .single();

  const openingMsg = getOpeningMessage(profile?.first_name);

  // Save opening message
  await saveMessage(conversation.id, 'assistant', openingMsg, 1, 1);

  return NextResponse.json({
    message: openingMsg,
    conversationId: conversation.id,
    currentQuestion: 1,
    totalQuestions: TOTAL_QUESTIONS,
    currentChapter: 1,
    isComplete: false
  });
}

async function getOrCreateConversation(userId: string) {
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
      total_questions: TOTAL_QUESTIONS
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return conversation;
}

async function getConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    throw new Error(`Failed to get conversation: ${error.message}`);
  }

  return data;
}

async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  chapterId: number | null,
  questionNumber: number | null
) {
  // Get chapter ID if we have chapter number
  let actualChapterId = null;
  if (chapterId !== null) {
    const { data: chapter } = await supabase
      .from('conversation_chapters')
      .select('id')
      .eq('chapter_number', chapterId)
      .single();

    actualChapterId = chapter?.id;
  }

  const { error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      chapter_id: actualChapterId,
      question_number: questionNumber
    });

  if (error) {
    console.error('Failed to save message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }
}

async function getConversationHistory(conversationId: string) {
  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return messages || [];
}

async function getMessageCountForQuestion(conversationId: string, questionNumber: number) {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('id', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .eq('question_number', questionNumber);

  if (error) {
    console.error('Error counting messages:', error);
    return 0;
  }

  return data?.length || 0;
}

async function generateAIResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  userMessage: string
) {
  const messages = [
    ...history.map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content
    })),
    {
      role: 'user' as const,
      content: userMessage
    }
  ];

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response type from Claude');
}

async function extractAndSaveInsights(
  conversationId: string,
  userId: string,
  question: any,
  userResponse: string
) {
  try {
    // Generate extraction prompt
    const extractionPrompt = getExtractionPrompt(
      question.question,
      userResponse,
      question.extractionTargets
    );

    // Call Claude for extraction
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: extractionPrompt
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse extraction
    const extraction = parseExtractionResponse(content.text);
    if (!extraction) {
      console.error('Failed to parse extraction');
      return;
    }

    // Get the message ID we just saved
    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1);

    const messageId = messages?.[0]?.id;

    // Save extraction
    const { error } = await supabase
      .from('conversation_extractions')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        user_id: userId,
        big_five_updates: extraction.big_five_updates || {},
        attachment_indicators: extraction.attachment_indicators || {},
        values_mentioned: extraction.values_mentioned || [],
        interests_mentioned: extraction.interests_mentioned || {},
        relationship_insights: extraction.relationship_insights || {},
        lifestyle_indicators: extraction.lifestyle_indicators || {},
        emotional_intelligence: extraction.emotional_intelligence || {},
        cognitive_indicators: extraction.cognitive_indicators || {},
        red_flags: extraction.red_flags || [],
        green_flags: extraction.green_flags || [],
        raw_extraction: content.text,
        confidence_score: extraction.confidence_score || 0.5
      });

    if (error) {
      console.error('Failed to save extraction:', error);
    }

    // The database trigger will automatically apply this to profile_extractions!

  } catch (error) {
    console.error('Extraction error:', error);
    throw error;
  }
}

async function updateConversationProgress(
  conversationId: string,
  nextQuestionNumber: number,
  nextChapterNumber: number
) {
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
