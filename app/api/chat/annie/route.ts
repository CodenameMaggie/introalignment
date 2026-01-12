import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { getAIClient } from '@/lib/ai/multi-model-client';

/**
 * Annie Chat Widget API
 *
 * Handles chat widget conversations with Annie bot
 * Focus: Legal professional onboarding, partnership questions, podcast info
 */

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const { action, userId, conversationId, message } = await request.json();

    // Start new conversation
    if (action === 'start') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
      }

      // Create conversation record
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          status: 'in_progress',
          metadata: { source: 'chat_widget', bot: 'annie' }
        })
        .select()
        .single();

      if (convError) {
        console.error('[Annie Chat] Failed to create conversation:', convError);
        return NextResponse.json({ success: false, error: 'Failed to start conversation' }, { status: 500 });
      }

      // Generate greeting message
      const greeting = `Hi! I'm Annie, your IntroAlignment assistant. I can help with:

• **Partnership Opportunities** - Joining our legal network
• **Podcast Guest Spots** - sovereigndesign.it.com (Wednesdays)
• **Client Referrals** - How our network works
• **Application Questions** - Partner application process

What would you like to know about?`;

      // Save greeting message
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: greeting
        });

      const responseTime = Date.now() - startTime;

      // Log to bot actions
      await supabase.from('bot_actions_log').insert({
        bot_name: 'annie',
        action_type: 'chat_widget_start',
        action_details: {
          conversation_id: conversation.id,
          user_id: userId,
          response_time_ms: responseTime
        },
        status: 'completed'
      });

      return NextResponse.json({
        success: true,
        conversationId: conversation.id,
        message: greeting
      });
    }

    // Continue conversation
    if (action === 'continue') {
      if (!conversationId || !message) {
        return NextResponse.json({ success: false, error: 'Conversation ID and message required' }, { status: 400 });
      }

      // Save user message
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message
        });

      // Get conversation history
      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20); // Last 20 messages for context

      // Build conversation context
      const conversationHistory = messages?.map(m => ({
        role: m.role,
        content: m.content
      })) || [];

      // Generate AI response using Annie's legal knowledge
      const aiClient = getAIClient();

      const systemPrompt = `You are Annie, IntroAlignment's conversational assistant for legal professionals. You help estate planning attorneys learn about:

**IntroAlignment Network:**
- Legal services network connecting estate planning attorneys with high-net-worth clients
- Focus: Dynasty trusts, asset protection, sophisticated estate structures
- Target attorneys: 5+ years experience, specializations in trusts & estates

**Services:**
1. **Partnership Opportunities**
   - Client referrals for high-net-worth estates ($10M+)
   - Collaborative network with top attorneys and CPAs
   - Three partnership tiers available

2. **Podcast Guest Spots** (sovereigndesign.it.com)
   - Wednesday recordings available
   - Platform to establish thought leadership
   - Discuss dynasty trusts, asset protection, wealth preservation
   - Book at: https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1

3. **Client Referrals**
   - High-net-worth families ($10M+ estates)
   - Family offices
   - Multi-generational wealth planning

**Your Tone:**
- Professional but approachable
- Helpful and informative
- Concise responses (2-4 sentences)
- Offer specific next steps (apply at /partners, book podcast, etc.)

**Escalation:**
For complex questions about fees, detailed partnership terms, or legal advice requests, recommend:
- Email: support@introalignment.com
- Or direct them to apply at: https://introalignment.com/partners

**DO NOT:**
- Provide legal advice
- Quote specific pricing without context
- Make guarantees about referrals or income`;

      const aiResponse = await aiClient.generateResponse(
        [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        {
          maxTokens: 512,
          temperature: 0.7,
          preferProvider: 'anthropic' // Use quality model for chat
        }
      );

      const responseContent = aiResponse.content;

      // Save assistant response
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: responseContent,
          metadata: {
            model: aiResponse.model,
            provider: aiResponse.provider,
            cost: aiResponse.cost
          }
        });

      const responseTime = Date.now() - startTime;

      // Log to bot actions
      await supabase.from('bot_actions_log').insert({
        bot_name: 'annie',
        action_type: 'chat_widget_message',
        action_details: {
          conversation_id: conversationId,
          message_length: message.length,
          response_time_ms: responseTime,
          ai_cost: aiResponse.cost
        },
        status: 'completed',
        cost: aiResponse.cost
      });

      return NextResponse.json({
        success: true,
        message: responseContent,
        conversationId
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('[Annie Chat] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process message'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    bot_name: 'annie',
    role: 'Chat Widget Assistant',
    status: 'active',
    capabilities: [
      'Partnership inquiry handling',
      'Podcast guest information',
      'Client referral process',
      'Application guidance',
      'Real-time conversational AI'
    ],
    topics: [
      'Joining IntroAlignment network',
      'sovereigndesign.it.com podcast',
      'High-net-worth client referrals',
      'Partnership tiers',
      'Wednesday podcast bookings'
    ]
  });
}
