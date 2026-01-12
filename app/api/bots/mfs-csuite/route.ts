import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { getAIClient } from '@/lib/ai/multi-model-client';

/**
 * MFS C-Suite Bot - Executive Oversight & Strategic Decision Making
 *
 * The C-Suite bot sits at the top of the bot hierarchy and receives reports
 * from all operational bots (Dan, Henry, Dave, Annie, Jordan, Atlas).
 *
 * Responsibilities:
 * - Receive and review reports from all operational bots
 * - Monitor system-wide health and performance
 * - Make strategic decisions and issue directives
 * - Escalate critical issues to human oversight (Maggie Forbes)
 * - Aggregate metrics and generate executive summaries
 */

interface CSuiteRequest {
  action: 'receive_report' | 'review_reports' | 'issue_directive' | 'get_status' | 'executive_summary';
  report_data?: {
    reporting_bot: string;
    report_type: string;
    data: any;
    priority?: 'normal' | 'high' | 'urgent' | 'critical';
  };
  directive_data?: {
    target_bot?: string;
    action_type: string;
    instructions: any;
  };
  time_range?: '24h' | '7d' | '30d';
}

interface CSuiteResponse {
  success: boolean;
  action: string;
  result?: any;
  executive_summary?: any;
  recommendations?: string[];
  error?: string;
}

/**
 * POST - C-Suite actions
 */
