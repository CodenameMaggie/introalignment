import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas, reportActionCompleted, reportCriticalIssue } from '@/lib/bots/inter-bot-client';

/**
 * Jordan - The Legal Network Analytics & Insights Bot
 *
 * PURPOSE: Provides analytics and insights for IntroAlignment legal network
 * FOCUS: Partner metrics, outreach performance, network growth, podcast analytics
 * REPORTS TO: MFS C-Suite Bot
 *
 * RESPONSIBILITIES:
 * - Track partner application metrics
 * - Monitor email campaign performance
 * - Analyze podcast guest conversions
 * - Generate network growth reports
 * - Identify high-performing outreach strategies
 * - Provide bot performance analytics
 * - Track lawyer specialization distribution
 */

interface AnalyticsRequest {
  report_type: 'partner_metrics' | 'email_performance' | 'podcast_analytics' | 'network_growth' | 'bot_performance';
  time_range?: '24h' | '7d' | '30d' | '90d' | 'all';
  filters?: {
    specialization?: string;
    state?: string;
    experience_level?: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: AnalyticsRequest = await request.json();
    const { report_type, time_range = '30d', filters } = body;

    // Query Atlas for analytics insights
    console.log(`[Jordan] Generating ${report_type} report, querying Atlas for trend insights...`);

    const atlasResponse = await askAtlas(
      'jordan',
      `What are important trends and insights for ${report_type.replace('_', ' ')} in a legal services network focused on estate planning attorneys, dynasty trusts, and asset protection? Provide 3-4 key metrics to track and benchmarks for success.`,
      {
        context: `Time range: ${time_range}, Filters: ${JSON.stringify(filters || {})}`,
        max_tokens: 512,
        prefer_provider: 'bedrock'
      }
    );

    let trendInsights = null;
    if (atlasResponse.success && atlasResponse.research_result) {
      trendInsights = atlasResponse.research_result;
      console.log(`[Jordan] Atlas provided trend insights (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
    }

    // Gather actual metrics from database
    const timeFilter = time_range === '24h' ? '24 hours' :
                       time_range === '7d' ? '7 days' :
                       time_range === '30d' ? '30 days' :
                       time_range === '90d' ? '90 days' : null;

    // Partner metrics
    const { count: totalPartners } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true });

    const { count: recentPartners } = timeFilter ? await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `now() - interval '${timeFilter}'`) : { count: null };

    const { count: podcastInterested } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('podcast_interest', true);

    // Bot health metrics
    const { data: botHealth } = await supabase
      .from('ai_bot_health')
      .select('bot_name, status, total_actions, average_response_time')
      .neq('bot_name', 'mfs-csuite');

    // Email metrics (from bot actions log)
    const { count: emailsSent } = timeFilter ? await supabase
      .from('bot_actions_log')
      .select('id', { count: 'exact', head: true })
      .eq('bot_name', 'henry')
      .eq('action_type', 'legal_professional_email')
      .gte('created_at', `now() - interval '${timeFilter}'`) : { count: null };

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
          filters,
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

    // Report to C-Suite
    await reportActionCompleted('jordan', {
      action_type: 'analytics_report',
      details: {
        report_type,
        time_range
      },
      success: true,
      metrics: {
        total_partners: totalPartners,
        used_atlas_research: !!trendInsights,
        atlas_cost: atlasResponse.cost || 0
      }
    }).catch(err => {
      console.error('[Jordan] Failed to report to C-Suite:', err);
    });

    return NextResponse.json({
      success: true,
      bot: 'jordan',
      role: 'Legal Network Analytics & Insights',
      report_type,
      time_range,
      metrics: {
        total_partners: totalPartners,
        recent_partners: recentPartners,
        podcast_interested: podcastInterested,
        emails_sent: emailsSent,
        partner_target: 1000,
        progress: `${Math.round((totalPartners || 0) / 1000 * 100)}%`,
        bot_system_health: botHealth
      },
      trend_insights: trendInsights,
      atlas_research_cost: atlasResponse.cost,
      reported_to_csuite: true
    });

  } catch (error: any) {
    console.error('[Jordan] Error:', error);

    // Report critical failure to C-Suite
    await reportCriticalIssue('jordan', {
      error_type: 'analytics_failure',
      error_message: error.message,
      affected_systems: ['analytics_report'],
      recovery_attempted: false,
      requires_human_intervention: true
    }, 'urgent').catch(console.error);

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
  const { count: totalPartners } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true });

  const { count: qualifiedPartners } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .gte('experience_years', 5);

  const { count: podcastInterested } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('podcast_interest', true);

  const { data: botHealth } = await supabase
    .from('ai_bot_health')
    .select('bot_name, status, total_actions')
    .neq('bot_name', 'mfs-csuite');

  return NextResponse.json({
    bot_name: 'jordan',
    role: 'Legal Network Analytics & Insights',
    business_model: 'IntroAlignment - Legal Services Network',
    status: health?.status || 'unknown',
    system_metrics: {
      total_partners: totalPartners,
      qualified_partners: qualifiedPartners,
      podcast_interested: podcastInterested,
      partner_target: 1000,
      progress: `${totalPartners}/${1000} (${Math.round((totalPartners || 0) / 1000 * 100)}%)`,
      qualification_rate: totalPartners > 0 ? `${Math.round((qualifiedPartners || 0) / totalPartners * 100)}%` : 'N/A'
    },
    bot_system_health: botHealth,
    capabilities: [
      'Partner application metrics and trends',
      'Email campaign performance analysis',
      'Podcast conversion tracking (sovereigndesign.it.com)',
      'Network growth reporting',
      'Bot performance monitoring',
      'Specialization distribution analysis',
      'Geographic coverage metrics',
      'Credential tracking (ACTEC, AEP, Board Certified)',
      'Integrates with Atlas for trend research',
      'Reports to MFS C-Suite Bot'
    ],
    report_types: [
      'Partner Metrics - Applications, acceptances, qualifications',
      'Email Performance - Open rates, reply rates, conversions',
      'Podcast Analytics - Guest invitations, bookings, recordings',
      'Network Growth - Partner acquisition over time',
      'Bot Performance - Health, actions, success rates',
      'Specialization Analysis - Distribution of attorney expertise',
      'Geographic Coverage - Partner distribution by state'
    ],
    key_metrics: [
      'Total Partners',
      'Qualified Partners (5+ years experience)',
      'Podcast-Interested Partners',
      'Email Campaign Performance',
      'Application-to-Acceptance Rate',
      'Average Attorney Experience Level',
      'Specialization Coverage',
      'State Bar Representation',
      'Bot System Health'
    ]
  });
}
