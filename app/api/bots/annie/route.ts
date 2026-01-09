import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas } from '@/lib/bots/inter-bot-client';

/**
 * Annie - The Conversation & Onboarding Bot
 * Handles user conversations during onboarding
 * Queries Atlas for research on user behavior and conversation strategies
 */

interface ConversationRequest {
  user_id: string;
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: ConversationRequest = await request.json();
    const { user_id, message, conversation_history = [] } = body;

    // Example: Annie can query Atlas for conversation strategy research
    // This helps Annie provide better responses based on research

    // Check if this is a complex topic that needs research
    const needsResearch = message.toLowerCase().includes('relationship') ||
                          message.toLowerCase().includes('dating') ||
                          message.toLowerCase().includes('compatibility');

    let researchInsight = null;

    if (needsResearch) {
      console.log('[Annie] Detected complex topic, querying Atlas for research...');

      // Query Atlas for research on the topic
      const atlasResponse = await askAtlas(
        'annie',
        `User mentioned: "${message}". Provide brief insights on how to respond helpfully in a dating app onboarding conversation.`,
        {
          max_tokens: 256,
          prefer_provider: 'bedrock' // Use cheapest option for quick insights
        }
      );

      if (atlasResponse.success && atlasResponse.research_result) {
        researchInsight = atlasResponse.research_result;
        console.log(`[Annie] Atlas provided research insight (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
      }
    }

    // Annie's response logic would go here
    // For now, this is a demonstration of how Annie integrates with Atlas

    const responseTime = Date.now() - startTime;

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'annie',
        action_type: 'conversation_response',
        action_details: {
          user_id,
          message_length: message.length,
          used_atlas_research: !!researchInsight,
          response_time_ms: responseTime
        },
        status: 'completed'
      });

    // Update Annie's health status
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'annie',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        average_response_time: responseTime,
        metadata: {
          last_user_id: user_id,
          used_atlas: !!researchInsight
        }
      }, {
        onConflict: 'bot_name'
      });

    return NextResponse.json({
      success: true,
      bot: 'annie',
      response: 'Annie would respond here (demonstration endpoint)',
      research_used: !!researchInsight,
      research_insight: researchInsight
    });

  } catch (error: any) {
    console.error('[Annie] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'annie',
        action_type: 'conversation_response',
        action_details: {
          error_message: error.message
        },
        status: 'failed'
      });

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  const supabase = getAdminClient();

  const { data: health } = await supabase
    .from('ai_bot_health')
    .select('*')
    .eq('bot_name', 'annie')
    .single();

  return NextResponse.json({
    bot_name: 'annie',
    role: 'Conversation & Onboarding',
    status: health?.status || 'unknown',
    capabilities: [
      'User onboarding conversations',
      'Question answering',
      'Personality assessment through dialogue',
      'Integrates with Atlas for conversation strategy research'
    ]
  });
}