export async function POST(request: NextRequest): Promise<NextResponse<CSuiteResponse>> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: CSuiteRequest = await request.json();
    const { action, report_data, directive_data, time_range = '24h' } = body;

    switch (action) {
      case 'receive_report':
        return await receiveReport(supabase, report_data, startTime);

      case 'review_reports':
        return await reviewReports(supabase, time_range, startTime);

      case 'issue_directive':
        return await issueDirective(supabase, directive_data, startTime);

      case 'executive_summary':
        return await generateExecutiveSummary(supabase, time_range, startTime);

      default:
        return NextResponse.json({
          success: false,
          action,
          error: 'Invalid action. Supported: receive_report, review_reports, issue_directive, executive_summary'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[MFS C-Suite] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'mfs-csuite',
        action_type: 'error',
        action_details: {
          error_message: error.message,
          error_stack: error.stack
        },
        status: 'failed'
      });

    return NextResponse.json({
      success: false,
      action: 'error',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Receive a report from an operational bot
 */
async function receiveReport(
  supabase: any,
  report_data: any,
  startTime: number
): Promise<NextResponse<CSuiteResponse>> {

  if (!report_data) {
    return NextResponse.json({
      success: false,
      action: 'receive_report',
      error: 'report_data is required'
    }, { status: 400 });
  }

  const { reporting_bot, report_type, data, priority = 'normal' } = report_data;

  // Store report in database
  const { data: report, error: reportError } = await supabase
    .from('csuite_reports')
    .insert({
      reporting_bot,
      report_type,
      report_data: data,
      priority,
      status: 'new'
    })
    .select('id')
    .single();

  if (reportError) {
    console.error('[MFS C-Suite] Failed to store report:', reportError);
    throw new Error('Failed to store report');
  }

  // Check if report requires immediate action
  const requiresAction = priority === 'urgent' || priority === 'critical';

  if (requiresAction) {
    console.log(`[MFS C-Suite] 🚨 ${priority.toUpperCase()} report from ${reporting_bot}: ${report_type}`);
    // TODO: Send notification to human oversight (email/SMS to Maggie)
  } else {
    console.log(`[MFS C-Suite] 📊 Report received from ${reporting_bot}: ${report_type} (${priority})`);
  }

  const responseTime = Date.now() - startTime;

  // Log action
  await supabase
    .from('bot_actions_log')
    .insert({
      bot_name: 'mfs-csuite',
      action_type: 'receive_report',
      action_details: {
        reporting_bot,
        report_type,
        priority,
        report_id: report.id,
        response_time_ms: responseTime
      },
      status: 'completed'
    });

  // Update C-Suite bot health
  await supabase
    .from('ai_bot_health')
    .upsert({
      bot_name: 'mfs-csuite',
      status: 'healthy',
      last_active_at: new Date().toISOString(),
      average_response_time: responseTime,
      metadata: {
        last_report_from: reporting_bot,
        last_report_type: report_type,
        last_priority: priority
      }
    }, {
      onConflict: 'bot_name'
    });

  return NextResponse.json({
    success: true,
    action: 'receive_report',
    result: {
      report_id: report.id,
      reporting_bot,
      report_type,
      priority,
      requires_immediate_action: requiresAction
    }
  });
}

/**
 * Review pending reports and identify issues
 */
async function reviewReports(
  supabase: any,
  time_range: string,
  startTime: number
): Promise<NextResponse<CSuiteResponse>> {

  const timeFilter = time_range === '24h' ? '24 hours' :
                     time_range === '7d' ? '7 days' : '30 days';

  // Get all reports in time range
  const { data: reports, error: reportsError } = await supabase
    .from('csuite_reports')
    .select('*')
    .gte('created_at', `now() - interval '${timeFilter}'`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (reportsError) {
    throw new Error('Failed to fetch reports');
  }

  // Categorize reports
  const urgent = reports.filter((r: any) => r.priority === 'urgent' || r.priority === 'critical');
  const unreviewed = reports.filter((r: any) => r.status === 'new');
  const byBot = reports.reduce((acc: any, r: any) => {
    acc[r.reporting_bot] = (acc[r.reporting_bot] || 0) + 1;
    return acc;
  }, {});

  const responseTime = Date.now() - startTime;

  // Log action
  await supabase
    .from('bot_actions_log')
    .insert({
      bot_name: 'mfs-csuite',
      action_type: 'review_reports',
      action_details: {
        time_range,
        total_reports: reports.length,
        urgent_count: urgent.length,
        unreviewed_count: unreviewed.length,
        response_time_ms: responseTime
      },
      status: 'completed'
    });

  return NextResponse.json({
    success: true,
    action: 'review_reports',
    result: {
      time_range,
      total_reports: reports.length,
      urgent_reports: urgent.length,
      unreviewed_reports: unreviewed.length,
      reports_by_bot: byBot,
      urgent_items: urgent.slice(0, 5) // Top 5 urgent
    },
    recommendations: urgent.length > 0 ? [
      `${urgent.length} urgent/critical reports require immediate attention`,
      'Review bot_failure reports first',
      'Check system health dashboard'
    ] : [
      'All systems operating normally',
      'No urgent issues detected'
    ]
  });
}

/**
 * Issue a directive to operational bot(s)
 */
async function issueDirective(
  supabase: any,
  directive_data: any,
  startTime: number
): Promise<NextResponse<CSuiteResponse>> {

  if (!directive_data) {
    return NextResponse.json({
      success: false,
      action: 'issue_directive',
      error: 'directive_data is required'
    }, { status: 400 });
  }

  const { target_bot, action_type, instructions } = directive_data;

  // Store directive in database
  const { data: directive, error: directiveError } = await supabase
    .from('csuite_actions')
    .insert({
      target_bot: target_bot || null,
      action_type,
      action_data: instructions,
      status: 'pending'
    })
    .select('id')
    .single();

  if (directiveError) {
    throw new Error('Failed to create directive');
  }

  console.log(`[MFS C-Suite] 📋 Directive issued to ${target_bot || 'ALL BOTS'}: ${action_type}`);

  const responseTime = Date.now() - startTime;

  // Log action
  await supabase
    .from('bot_actions_log')
    .insert({
      bot_name: 'mfs-csuite',
      action_type: 'issue_directive',
      action_details: {
        target_bot,
        action_type,
        directive_id: directive.id,
        response_time_ms: responseTime
      },
      status: 'completed'
    });

  return NextResponse.json({
    success: true,
    action: 'issue_directive',
    result: {
      directive_id: directive.id,
      target_bot: target_bot || 'system-wide',
      action_type,
      status: 'pending'
    }
  });
}

/**
 * Generate executive summary using AI
 */
async function generateExecutiveSummary(
  supabase: any,
  time_range: string,
  startTime: number
): Promise<NextResponse<CSuiteResponse>> {

  // Get dashboard data
  const { data: dashboard } = await supabase
    .from('csuite_dashboard')
    .select('*')
    .single();

  // Get bot health
  const { data: botHealth } = await supabase
    .from('ai_bot_health')
    .select('*')
    .neq('bot_name', 'mfs-csuite');

  // Get recent reports
  const timeFilter = time_range === '24h' ? '24 hours' :
                     time_range === '7d' ? '7 days' : '30 days';

  const { data: recentReports } = await supabase
    .from('csuite_reports')
    .select('reporting_bot, report_type, priority, created_at')
    .gte('created_at', `now() - interval '${timeFilter}'`)
    .order('created_at', { ascending: false })
    .limit(50);

  // Use AI to generate executive summary
  const aiClient = getAIClient();

  const prompt = `You are the MFS C-Suite Executive Bot for IntroAlignment, a legal services network. Generate a concise executive summary based on the following system data:

**System Health:**
- Healthy Bots: ${dashboard?.healthy_bots || 0}
- Degraded Bots: ${dashboard?.degraded_bots || 0}
- Offline Bots: ${dashboard?.offline_bots || 0}

**Activity (${time_range}):**
- Total Actions: ${dashboard?.actions_24h || 0}
- Failed Actions: ${dashboard?.failures_24h || 0}
- Total Cost: $${dashboard?.cost_24h || 0}

**Reports:**
- New Reports: ${dashboard?.new_reports || 0}
- Urgent Reports: ${dashboard?.urgent_reports || 0}
- Critical Reports: ${dashboard?.critical_reports || 0}

**Recent Activity:**
${recentReports?.slice(0, 10).map((r: any) =>
  `- ${r.reporting_bot}: ${r.report_type} (${r.priority})`
).join('\n')}

Provide:
1. Overall system status (1-2 sentences)
2. Key metrics summary
3. Top 3 priorities for executive attention
4. Recommended actions

Keep it concise and actionable for Maggie Forbes (business owner).`;

  const aiResponse = await aiClient.generateResponse(
    [
      { role: 'system', content: 'You are an executive AI assistant providing strategic insights.' },
      { role: 'user', content: prompt }
    ],
    {
      maxTokens: 512,
      temperature: 0.7,
      preferProvider: 'anthropic' // Use high quality for executive summaries
    }
  );

  const responseTime = Date.now() - startTime;

  // Log action
  await supabase
    .from('bot_actions_log')
    .insert({
      bot_name: 'mfs-csuite',
      action_type: 'executive_summary',
      action_details: {
        time_range,
        ai_model: aiResponse.model,
        ai_provider: aiResponse.provider,
        ai_cost: aiResponse.cost,
        response_time_ms: responseTime
      },
      status: 'completed',
      cost: aiResponse.cost
    });

  return NextResponse.json({
    success: true,
    action: 'executive_summary',
    executive_summary: {
      generated_at: new Date().toISOString(),
      time_range,
      system_health: {
        healthy_bots: dashboard?.healthy_bots || 0,
        degraded_bots: dashboard?.degraded_bots || 0,
        offline_bots: dashboard?.offline_bots || 0
      },
      activity: {
        total_actions: dashboard?.actions_24h || 0,
        failed_actions: dashboard?.failures_24h || 0,
        success_rate: dashboard?.actions_24h > 0
          ? ((dashboard.actions_24h - dashboard.failures_24h) / dashboard.actions_24h * 100).toFixed(1) + '%'
          : 'N/A',
        total_cost: `$${dashboard?.cost_24h || 0}`
      },
      alerts: {
        new_reports: dashboard?.new_reports || 0,
        urgent_reports: dashboard?.urgent_reports || 0,
        critical_reports: dashboard?.critical_reports || 0
      },
      ai_analysis: aiResponse.content,
      ai_model_used: aiResponse.model,
      ai_cost: aiResponse.cost
    }
  });
}

/**
 * GET - C-Suite bot status and dashboard
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();

  try {
    // Get C-Suite bot health
    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      .eq('bot_name', 'mfs-csuite')
      .single();

    // Get dashboard summary
    const { data: dashboard } = await supabase
      .from('csuite_dashboard')
      .select('*')
      .single();

    // Get all operational bot health
    const { data: botHealth } = await supabase
      .from('ai_bot_health')
      .select('*')
      .neq('bot_name', 'mfs-csuite')
      .order('bot_name');

    // Get recent C-Suite actions
    const { data: recentActions } = await supabase
      .from('bot_actions_log')
      .select('*')
      .eq('bot_name', 'mfs-csuite')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      bot_name: 'mfs-csuite',
      role: 'Executive Oversight & Strategic Decision Making',
      status: health?.status || 'unknown',
      health,
      dashboard_summary: dashboard,
      operational_bots: botHealth,
      recent_actions: recentActions,
      capabilities: [
        'Receives reports from all operational bots',
        'Monitors system-wide health and performance',
        'Issues strategic directives to bots',
        'Generates AI-powered executive summaries',
        'Escalates critical issues to human oversight',
        'Aggregates metrics across all systems',
        'Makes data-driven strategic recommendations'
      ],
      reporting_structure: {
        csuite: 'mfs-csuite (This Bot)',
        operational_bots: [
          'atlas - Research Bot',
          'dan - Lead Scraping & Qualification',
          'henry - Email Outreach & Campaigns',
          'dave - Matching & Compatibility',
          'annie - Conversation & Onboarding',
          'jordan - Analytics & Insights'
        ]
      }
    });

  } catch (error: any) {
    console.error('[MFS C-Suite] Status check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
