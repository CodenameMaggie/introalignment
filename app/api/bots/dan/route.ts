import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { updateBotHealth, logBotAction } from '@/lib/bots/health-tracker';
// ============================================================================
// DAN - Marketing & Outreach Bot
// Handles email campaigns, promotions, and marketing automation
// ============================================================================


// ============================================================================
// MARKETING HELPERS
// ============================================================================

/**
 * Get user's marketing preferences
 */
async function getMarketingPreferences(userId: string, supabase: any) {
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('email_notifications, marketing_emails')
    .eq('user_id', userId)
    .single();

  return {
    user,
    preferences: prefs || { email_notifications: true, marketing_emails: true }
  };
}

/**
 * Track email sent
 */
async function trackEmailSent(userId: string, emailType: string, supabase: any) {
  await supabase
    .from('email_tracking')
    .insert({
      
      user_id: userId,
      email_type: emailType,
      sent_at: new Date().toISOString(),
      sent_by: 'dan_bot'
    });
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (optional for some marketing operations)
    const { data: { user } } = await supabase.auth.getUser();

    // Parse request body
    const body = await request.json();
    const { action, data } = body;

    console.log('[DAN] Processing action:', action);

    // Route to appropriate handler
    switch (action) {
      case 'send_promotional_email':
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return await handlePromotionalEmail(user.id, data, supabase);

      case 'process_referral':
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return await handleReferral(user.id, data, supabase);

      case 'get_campaign_stats':
        return await handleCampaignStats(data, supabase);

      case 'schedule_campaign':
        return await handleScheduleCampaign(data, supabase);

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[DAN] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process marketing request'
      },
      { status: 500 }
    );
  }
}

/**
 * Send promotional email handler
 */
async function handlePromotionalEmail(userId: string, data: any, supabase: any) {
  const { preferences, user: userData } = await getMarketingPreferences(userId, supabase);

  // Check if user has opted out of marketing emails
  if (!preferences.marketing_emails) {
    return NextResponse.json({
      success: false,
      message: 'User has opted out of marketing emails'
    });
  }

  const { emailType, subject, content } = data;

  // Log the email send request
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'dan',
      action_type: 'send_email',
      action_data: {
        user_id: userId,
        email_type: emailType,
        subject: subject
      },
      status: 'executed',
      executed_at: new Date().toISOString()
    });

  // Track email
  await trackEmailSent(userId, emailType, supabase);

  // Update bot health
  await supabase
    .from('ai_bot_health')
    .upsert({
      
      bot_name: 'dan',
      status: 'healthy',
      last_active: new Date().toISOString(),
      actions_today: 1,
      actions_this_hour: 1,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'bot_name'
    });

  return NextResponse.json({
    success: true,
    message: 'Promotional email scheduled',
    emailType,
    recipient: userData?.email
  });
}

/**
 * Handle referral program
 */
async function handleReferral(userId: string, data: any, supabase: any) {
  const { referredEmail } = data;

  // Check if referral already exists
  const { data: existing } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_user_id', userId)
    .eq('referred_email', referredEmail)
    .single();

  if (existing) {
    return NextResponse.json({
      success: false,
      message: 'This email has already been referred'
    });
  }

  // Create referral record
  const { data: referral } = await supabase
    .from('referrals')
    .insert({
      
      referrer_user_id: userId,
      referred_email: referredEmail,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Log referral action
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'dan',
      action_type: 'referral_created',
      action_data: {
        referrer_user_id: userId,
        referred_email: referredEmail
      },
      status: 'executed',
      executed_at: new Date().toISOString()
    });

  return NextResponse.json({
    success: true,
    message: 'Referral created successfully',
    referral
  });
}

/**
 * Get campaign stats handler
 */
async function handleCampaignStats(data: any, supabase: any) {
  const { campaignId } = data;

  // Get email tracking stats
  const { data: emails, count } = await supabase
    .from('email_tracking')
    .select('*', { count: 'exact' })
    .eq('campaign_id', campaignId || null);

  const opened = emails?.filter((e: any) => e.opened_at).length || 0;
  const clicked = emails?.filter((e: any) => e.clicked_at).length || 0;

  return NextResponse.json({
    success: true,
    stats: {
      totalSent: count || 0,
      opened,
      clicked,
      openRate: count ? ((opened / count) * 100).toFixed(2) : 0,
      clickRate: count ? ((clicked / count) * 100).toFixed(2) : 0
    }
  });
}

/**
 * Schedule campaign handler
 */
async function handleScheduleCampaign(data: any, supabase: any) {
  const { campaignName, scheduledFor, targetAudience } = data;

  // Create campaign record
  const { data: campaign } = await supabase
    .from('marketing_campaigns')
    .insert({
      
      name: campaignName,
      scheduled_for: scheduledFor,
      target_audience: targetAudience,
      status: 'scheduled',
      created_by: 'dan_bot',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Log campaign creation
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'dan',
      action_type: 'campaign_scheduled',
      action_data: {
        campaign_id: campaign?.id,
        campaign_name: campaignName,
        scheduled_for: scheduledFor
      },
      status: 'executed',
      executed_at: new Date().toISOString()
    });

  return NextResponse.json({
    success: true,
    message: 'Campaign scheduled successfully',
    campaign
  });
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      
      .eq('bot_name', 'dan')
      .single();

    return NextResponse.json({
      bot: 'dan',
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
