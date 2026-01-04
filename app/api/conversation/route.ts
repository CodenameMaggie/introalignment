import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { startConversation, continueConversation } from '@/lib/ai/conversation-engine';
import { extractFromConversation } from '@/lib/ai/extraction-engine';

// POST /api/conversation - Start or continue a conversation
export async function POST(request: NextRequest) {
  try {
    const { userId, conversationId, message, action } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Start new conversation
    if (action === 'start') {
      // Create conversation record
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          status: 'in_progress'
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      // Generate initial message
      const initialMessage = await startConversation(userId, conversation.id);

      // Save assistant message
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: initialMessage
        });

      return NextResponse.json({
        conversationId: conversation.id,
        message: initialMessage,
        isComplete: false
      });
    }

    // Continue existing conversation
    if (action === 'continue' && conversationId && message) {
      // Get conversation history
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        return NextResponse.json(
          { error: 'Failed to fetch conversation history' },
          { status: 500 }
        );
      }

      // Save user message
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message
        });

      // Build context
      const answeredQuestions: string[] = [];
      const messageHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      const conversationHistory: Array<{ question: string; answer: string }> = [];

      let currentQuestion = '';

      for (const msg of messages) {
        messageHistory.push({
          role: msg.role,
          content: msg.content
        });

        if (msg.role === 'assistant') {
          currentQuestion = msg.content;
        } else if (msg.role === 'user' && currentQuestion) {
          conversationHistory.push({
            question: currentQuestion,
            answer: msg.content
          });

          // Extract question ID from metadata if available
          if (msg.metadata?.questionId) {
            answeredQuestions.push(msg.metadata.questionId);
          }
        }
      }

      // Generate next response
      const context = {
        userId,
        conversationId,
        answeredQuestions,
        currentChapter: 1, // Would be tracked properly in production
        messageHistory
      };

      const response = await continueConversation(context, message);

      // Save assistant response
      const { data: savedMessage } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: response.response,
          metadata: {
            questionId: response.questionId,
            isComplete: response.isComplete
          }
        })
        .select()
        .single();

      // Extract data from user's response in the background
      if (currentQuestion) {
        extractFromConversation(
          response.questionId || 'unknown',
          currentQuestion,
          message,
          conversationHistory
        ).then(async (extraction) => {
          // Save extraction results
          await supabase
            .from('conversation_messages')
            .update({
              metadata: {
                ...savedMessage.metadata,
                extractions: extraction.extractions,
                safetyFlags: extraction.safetyFlags
              }
            })
            .eq('id', savedMessage.id);
        }).catch(err => {
          console.error('Extraction error:', err);
        });
      }

      // If conversation is complete, update status
      if (response.isComplete) {
        await supabase
          .from('conversations')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        // Update user status
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', userId);
      }

      return NextResponse.json({
        conversationId,
        message: response.response,
        isComplete: response.isComplete,
        questionId: response.questionId
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/conversation?conversationId=xxx - Get conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
