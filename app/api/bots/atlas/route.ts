import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { getAIClient } from '@/lib/ai/multi-model-client';

/**
 * Atlas - The Research Bot
 * Handles research queries from other bots
 * Uses multi-model AI client for cost optimization
 */

interface ResearchRequest {
  requesting_bot: 'annie' | 'henry' | 'dave' | 'dan' | 'jordan';
  research_topic: string;
  context?: string;
  max_tokens?: number;
  prefer_provider?: 'bedrock' | 'anthropic' | 'openai';
}

interface ResearchResponse {
  success: boolean;
  research_result?: string;
  model_used?: string;
  cost?: number;
  provider?: string;
  error?: string;
  action_log_id?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ResearchResponse>> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: ResearchRequest = await request.json();
    const {
      requesting_bot,
      research_topic,
      context = '',
      max_tokens = 1024,
      prefer_provider
    } = body;

    // Validate request
    if (!requesting_bot || !research_topic) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: requesting_bot, research_topic'
      }, { status: 400 });
    }

    // Create research prompt
    const systemPrompt = `You are Atlas, SovereigntyIntroAlignment's research specialist. You provide accurate, concise research to help other AI bots make better decisions.

Your research should be:
- Factual and well-reasoned
- Concise (focus on key insights)
- Actionable (include specific recommendations when relevant)
- Data-driven when possible`;

    const userPrompt = context
      ? `Research Topic: ${research_topic}\n\nContext: ${context}\n\nProvide a comprehensive yet concise research summary.`
      : `Research Topic: ${research_topic}\n\nProvide a comprehensive yet concise research summary.`;

    // Call AI using multi-model client (will use cheapest available provider)
    const aiClient = getAIClient();
    const aiResponse = await aiClient.generateResponse(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        maxTokens: max_tokens,
        temperature: 0.7,
        preferProvider: prefer_provider
      }
    );

    const responseTime = Date.now() - startTime;

    // Log action to database
    const { data: actionLog, error: logError } = await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'atlas',
        action_type: 'research_query',
        action_details: {
          requesting_bot,
          research_topic,
          context_provided: !!context,
          model_used: aiResponse.model,
          provider: aiResponse.provider,
          cost: aiResponse.cost,
          response_time_ms: responseTime,
          max_tokens
        },
        status: 'completed'
      })
      .select('id')
      .single();

    if (logError) {
      console.error('[Atlas] Failed to log action:', logError);
    }

    // Update Atlas bot health status
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'atlas',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        total_actions: supabase.rpc('increment', { row_id: 'atlas', column_name: 'total_actions' }),
        average_response_time: responseTime,
        error_count: 0,
        metadata: {
          last_research_topic: research_topic,
          last_requesting_bot: requesting_bot,
          last_provider: aiResponse.provider,
          last_cost: aiResponse.cost
        }
      }, {
        onConflict: 'bot_name'
      });

    console.log(`[Atlas] Research completed for ${requesting_bot}: "${research_topic}" (${aiResponse.provider}, $${aiResponse.cost.toFixed(6)}, ${responseTime}ms)`);

    return NextResponse.json({
      success: true,
      research_result: aiResponse.content,
      model_used: aiResponse.model,
      cost: aiResponse.cost,
      provider: aiResponse.provider,
      action_log_id: actionLog?.id
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('[Atlas] Research error:', error);

    // Log error to database
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'atlas',
        action_type: 'research_query',
        action_details: {
          error_message: error.message,
          error_stack: error.stack,
          response_time_ms: responseTime
        },
        status: 'failed'
      });

    // Update bot health with error
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'atlas',
        status: 'degraded',
        last_active_at: new Date().toISOString(),
        error_count: supabase.rpc('increment', { row_id: 'atlas', column_name: 'error_count' }),
        metadata: {
          last_error: error.message,
          last_error_at: new Date().toISOString()
        }
      }, {
        onConflict: 'bot_name'
      });

    return NextResponse.json({
      success: false,
      error: error.message || 'Research failed'
    }, { status: 500 });
  }
}

/**
 * GET endpoint - Check Atlas bot status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();

  try {
    // Get bot health status
    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      .eq('bot_name', 'atlas')
      .single();

    // Get recent actions
    const { data: recentActions } = await supabase
      .from('bot_actions_log')
      .select('*')
      .eq('bot_name', 'atlas')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get available AI providers
    const aiClient = getAIClient();
    const availableProviders = aiClient.getAvailableProviders();

    return NextResponse.json({
      bot_name: 'atlas',
      status: health?.status || 'unknown',
      health,
      recent_actions: recentActions,
      available_providers: availableProviders,
      capabilities: [
        'General research queries',
        'Market analysis',
        'User behavior insights',
        'Dating trend research',
        'Compatibility research'
      ]
    });

  } catch (error: any) {
    console.error('[Atlas] Status check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
