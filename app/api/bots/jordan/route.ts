import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas } from '@/lib/bots/inter-bot-client';

/**
 * Jordan - The Analytics & Insights Bot
 * Handles analytics, reporting, and trend analysis
 * Queries Atlas for research on dating trends and user behavior patterns
 */

interface AnalyticsRequest {
  report_type: 'user_engagement' | 'lead_quality' | 'matching_success' | 'bot_performance';
  time_range?: '24h' | '7d' | '30d' | 'all';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: AnalyticsRequest = await request.json();
    const { report_type, time_range = '7d' } = body;

    // Example: Jordan queries Atlas for trend analysis research
    console.log(`[Jordan] Generating ${report_type} report, querying Atlas for trend insights...`);

    const atlasResponse = await askAtlas(
      'jordan',
      `What are current trends in ${report_type.replace('_', ' ')} for dating apps? Provide 3-4 key insights based on recent data and research.`,
      {
        max_tokens: 512,
        prefer_provider: 'bedrock' // Cost-optimized
      }
    );

    let trendInsights = null;
    if (atlasResponse.success && atlasResponse.research_result) {
      trendInsights = atlasResponse.research_result;
      console.log(`[Jordan] Atlas provided trend insights (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
    }

    // Jordan's analytics logic would go here
    // Gather actual metrics from database

    // Example metrics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const { count: totalLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });

    const { data: botHealth } = await supabase
      .from('ai_bot_health')
      .select('bot_name, status, total_actions, average_response_time');

    const responseTime = Date.now() - startTime;

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'jordan',
        action_type: 'analytics_report',
        action_details: {
          report_type,
          time_range,
          used_atlas_research: !!trendInsights,
          response_time_ms: responseTime,
          atlas_cost: atlasResponse.cost || 0
        },
        status: 'completed'
      });

    // Update Jordan's health
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'jordan',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        average_response_time: responseTime,
        metadata: {
          last_report_type: report_type,
          used_atlas: !!trendInsights
        }
      }, {
        onConflict: 'bot_name'
      });

    return NextResponse.json({
      success: true,
      bot: 'jordan',
      report_type,
      time_range,
      metrics: {
        total_users: totalUsers,
        total_leads: totalLeads,
        bot_health: botHealth
      },
      trend_insights: trendInsights,
      atlas_research_cost: atlasResponse.cost
    });

  } catch (error: any) {
    console.error('[Jordan] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'jordan',
        action_type: 'analytics_report',
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
    .eq('bot_name', 'jordan')
    .single();

  // Get system-wide metrics
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { count: totalLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true });

  const { count: enrichedLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'enriched');

  const { data: botHealth } = await supabase
    .from('ai_bot_health')
    .select('bot_name, status, total_actions');

  return NextResponse.json({
    bot_name: 'jordan',
    role: 'Analytics & Insights',
    status: health?.status || 'unknown',
    system_metrics: {
      total_users: totalUsers,
      total_leads: totalLeads,
      enriched_leads: enrichedLeads,
      lead_target: 1000000,
      progress: `${totalLeads}/${1000000} (${Math.round((totalLeads || 0) / 1000000 * 100)}%)`
    },
    bot_system_health: botHealth,
    capabilities: [
      'User engagement analytics',
      'Lead quality reporting',
      'Matching success metrics',
      'Bot performance monitoring',
      'Integrates with Atlas for trend research and insights'
    ]
  });
}
