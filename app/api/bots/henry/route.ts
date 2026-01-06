import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { updateBotHealth, logBotAction } from '@/lib/bots/health-tracker';
// ============================================================================
// HENRY - Operations & User Pipeline Bot
// Handles user onboarding, health checks, and pipeline management
// ============================================================================


// ============================================================================
// ONBOARDING AUTOMATION
// ============================================================================

/**
 * Check user onboarding status and determine next steps
 */
async function checkOnboardingStatus(userId: string, supabase: any) {
  let { data: onboarding } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!onboarding) {
    // Create onboarding record if doesn't exist
    const { data: newOnboarding } = await supabase
      .from('user_onboarding')
      .insert({
        
        user_id: userId,
        automated_by: 'henry',
        current_step: 'welcome',
        next_action: 'send_welcome_email',
        next_action_at: new Date().toISOString()
      })
      .select()
      .single();

    onboarding = newOnboarding;
  }

  return onboarding;
}

/**
 * Determine current onboarding step
 */
function determineOnboardingStep(onboarding: any): string {
  if (!onboarding.welcome_email_sent) return 'welcome';
  if (!onboarding.account_created) return 'account_setup';
  if (!onboarding.profile_completed) return 'profile_completion';
  if (!onboarding.preferences_completed) return 'preferences';
  if (!onboarding.first_login) return 'first_login';
  if (!onboarding.onboarding_completed) return 'finalization';
  return 'completed';
}

/**
 * Get onboarding progress percentage
 */
function calculateOnboardingProgress(onboarding: any): number {
  const steps = [
    onboarding.welcome_email_sent,
    onboarding.account_created,
    onboarding.profile_completed,
    onboarding.preferences_completed,
    onboarding.first_login,
    onboarding.onboarding_completed
  ];

  const completed = steps.filter(Boolean).length;
  return Math.round((completed / steps.length) * 100);
}

/**
 * Process onboarding step completion
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

    console.log('[HENRY] Processing action:', action, 'for user:', user.id);

    // Route to appropriate handler
    switch (action) {
      case 'check_onboarding':
        return await handleCheckOnboarding(user.id, supabase);

      case 'complete_step':
        return await handleCompleteStep(user.id, data.step, supabase);

      case 'health_check':
        return await handleHealthCheck(user.id, supabase);

      case 'get_pipeline_status':
        return await handlePipelineStatus(user.id, supabase);

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[HENRY] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request'
      },
      { status: 500 }
    );
  }
}

/**
 * Check onboarding status handler
 */
async function handleCheckOnboarding(userId: string, supabase: any) {
  const onboarding = await checkOnboardingStatus(userId, supabase);
  const currentStep = determineOnboardingStep(onboarding);
  const progress = calculateOnboardingProgress(onboarding);

  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('full_name, email, created_at, onboarding_completed')
    .eq('id', userId)
    .single();

  // Update bot health
  await supabase
    .from('ai_bot_health')
    .upsert({
      
      bot_name: 'henry',
      status: 'healthy',
      last_active: new Date().toISOString(),
      actions_today: 1,
      actions_this_hour: 1,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'bot_name'
    });

  // Log action
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'henry',
      action_type: 'onboarding_check',
      action_data: {
        user_id: userId,
        current_step: currentStep,
        progress: progress
      },
      status: 'executed',
      executed_at: new Date().toISOString()
    });

  return NextResponse.json({
    success: true,
    onboarding: {
      currentStep,
      progress,
      details: onboarding,
      recommendations: getOnboardingRecommendations(currentStep, onboarding)
    },
    user
  });
}

/**
 * Complete onboarding step handler
 */
async function handleCompleteStep(userId: string, step: string, supabase: any) {
  const updates: any = {
    updated_at: new Date().toISOString()
  };

  const timestamp = new Date().toISOString();

  switch (step) {
    case 'welcome':
      updates.welcome_email_sent = true;
      updates.welcome_email_sent_at = timestamp;
      updates.current_step = 'account_setup';
      updates.next_action = 'verify_account';
      break;

    case 'account_setup':
      updates.account_created = true;
      updates.account_created_at = timestamp;
      updates.current_step = 'profile_completion';
      updates.next_action = 'complete_profile';
      break;

    case 'profile':
      updates.profile_completed = true;
      updates.profile_completed_at = timestamp;
      updates.current_step = 'preferences';
      updates.next_action = 'set_preferences';
      break;

    case 'preferences':
      updates.preferences_completed = true;
      updates.preferences_completed_at = timestamp;
      updates.current_step = 'first_login';
      updates.next_action = 'wait_for_login';
      break;

    case 'first_login':
      updates.first_login = true;
      updates.first_login_at = timestamp;
      updates.current_step = 'finalization';
      updates.next_action = 'start_matching';
      break;

    case 'complete':
      updates.onboarding_completed = true;
      updates.onboarding_completed_at = timestamp;
      updates.current_step = 'completed';
      updates.next_action = null;

      // Update user record
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_bot_status: 'completed',
          onboarding_bot_completed_at: timestamp
        })
        .eq('id', userId);
      break;
  }

  // Update onboarding record
  const { data: updated } = await supabase
    .from('user_onboarding')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  // Log completion
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'henry',
      action_type: 'onboarding_step_completed',
      action_data: {
        user_id: userId,
        step_completed: step,
        next_step: updates.current_step
      },
      status: 'executed',
      executed_at: timestamp
    });

  return NextResponse.json({
    success: true,
    message: `Step ${step} completed successfully`,
    onboarding: updated,
    nextStep: updates.current_step
  });
}

