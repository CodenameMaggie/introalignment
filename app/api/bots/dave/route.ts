import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas } from '@/lib/bots/inter-bot-client';

/**
 * Dave - The Matching & Compatibility Bot
 * Handles user matching and compatibility analysis
 * Queries Atlas for research on relationship compatibility factors
 */

interface MatchRequest {
  user_id: string;
  potential_match_id?: string;
  match_criteria?: any;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: MatchRequest = await request.json();
    const { user_id, potential_match_id, match_criteria } = body;

    // Get user profile
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Example: Dave queries Atlas for compatibility research
    // This helps Dave make better matching decisions based on research

    console.log('[Dave] Analyzing compatibility, querying Atlas for research...');

    const atlasResponse = await askAtlas(
      'dave',
      'What are the most important factors in long-term relationship compatibility according to recent research? List top 5 factors briefly.',
      {
        max_tokens: 512,
        prefer_provider: 'bedrock' // Cost-optimized
      }
    );

    let compatibilityResearch = null;
    if (atlasResponse.success && atlasResponse.research_result) {
      compatibilityResearch = atlasResponse.research_result;
      console.log(`[Dave] Atlas provided compatibility research (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
    }

    const responseTime = Date.now() - startTime;

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dave',
        action_type: 'compatibility_analysis',
        action_details: {
          user_id,
          potential_match_id,
          used_atlas_research: !!compatibilityResearch,
          response_time_ms: responseTime,
          atlas_cost: atlasResponse.cost || 0
        },
        status: 'completed'
      });

    // Update Dave's health
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'dave',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        average_response_time: responseTime,
        metadata: {
          last_user_id: user_id,
          used_atlas: !!compatibilityResearch
        }
      }, {
        onConflict: 'bot_name'
      });

    return NextResponse.json({
      success: true,
      bot: 'dave',
      message: 'Dave would calculate matches here (demonstration endpoint)',
      compatibility_research: compatibilityResearch,
      note: 'Matching uses 100% algorithmic logic, not AI. This research helps inform algorithm improvements.'
    });

  } catch (error: any) {
    console.error('[Dave] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dave',
        action_type: 'compatibility_analysis',
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
    .eq('bot_name', 'dave')
    .single();

  return NextResponse.json({
    bot_name: 'dave',
    role: 'Matching & Compatibility',
    status: health?.status || 'unknown',
    capabilities: [
      'Algorithmic matching (100% rule-based, NO AI)',
      'Compatibility scoring using Big Five personality',
      'Dealbreaker detection',
      'Values alignment analysis',
      'Integrates with Atlas for compatibility research (to improve algorithms)'
    ]
  });
}
