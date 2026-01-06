import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { updateBotHealth, logBotAction } from '@/lib/bots/health-tracker';
// ============================================================================
// DAVE - Finance & Billing Bot
// Handles subscription tracking, billing questions, and payment monitoring
// ============================================================================


// ============================================================================
// BILLING HELPERS
// ============================================================================

/**
 * Get user subscription details
 */
async function getUserSubscription(userId: string, supabase: any) {
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single();

  if (!user?.stripe_subscription_id) {
    return { subscription: null, status: 'no_subscription' };
  }

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return {
    subscription,
    status: subscription ? 'active' : 'inactive'
  };
}

/**
 * Get billing history
 */
async function getBillingHistory(userId: string, supabase: any) {
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return payments || [];
}

/**
 * Check for payment issues
 */
async function checkPaymentIssues(userId: string, supabase: any) {
  const { data: failedPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(1);

  return failedPayments && failedPayments.length > 0;
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
    const { action, data } = body;

    console.log('[DAVE] Processing action:', action, 'for user:', user.id);

    // Route to appropriate handler
    switch (action) {
      case 'get_subscription':
        return await handleGetSubscription(user.id, supabase);

      case 'get_billing_history':
        return await handleBillingHistory(user.id, supabase);

      case 'check_payment_status':
        return await handlePaymentStatus(user.id, supabase);

      case 'process_upgrade':
        return await handleUpgrade(user.id, data, supabase);

      case 'cancel_subscription':
        return await handleCancellation(user.id, data, supabase);

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[DAVE] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process billing request'
      },
      { status: 500 }
    );
  }
}

/**
 * Get subscription handler
 */
async function handleGetSubscription(userId: string, supabase: any) {
  const { subscription, status } = await getUserSubscription(userId, supabase);
  const hasPaymentIssues = await checkPaymentIssues(userId, supabase);

  // Get available plans
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true });

  // Update bot health
  await supabase
    .from('ai_bot_health')
    .upsert({
      
      bot_name: 'dave',
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
      
      bot_name: 'dave',
      action_type: 'subscription_check',
      action_data: {
        user_id: userId,
        subscription_status: status,
        has_issues: hasPaymentIssues
      },
      status: 'executed',
      executed_at: new Date().toISOString()
    });

  return NextResponse.json({
    success: true,
    subscription,
    status,
    hasPaymentIssues,
    availablePlans: plans || []
  });
}

/**
 * Get billing history handler
 */
async function handleBillingHistory(userId: string, supabase: any) {
  const payments = await getBillingHistory(userId, supabase);

  return NextResponse.json({
    success: true,
    payments,
    summary: {
      totalPayments: payments.length,
      successfulPayments: payments.filter((p: any) => p.status === 'succeeded').length,
      failedPayments: payments.filter((p: any) => p.status === 'failed').length
    }
  });
}

/**
 * Check payment status handler
 */
async function handlePaymentStatus(userId: string, supabase: any) {
  const hasIssues = await checkPaymentIssues(userId, supabase);
  const { subscription } = await getUserSubscription(userId, supabase);

  return NextResponse.json({
    success: true,
    hasIssues,
    subscription,
    message: hasIssues
      ? 'There is an issue with your payment method. Please update your billing information.'
      : 'Your billing is up to date!'
  });
}

/**
 * Handle upgrade request
 */
async function handleUpgrade(userId: string, data: any, supabase: any) {
  const { planSlug } = data;

  // Get requested plan
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('slug', planSlug)
    .single();

  if (!plan) {
    return NextResponse.json(
      { error: 'Plan not found' },
      { status: 404 }
    );
  }

  // Log upgrade request (actual upgrade handled by Stripe webhook)
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'dave',
      action_type: 'upgrade_request',
      action_data: {
        user_id: userId,
        requested_plan: planSlug,
        plan_name: plan.name,
        price_monthly: plan.price_monthly
      },
      status: 'executed',
      requires_approval: false,
      executed_at: new Date().toISOString()
    });

  return NextResponse.json({
    success: true,
    message: `Upgrade to ${plan.name} plan initiated`,
    plan,
    nextSteps: 'Redirect to Stripe Checkout for payment'
  });
}

/**
 * Handle cancellation request
 */
async function handleCancellation(userId: string, data: any, supabase: any) {
  const { reason } = data;

  // Log cancellation request (requires human approval)
  const { data: actionLog } = await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'dave',
      action_type: 'cancellation_request',
      action_data: {
        user_id: userId,
        reason: reason || 'No reason provided'
      },
      status: 'pending',
      requires_approval: true,
      executed_at: new Date().toISOString()
    })
    .select()
    .single();

  // Create support ticket for manual review
  await supabase
    .from('support_tickets')
    .insert({
      
      user_id: userId,
      subject: 'Subscription Cancellation Request',
      description: `User requested to cancel subscription.\nReason: ${reason || 'Not provided'}`,
      category: 'billing',
      priority: 'high',
      status: 'open',
      source: 'ai_bot'
    });

  return NextResponse.json({
    success: true,
    message: 'We\'re sorry to see you go! A team member will reach out to help with your cancellation.',
    actionLogId: actionLog?.id,
    note: 'Cancellation requires manual approval for customer retention purposes'
  });
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      
      .eq('bot_name', 'dave')
      .single();

    return NextResponse.json({
      bot: 'dave',
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