/**
 * User health check handler
 */
async function handleHealthCheck(userId: string, supabase: any) {
  // Get user activity metrics
  const { data: user } = await supabase
    .from('users')
    .select('created_at, onboarding_completed, last_bot_interaction_at')
    .eq('id', userId)
    .single();

  // Calculate last login days
  const lastLogin = user?.last_bot_interaction_at || user?.created_at;
  const daysSinceLogin = Math.floor(
    (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get match activity
  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('user1_id', userId);

  // Get message activity
  const { count: messageCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Calculate engagement score (0-100)
  let engagementScore = 0;
  if (user?.onboarding_completed) engagementScore += 20;
  if (daysSinceLogin <= 7) engagementScore += 30;
  if ((matchCount || 0) > 0) engagementScore += 25;
  if ((messageCount || 0) > 0) engagementScore += 25;

  // Determine status
  let engagementStatus = 'churned';
  if (engagementScore >= 75) engagementStatus = 'active';
  else if (engagementScore >= 50) engagementStatus = 'engaged';
  else if (engagementScore >= 25) engagementStatus = 'at_risk';
  else if (engagementScore > 0) engagementStatus = 'inactive';

  // Save health check
  const { data: healthCheck } = await supabase
    .from('user_health_checks')
    .insert({
      
      user_id: userId,
      last_login_days_ago: daysSinceLogin,
      messages_sent: messageCount || 0,
      matches_viewed: matchCount || 0,
      engagement_score: engagementScore,
      engagement_status: engagementStatus,
      ai_analysis: `User ${engagementStatus}. ${daysSinceLogin} days since last login.`,
      recommended_actions: JSON.stringify([
        engagementStatus === 'at_risk' ? 'Send reactivation email' : null,
        matchCount === 0 ? 'Generate new matches' : null
      ].filter(Boolean)),
      checked_at: new Date().toISOString()
    })
    .select()
    .single();

  return NextResponse.json({
    success: true,
    health: {
      engagementScore,
      engagementStatus,
      daysSinceLogin,
      metrics: {
        matches: matchCount || 0,
        messages: messageCount || 0
      }
    },
    recommendations: getHealthRecommendations(engagementStatus, daysSinceLogin)
  });
}

/**
 * Pipeline status handler
 */
async function handlePipelineStatus(userId: string, supabase: any) {
  const onboarding = await checkOnboardingStatus(userId, supabase);
  const progress = calculateOnboardingProgress(onboarding);

  return NextResponse.json({
    success: true,
    pipeline: {
      stage: determineOnboardingStep(onboarding),
      progress,
      onboarding
    }
  });
}

/**
 * Get onboarding recommendations
 */
function getOnboardingRecommendations(step: string, onboarding: any): string[] {
  const recommendations: string[] = [];

  switch (step) {
    case 'welcome':
      recommendations.push('Complete account verification');
      break;
    case 'account_setup':
      recommendations.push('Set up your profile');
      break;
    case 'profile_completion':
      recommendations.push('Add photos to your profile');
      recommendations.push('Complete personality questions');
      break;
    case 'preferences':
      recommendations.push('Set your match preferences');
      break;
    case 'first_login':
      recommendations.push('Explore your first matches');
      break;
  }

  return recommendations;
}

/**
 * Get health recommendations
 */
function getHealthRecommendations(status: string, daysSinceLogin: number): string[] {
  const recommendations: string[] = [];

  if (status === 'at_risk' || status === 'inactive') {
    recommendations.push('We miss you! Check out your new matches');
    if (daysSinceLogin > 14) {
      recommendations.push('Your profile might need updating');
    }
  }

  if (status === 'churned') {
    recommendations.push('Let\'s reconnect! We have exciting new features');
  }

  return recommendations;
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      
      .eq('bot_name', 'henry')
      .single();

    return NextResponse.json({
      bot: 'henry',
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
