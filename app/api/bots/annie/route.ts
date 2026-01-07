import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateBotHealth, logBotAction } from '@/lib/bots/health-tracker';
import { generateRuleBasedResponse, requiresEscalation } from '@/lib/bots/rule-based-responses';

// ============================================================================
// ANNIE - Conversations & Matchmaking Support Bot
// Handles user conversations, support tickets, and matchmaking questions
// ============================================================================


// ============================================================================
// CONVERSATION HELPERS
// ============================================================================

/**
 * Load user profile context for personalized responses
 */
async function loadUserProfile(userId: string, supabase: any) {
  const { data: user } = await supabase
    .from('users')
    .select('full_name, email, created_at, onboarding_completed')
    .eq('id', userId)
    .single();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    user,
    profile,
    preferences
  };
}

/**
 * Load conversation history
 */
async function loadConversationHistory(userId: string, supabase: any) {
  const { data: conversation } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('bot_type', 'annie')
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();

  if (conversation && conversation.messages) {
    return {
      conversationId: conversation.id,
      history: conversation.messages.slice(-15), // Last 15 messages for context
      summary: conversation.conversation_summary
    };
  }

  return { conversationId: null, history: [], summary: null };
}

/**
 * Check for active matches to provide context
 */
async function loadActiveMatches(userId: string, supabase: any) {
  const { data: matches, count } = await supabase
    .from('matches')
    .select('*, matched_user:users!matches_user2_id_fkey(full_name)', { count: 'exact' })
    .eq('user1_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    matches: matches || [],
    totalActive: count || 0
  };
}

/**
 * Check for support tickets
 */
async function checkSupportTickets(userId: string, supabase: any) {
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(3);

  return tickets || [];
}

/**
 * Save conversation message
 */
async function saveConversationMessage(
  userId: string,
  conversationId: string | null,
  userMessage: string,
  assistantResponse: string,
  context: any,
  supabase: any
) {
  const message = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  };

  const response = {
    role: 'assistant',
    content: assistantResponse,
    timestamp: new Date().toISOString()
  };

  if (conversationId) {
    // Update existing conversation
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('messages, message_count, key_facts')
      .eq('id', conversationId)
      .single();

    const messages = existing?.messages || [];
    messages.push(message, response);

    // Extract key facts if user shares important info
    const keyFacts = existing?.key_facts || [];
    if (userMessage.match(/(prefer|looking for|want|need|don't like|hate)/i)) {
      keyFacts.push({
        fact: userMessage,
        timestamp: new Date().toISOString()
      });
    }

    await supabase
      .from('ai_conversations')
      .update({
        messages,
        key_facts: keyFacts.slice(-20), // Keep last 20 facts
        message_count: (existing?.message_count || 0) + 2,
        last_message_at: new Date().toISOString(),
        context: context,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return conversationId;
  } else {
    // Create new conversation
    const { data: newConv } = await supabase
      .from('ai_conversations')
      .insert({
        
        user_id: userId,
        bot_type: 'annie',
        messages: [message, response],
        message_count: 2,
        status: 'active',
        context: context,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    return newConv?.id;
  }
}


// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, ticketId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('[ANNIE] Processing message for user:', user.id);

    // Load user context
    const [userContext, conversationContext, matchContext, supportTickets] = await Promise.all([
      loadUserProfile(user.id, supabase),
      loadConversationHistory(user.id, supabase),
      loadActiveMatches(user.id, supabase),
      checkSupportTickets(user.id, supabase)
    ]);

    // Check if escalation needed
    const needsEscalation = requiresEscalation(message);

    // Generate rule-based response
    let aiResponse = generateRuleBasedResponse(message, 'annie');

    // If escalation needed, create support ticket
    let createdTicket = null;
    if (needsEscalation && !ticketId) {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .insert({
          
          user_id: user.id,
          subject: `ANNIE Escalation: ${message.substring(0, 50)}...`,
          description: `User message: ${message}\n\nANNIE response: ${aiResponse}`,
          category: 'escalation',
          priority: 'high',
          status: 'open',
          source: 'ai_bot',
          escalated: true,
          escalated_at: new Date().toISOString(),
          escalation_reason: 'Detected escalation keywords in user message'
        })
        .select()
        .single();

      createdTicket = ticket;

      // Add escalation note to response
      aiResponse += '\n\n📩 I\'ve created a support ticket for our team to follow up with you personally. A human team member will reach out within 24 hours.';
    }

    // Save conversation
    const finalConversationId = await saveConversationMessage(
      user.id,
      conversationContext.conversationId,
      message,
      aiResponse,
      {
        has_active_matches: matchContext.totalActive > 0,
        escalated: needsEscalation,
        ticket_created: !!createdTicket
      },
      supabase
    );

    // Update bot health metrics
    await updateBotHealth('annie', supabase);

    // Log action
    await logBotAction('annie', needsEscalation ? 'escalated_conversation' : 'conversation', {
      user_id: user.id,
      escalated: needsEscalation,
      ticket_id: createdTicket?.id,
      message_preview: message.substring(0, 100)
    }, supabase);

    // Update user's last bot interaction
    await supabase
      .from('users')
      .update({
        last_bot_interaction_at: new Date().toISOString(),
        last_bot_interaction_type: 'annie_conversation'
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: aiResponse,
      conversationId: finalConversationId,
      metadata: {
        bot: 'annie',
        escalated: needsEscalation,
        ticketCreated: !!createdTicket,
        ticketId: createdTicket?.id,
        activeMatches: matchContext.totalActive
      }
    });

  } catch (error: any) {
    console.error('[ANNIE] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process message',
        message: 'I apologize, but I\'m having trouble right now. Please try again in a moment, or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      
      .eq('bot_name', 'annie')
      .single();

    return NextResponse.json({
      bot: 'annie',
      status: health?.status || 'unknown',
      lastActive: health?.last_active,
      actionsToday: health?.actions_today || 0,
      actionsThisHour: health?.actions_this_hour || 0,
      successRate: health?.success_rate || 100
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
