import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateBotHealth, logBotAction } from '@/lib/bots/health-tracker';
import { generateRuleBasedResponse } from '@/lib/bots/rule-based-responses';

// ============================================================================
// ATLAS - Master Router Bot
// The central intelligence that routes all requests to specialized bots
// ============================================================================


// ============================================================================
// BOT ROUTING SYSTEM
// ============================================================================

interface BotRoute {
  bot: string;
  description: string;
  keywords: string[];
  priority: number;
}

const BOT_ROUTES: BotRoute[] = [
  {
    bot: 'annie',
    description: 'Conversations, support, matchmaking questions, profile help',
    keywords: ['match', 'introduction', 'profile', 'compatibility', 'dating', 'conversation', 'help', 'support', 'question'],
    priority: 90
  },
  {
    bot: 'henry',
    description: 'User onboarding, account setup, pipeline management',
    keywords: ['onboard', 'setup', 'account', 'getting started', 'how to', 'tutorial'],
    priority: 70
  },
  {
    bot: 'dave',
    description: 'Billing, subscriptions, payments, upgrades',
    keywords: ['billing', 'payment', 'subscription', 'upgrade', 'downgrade', 'plan', 'cancel', 'refund', 'charge'],
    priority: 95
  },
  {
    bot: 'dan',
    description: 'Marketing, promotions, referrals',
    keywords: ['promo', 'discount', 'referral', 'invite', 'marketing'],
    priority: 60
  },
  {
    bot: 'jordan',
    description: 'Safety, privacy, compliance, reporting issues',
    keywords: ['report', 'block', 'safety', 'privacy', 'harassment', 'abuse', 'inappropriate', 'terms', 'policy'],
    priority: 100
  }
];

/**
 * Route a user request to the appropriate specialized bot
 */
async function routeRequest(message: string): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Calculate scores for each bot based on keyword matches
  const scores = BOT_ROUTES.map(route => {
    const matchCount = route.keywords.filter(keyword =>
      lowerMessage.includes(keyword)
    ).length;

    return {
      bot: route.bot,
      score: matchCount > 0 ? matchCount * route.priority : 0,
      description: route.description
    };
  });

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  // If we have a clear winner (score > 0), route there
  if (scores[0].score > 0) {
    console.log(`[ATLAS] Routing to ${scores[0].bot.toUpperCase()} (score: ${scores[0].score})`);
    return scores[0].bot;
  }

  // Default to ANNIE for general conversation
  console.log('[ATLAS] Defaulting to ANNIE for general conversation');
  return 'annie';
}

/**
 * Load conversation history for context
 */
async function loadConversationHistory(userId: string, supabase: any) {
  const { data: conversation } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('bot_type', 'atlas')
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();

  if (conversation && conversation.messages) {
    // Return last 10 messages for context
    const messages = conversation.messages;
    return {
      conversationId: conversation.id,
      history: messages.slice(-10)
    };
  }

  return { conversationId: null, history: [] };
}

/**
 * Save conversation message to database
 */
async function saveConversationMessage(
  userId: string,
  conversationId: string | null,
  userMessage: string,
  assistantResponse: string,
  routedTo: string,
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
    timestamp: new Date().toISOString(),
    routed_to: routedTo
  };

  if (conversationId) {
    // Update existing conversation
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('messages, message_count')
      .eq('id', conversationId)
      .single();

    const messages = existing?.messages || [];
    messages.push(message, response);

    await supabase
      .from('ai_conversations')
      .update({
        messages,
        message_count: (existing?.message_count || 0) + 2,
        last_message_at: new Date().toISOString(),
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
        bot_type: 'atlas',
        messages: [message, response],
        message_count: 2,
        status: 'active',
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
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('[ATLAS] Processing request for user:', user.id);

    // Load conversation history
    const { conversationId, history } = await loadConversationHistory(user.id, supabase);

    // Determine which bot should handle this request
    const routedBot = await routeRequest(message);

    // Generate rule-based response
    const aiResponse = generateRuleBasedResponse(message, 'atlas');

    // Save conversation to database
    const finalConversationId = await saveConversationMessage(
      user.id,
      conversationId,
      message,
      aiResponse,
      routedBot,
      supabase
    );

    // Update bot health metrics
    await updateBotHealth('atlas', supabase);

    // Log action for audit trail
    await logBotAction('atlas', 'route_request', {
      user_id: user.id,
      routed_to: routedBot,
      message_preview: message.substring(0, 100)
    }, supabase);

    return NextResponse.json({
      success: true,
      message: aiResponse,
      conversationId: finalConversationId,
      routedTo: routedBot,
      metadata: {
        model: 'claude-3-5-sonnet-20241022',
        bot: 'atlas'
      }
    });

  } catch (error: any) {
    console.error('[ATLAS] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: 'I apologize, but I\'m having trouble processing your request. Please try again in a moment.'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check ATLAS bot health
    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      
      .eq('bot_name', 'atlas')
      .single();

    return NextResponse.json({
      bot: 'atlas',
      status: health?.status || 'unknown',
      lastActive: health?.last_active,
      actionsToday: health?.actions_today || 0,
      actionsThisHour: health?.actions_this_hour || 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
