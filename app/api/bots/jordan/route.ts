import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateBotHealth, logBotAction } from '@/lib/bots/health-tracker';
import { generateRuleBasedResponse } from '@/lib/bots/rule-based-responses';

// ============================================================================
// JORDAN - Legal, Compliance & Safety Bot
// Handles user safety, privacy compliance, content moderation, and reporting
// ============================================================================


// ============================================================================
// SAFETY & COMPLIANCE HELPERS
// ============================================================================

/**
 * Analyze content for safety violations using rule-based approach
 */
async function analyzeContentSafety(content: string): Promise<{
  isSafe: boolean;
  violations: string[];
  severity: string;
  reasoning: string;
}> {
  const contentLower = content.toLowerCase();
  const violations: string[] = [];

  // Define violation patterns
  const patterns = {
    harassment: ['harass', 'bully', 'stalk', 'threaten', 'intimidate'],
    hate_speech: ['hate', 'racist', 'sexist', 'discriminat', 'bigot'],
    sexual_harassment: ['explicit', 'sexual', 'nude', 'porn', 'xxx'],
    violence: ['kill', 'harm', 'attack', 'weapon', 'violence', 'assault'],
    spam: ['click here', 'buy now', 'limited time', 'act fast', '$$'],
    personal_info: ['ssn', 'social security', 'credit card', 'password'],
    illegal: ['drug', 'illegal', 'scam', 'fraud']
  };

  // Check for violations
  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      violations.push(category.replace('_', ' '));
    }
  }

  // Determine severity
  let severity = 'none';
  if (violations.length === 0) {
    severity = 'none';
  } else if (violations.some(v => ['violence', 'hate speech', 'sexual harassment'].includes(v))) {
    severity = 'critical';
  } else if (violations.length >= 3) {
    severity = 'high';
  } else if (violations.length >= 2) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  return {
    isSafe: violations.length === 0,
    violations,
    severity,
    reasoning: violations.length > 0
      ? `Detected potential ${violations.join(', ')}`
      : 'Content appears safe'
  };
}

/**
 * Check user's safety history
 */
