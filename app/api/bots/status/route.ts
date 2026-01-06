import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// BOT SYSTEM STATUS DASHBOARD
// Central monitoring endpoint for all 6 bots
// ============================================================================


const ALL_BOTS = ['atlas', 'annie', 'henry', 'dave', 'dan', 'jordan'];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication (optional - can make public for health monitoring)
    const { data: { user } } = await supabase.auth.getUser();

    // Get health status for all bots
    const { data: botHealth } = await supabase
      .from('ai_bot_health')
      .select('*')
      
      .in('bot_name', ALL_BOTS);

    // Get kill switch status
    const { data: killSwitch } = await supabase
      .from('ai_kill_switch')
      .select('*')
      
      .single();

    // Get recent action log (last 100 actions)
    const { data: recentActions } = await supabase
      .from('ai_action_log')
      .select('bot_name, action_type, status, created_at')
      
      .order('created_at', { ascending: false })
      .limit(100);

    // Get governance rules count
    const { count: rulesCount } = await supabase
      .from('ai_governance_rules')
      .select('*', { count: 'exact', head: true })
      
      .eq('is_active', true);

    // Calculate system-wide metrics
    const systemMetrics = {
      totalActionsToday: 0,
      totalActionsThisHour: 0,
      healthyBots: 0,
      degradedBots: 0,
      offlineBots: 0
    };

    const botStatuses: any = {};

    ALL_BOTS.forEach(botName => {
      const health = botHealth?.find(h => h.bot_name === botName);

      if (health) {
        systemMetrics.totalActionsToday += health.actions_today || 0;
        systemMetrics.totalActionsThisHour += health.actions_this_hour || 0;

        if (health.status === 'healthy') systemMetrics.healthyBots++;
        else if (health.status === 'degraded') systemMetrics.degradedBots++;
        else systemMetrics.offlineBots++;

        botStatuses[botName] = {
          status: health.status,
          lastActive: health.last_active,
          actionsToday: health.actions_today || 0,
          actionsThisHour: health.actions_this_hour || 0,
          successRate: health.success_rate || 100,
          lastError: health.last_error,
          lastErrorAt: health.last_error_at
        };
      } else {
        systemMetrics.offlineBots++;
        botStatuses[botName] = {
          status: 'unknown',
          lastActive: null,
          actionsToday: 0,
          actionsThisHour: 0,
          successRate: 0
        };
      }
    });

    // Action breakdown by bot
    const actionBreakdown: any = {};
    ALL_BOTS.forEach(bot => {
      const botActions = recentActions?.filter(a => a.bot_name === bot) || [];
      actionBreakdown[bot] = {
        total: botActions.length,
        successful: botActions.filter(a => a.status === 'executed').length,
        failed: botActions.filter(a => a.status === 'failed').length,
        pending: botActions.filter(a => a.status === 'pending').length
      };
    });

    // Calculate overall system health
    const systemHealth = calculateSystemHealth(systemMetrics, killSwitch);

    return NextResponse.json({
      systemHealth,
      killSwitch: {
        isActive: killSwitch?.is_active || false,
        activatedBy: killSwitch?.activated_by,
        activatedAt: killSwitch?.activated_at,
        reason: killSwitch?.reason
      },
      metrics: systemMetrics,
      bots: botStatuses,
      actionBreakdown,
      governanceRules: {
        totalActive: rulesCount || 0
      },
      recentActivity: {
        last24Hours: recentActions?.length || 0,
        recentActions: recentActions?.slice(0, 10) || []
      },
      botDescriptions: {
        atlas: 'Master router - Routes requests to specialized bots',
        annie: 'Conversations & support - Handles matchmaking questions',
        henry: 'Operations - Manages user onboarding and health checks',
        dave: 'Finance - Handles billing and subscriptions',
        dan: 'Marketing - Manages campaigns and outreach',
        jordan: 'Compliance - Ensures safety and privacy'
      }
    });

  } catch (error: any) {
    console.error('[BOT STATUS] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve bot status',
        systemHealth: 'error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall system health based on bot statuses
 */
function calculateSystemHealth(metrics: any, killSwitch: any): string {
  if (killSwitch?.is_active) {
    return 'emergency_stopped';
  }

  const totalBots = ALL_BOTS.length;
  const healthyPercentage = (metrics.healthyBots / totalBots) * 100;

  if (healthyPercentage === 100) return 'healthy';
  if (healthyPercentage >= 80) return 'good';
  if (healthyPercentage >= 50) return 'degraded';
  if (healthyPercentage >= 20) return 'critical';
  return 'offline';
}

/**
 * POST endpoint for administrative actions
 */
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
    const { action, data } = body;

    console.log('[BOT STATUS] Admin action:', action);

    // Route to appropriate handler
    switch (action) {
      case 'activate_kill_switch':
        return await handleKillSwitch(true, data, supabase, user);

      case 'deactivate_kill_switch':
        return await handleKillSwitch(false, data, supabase, user);

      case 'reset_bot_health':
        return await handleResetHealth(data.botName, supabase);

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[BOT STATUS] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process admin action'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle kill switch activation/deactivation
 */
async function handleKillSwitch(
  activate: boolean,
  data: any,
  supabase: any,
  user: any
) {
  const { reason } = data;

  const updates: any = {
    is_active: activate,
    updated_at: new Date().toISOString()
  };

  if (activate) {
    updates.activated_by = user.email || user.id;
    updates.activated_at = new Date().toISOString();
    updates.reason = reason || 'Manual activation';
  } else {
    updates.deactivated_at = new Date().toISOString();
  }

  await supabase
    .from('ai_kill_switch')
    .upsert({
      
      ...updates
    }, {
      onConflict: 'id'
    });

  // Log action
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'system',
      action_type: activate ? 'kill_switch_activated' : 'kill_switch_deactivated',
      action_data: {
        activated_by: user.email || user.id,
        reason: reason || 'Manual action'
      },
      status: 'executed',
      executed_at: new Date().toISOString()
    });

  return NextResponse.json({
    success: true,
    message: activate
      ? 'All bots have been stopped via kill switch'
      : 'Kill switch deactivated - bots are operational',
    killSwitch: updates
  });
}

/**
 * Handle bot health reset
 */
async function handleResetHealth(botName: string, supabase: any) {
  await supabase
    .from('ai_bot_health')
    .update({
      status: 'healthy',
      last_error: null,
      last_error_at: null,
      actions_today: 0,
      actions_this_hour: 0,
      success_rate: 100,
      updated_at: new Date().toISOString()
    })
    
    .eq('bot_name', botName);

  return NextResponse.json({
    success: true,
    message: `${botName.toUpperCase()} health status reset successfully`
  });
}