async function checkUserSafetyHistory(userId: string, supabase: any) {
  const { data: reports } = await supabase
    .from('user_reports')
    .select('*')
    .eq('reported_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: violations } = await supabase
    .from('safety_violations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    reports: reports || [],
    violations: violations || [],
    totalReports: reports?.length || 0,
    recentViolations: violations?.length || 0
  };
}

/**
 * Calculate user risk score
 */
function calculateRiskScore(safetyHistory: any): number {
  const { totalReports, recentViolations } = safetyHistory;

  let score = 0;
  score += totalReports * 10; // Each report adds 10 points
  score += recentViolations * 20; // Each violation adds 20 points

  return Math.min(score, 100); // Cap at 100
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (optional for some compliance operations)
    const { data: { user } } = await supabase.auth.getUser();

    // Parse request body
    const body = await request.json();
    const { action, data } = body;

    console.log('[JORDAN] Processing action:', action);

    // Route to appropriate handler
    switch (action) {
      case 'report_user':
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return await handleUserReport(user.id, data, supabase);

      case 'moderate_content':
        return await handleContentModeration(data, supabase);

      case 'check_user_safety':
        return await handleSafetyCheck(data.userId, supabase);

      case 'privacy_request':
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return await handlePrivacyRequest(user.id, data, supabase);

      case 'block_user':
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return await handleBlockUser(user.id, data, supabase);

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[JORDAN] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process safety request'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle user report
 */
async function handleUserReport(reporterId: string, data: any, supabase: any) {
  const { reportedUserId, reason, description } = data;

  // Create report record
  const { data: report } = await supabase
    .from('user_reports')
    .insert({
      
      reporter_user_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      description,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Analyze content if provided
  let contentAnalysis = null;
  if (description) {
    contentAnalysis = await analyzeContentSafety(description);

    // If critical violation detected, auto-escalate
    if (contentAnalysis.severity === 'critical' || contentAnalysis.severity === 'high') {
      await supabase
        .from('user_reports')
        .update({
          status: 'escalated',
          priority: 'urgent',
          escalated_at: new Date().toISOString()
        })
        .eq('id', report?.id);

      // Create support ticket for immediate review
      await supabase
        .from('support_tickets')
        .insert({
          
          user_id: reporterId,
          subject: `URGENT: User Report - ${reason}`,
          description: `Reported User ID: ${reportedUserId}\nReason: ${reason}\n\nAI Analysis: ${contentAnalysis.reasoning}\nViolations: ${contentAnalysis.violations.join(', ')}\n\nDescription: ${description}`,
          category: 'safety',
          priority: 'urgent',
          status: 'open',
          source: 'ai_bot',
          escalated: true,
          escalated_at: new Date().toISOString()
        });
    }
  }

  // Log action
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'jordan',
      action_type: 'user_reported',
      action_data: {
        reporter_user_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        severity: contentAnalysis?.severity || 'unknown',
        escalated: contentAnalysis?.severity === 'critical' || contentAnalysis?.severity === 'high'
      },
      status: 'executed',
      executed_at: new Date().toISOString()
    });

  // Update bot health
  await supabase
    .from('ai_bot_health')
    .upsert({
      
      bot_name: 'jordan',
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
    message: 'Report submitted successfully. Our team will review it shortly.',
    report,
    contentAnalysis,
    escalated: contentAnalysis?.severity === 'critical' || contentAnalysis?.severity === 'high'
  });
}

/**
 * Handle content moderation
 */
async function handleContentModeration(data: any, supabase: any) {
  const { content, userId, contentType } = data;

  // Analyze content
  const analysis = await analyzeContentSafety(content);

  // If unsafe, log violation
  if (!analysis.isSafe) {
    await supabase
      .from('safety_violations')
      .insert({
        
        user_id: userId,
        content_type: contentType,
        violations: analysis.violations,
        severity: analysis.severity,
        reasoning: analysis.reasoning,
        created_at: new Date().toISOString()
      });

    // Log action
    await supabase
      .from('ai_action_log')
      .insert({
        
        bot_name: 'jordan',
        action_type: 'content_moderated',
        action_data: {
          user_id: userId,
          content_type: contentType,
          violations: analysis.violations,
          severity: analysis.severity
        },
        status: 'executed',
        executed_at: new Date().toISOString()
      });
  }

  return NextResponse.json({
    success: true,
    isSafe: analysis.isSafe,
    analysis
  });
}

/**
 * Handle safety check
 */
async function handleSafetyCheck(userId: string, supabase: any) {
  const safetyHistory = await checkUserSafetyHistory(userId, supabase);
  const riskScore = calculateRiskScore(safetyHistory);

  let riskLevel = 'low';
  if (riskScore >= 80) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'medium';

  return NextResponse.json({
    success: true,
    safety: {
      riskScore,
      riskLevel,
      history: safetyHistory
    }
  });
}

/**
 * Handle privacy request (GDPR/CCPA)
 */
async function handlePrivacyRequest(userId: string, data: any, supabase: any) {
  const { requestType } = data; // 'data_export', 'data_deletion', 'opt_out'

  // Create privacy request record (requires human approval)
  const { data: request } = await supabase
    .from('privacy_requests')
    .insert({
      
      user_id: userId,
      request_type: requestType,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Create support ticket for processing
  await supabase
    .from('support_tickets')
    .insert({
      
      user_id: userId,
      subject: `Privacy Request: ${requestType}`,
      description: `User has requested ${requestType}. This requires compliance with data protection regulations.`,
      category: 'privacy',
      priority: 'high',
      status: 'open',
      source: 'ai_bot'
    });

  // Log action (requires approval)
  await supabase
    .from('ai_action_log')
    .insert({
      
      bot_name: 'jordan',
      action_type: 'privacy_request',
      action_data: {
        user_id: userId,
        request_type: requestType
      },
      status: 'pending',
      requires_approval: true,
      executed_at: new Date().toISOString()
    });

  return NextResponse.json({
    success: true,
    message: 'Privacy request submitted. We will process this within 30 days as required by law.',
    request
  });
}

/**
 * Handle block user
 */
async function handleBlockUser(blockerId: string, data: any, supabase: any) {
  const { blockedUserId } = data;

  // Create block record
  await supabase
    .from('user_blocks')
    .insert({
      
      blocker_user_id: blockerId,
      blocked_user_id: blockedUserId,
      created_at: new Date().toISOString()
    });

  // Remove any existing matches
  await supabase
    .from('matches')
    .delete()
    .or(`user1_id.eq.${blockerId},user2_id.eq.${blockedUserId}`)
    .or(`user1_id.eq.${blockedUserId},user2_id.eq.${blockerId}`);

  return NextResponse.json({
    success: true,
    message: 'User blocked successfully'
  });
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: health } = await supabase
      .from('ai_bot_health')
      .select('*')
      
      .eq('bot_name', 'jordan')
      .single();

    return NextResponse.json({
      bot: 'jordan',
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
