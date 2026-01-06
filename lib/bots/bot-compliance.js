/**
 * Bot Compliance Checker
 * 
 * CRITICAL: Every autonomous bot action MUST call this before executing.
 * Enforces legal, ethical, and operational boundaries.
 * 
 * Usage:
 *   const { checkCompliance } = require('../lib/bot-compliance');
 *   const check = await checkCompliance('dan', 'send_email', { to: 'user@example.com' });
 *   if (!check.approved) return res.json({ blocked: true, reason: check.reason });
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// ============================================================================
// HARD LIMITS - CANNOT BE OVERRIDDEN
// ============================================================================

const HARD_LIMITS = {
  // Email limits
  MAX_EMAILS_PER_DAY: 100,           // Resend limit
  MAX_EMAILS_PER_HOUR: 20,           // Rate limit
  MAX_EMAILS_PER_CONTACT_PER_WEEK: 3, // Anti-spam
  
  // Proposal limits
  MAX_PROPOSALS_PER_DAY: 10,
  MAX_PROPOSAL_VALUE: 100000,        // Requires human approval above this
  
  // Onboarding limits
  MAX_ACCOUNTS_PER_DAY: 20,
  
  // AI usage limits
  MAX_AI_CALLS_PER_HOUR: 100,
  MAX_AI_COST_PER_DAY_USD: 50,
  
  // Time boundaries (local time)
  BUSINESS_HOURS_START: 8,           // 8 AM
  BUSINESS_HOURS_END: 18,            // 6 PM
  WEEKEND_EMAILS_ALLOWED: false,
  
  // Content restrictions
  MAX_EMAIL_LENGTH_CHARS: 5000,
  FORBIDDEN_WORDS: [
    'guarantee', 'guaranteed', 'promise', 'definitely',
    'risk-free', 'no risk', '100%', 'unlimited',
    'act now', 'limited time', 'exclusive offer',
    'free money', 'get rich', 'make money fast'
  ],
  
  // Domain restrictions - never email these
  BLOCKED_DOMAINS: [
    'gov', 'mil', 'edu',              // Government, military, education
    'fbi.gov', 'irs.gov', 'sec.gov',  // Federal agencies
  ],
  
  // Personal email domains - require extra caution
  PERSONAL_DOMAINS: [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'protonmail.com'
  ]
};

// ============================================================================
// CAN-SPAM COMPLIANCE
// ============================================================================

const CAN_SPAM_REQUIREMENTS = {
  // Required in every email - UPDATE THIS FOR YOUR BUSINESS
  PHYSICAL_ADDRESS: '123 Your Street, Your City, ST 12345',
  UNSUBSCRIBE_LINK_REQUIRED: true,
  FROM_NAME: 'Your Name',
  FROM_EMAIL: 'you@yourdomain.com',
  REPLY_TO: 'support@yourdomain.com',
  
  // Header requirements
  SUBJECT_NO_DECEPTION: true,
  MUST_IDENTIFY_AS_AD: false, // B2B outreach is not required to identify as ad
};

// ============================================================================
// PRIVACY REQUIREMENTS
// ============================================================================

const PRIVACY_REQUIREMENTS = {
  // Data retention
  MAX_CONTACT_AGE_DAYS: 365,         // Auto-archive contacts older than 1 year
  MAX_EMAIL_LOG_DAYS: 90,            // Keep email logs for 90 days
  
  // Consent tracking
  REQUIRE_OPT_IN: false,             // B2B cold outreach allowed
  HONOR_OPT_OUT_IMMEDIATELY: true,
  
  // Data rights
  ALLOW_DATA_EXPORT: true,
  ALLOW_DATA_DELETION: true,
};

// ============================================================================
// MAIN COMPLIANCE CHECK FUNCTION
// ============================================================================

async function checkCompliance(botName, actionType, actionData = {}) {
  const result = {
    approved: false,
    reason: null,
    warnings: [],
    requirements: []
  };

  try {
    // =========================================================================
    // CHECK 1: Kill Switch
    // =========================================================================
    const { data: killSwitch } = await supabase
      .from('ai_kill_switch')
      .select('is_active, trigger_reason')
      .eq('tenant_id', TENANT_ID)
      .single();

    if (killSwitch?.is_active) {
      result.reason = `KILL SWITCH ACTIVE: ${killSwitch.trigger_reason || 'Emergency stop'}`;
      await logComplianceViolation(botName, actionType, 'kill_switch', result.reason);
      return result;
    }

    // =========================================================================
    // CHECK 2: Bot-specific governance rules
    // =========================================================================
    const { data: rules } = await supabase
      .from('ai_governance_rules')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('is_active', true)
      .or(`bot_name.is.null,bot_name.eq.${botName}`)
      .order('priority', { ascending: false });

    for (const rule of rules || []) {
      if (rule.action_type && rule.action_type !== actionType) continue;
      
      // Check daily limit
      if (rule.daily_limit) {
        const { count } = await supabase
          .from('bot_actions_log')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', TENANT_ID)
          .eq('bot_name', botName)
          .eq('action_type', actionType)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (count >= rule.daily_limit) {
          result.reason = `Daily limit reached for ${actionType}: ${count}/${rule.daily_limit}`;
          await logComplianceViolation(botName, actionType, 'daily_limit', result.reason);
          return result;
        }
      }

      // Check hourly limit
      if (rule.hourly_limit) {
        const { count } = await supabase
          .from('bot_actions_log')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', TENANT_ID)
          .eq('bot_name', botName)
          .eq('action_type', actionType)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (count >= rule.hourly_limit) {
          result.reason = `Hourly limit reached for ${actionType}: ${count}/${rule.hourly_limit}`;
          await logComplianceViolation(botName, actionType, 'hourly_limit', result.reason);
          return result;
        }
      }

      // Check if requires approval
      if (rule.action === 'require_approval' || rule.approval_level === 'human') {
        result.reason = `Action requires human approval: ${rule.rule_name}`;
        result.requirements.push('human_approval');
      }
    }

    // =========================================================================
    // CHECK 3: Email-specific compliance
    // =========================================================================
    if (actionType === 'send_email' || actionType === 'outreach') {
      const emailCheck = await checkEmailCompliance(actionData);
      if (!emailCheck.approved) {
        result.reason = emailCheck.reason;
        await logComplianceViolation(botName, actionType, 'email_compliance', result.reason);
        return result;
      }
      result.warnings.push(...emailCheck.warnings);
      result.requirements.push(...emailCheck.requirements);
    }

    // =========================================================================
    // CHECK 4: Proposal-specific compliance
    // =========================================================================
    if (actionType === 'send_proposal' || actionType === 'proposal_generation') {
      const proposalCheck = await checkProposalCompliance(actionData);
      if (!proposalCheck.approved) {
        result.reason = proposalCheck.reason;
        await logComplianceViolation(botName, actionType, 'proposal_compliance', result.reason);
        return result;
      }
      result.warnings.push(...proposalCheck.warnings);
    }

    // =========================================================================
    // CHECK 5: Time-based restrictions
    // =========================================================================
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    if (actionType === 'send_email' || actionType === 'outreach') {
      // Weekend check
      if ((day === 0 || day === 6) && !HARD_LIMITS.WEEKEND_EMAILS_ALLOWED) {
        result.reason = 'Email sending not allowed on weekends';
        await logComplianceViolation(botName, actionType, 'weekend_restriction', result.reason);
        return result;
      }

      // Business hours check
      if (hour < HARD_LIMITS.BUSINESS_HOURS_START || hour >= HARD_LIMITS.BUSINESS_HOURS_END) {
        result.warnings.push('Email sent outside business hours');
      }
    }

    // =========================================================================
    // CHECK 6: Rate limits
    // =========================================================================
    if (actionType === 'send_email') {
      // Emails per day
      const { count: dailyEmails } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID)
        .gte('sent_at', new Date().toISOString().split('T')[0]);

      if (dailyEmails >= HARD_LIMITS.MAX_EMAILS_PER_DAY) {
        result.reason = `Daily email limit reached: ${dailyEmails}/${HARD_LIMITS.MAX_EMAILS_PER_DAY}`;
        await logComplianceViolation(botName, actionType, 'email_daily_limit', result.reason);
        return result;
      }

      // Emails per hour
      const { count: hourlyEmails } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID)
        .gte('sent_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (hourlyEmails >= HARD_LIMITS.MAX_EMAILS_PER_HOUR) {
        result.reason = `Hourly email limit reached: ${hourlyEmails}/${HARD_LIMITS.MAX_EMAILS_PER_HOUR}`;
        await logComplianceViolation(botName, actionType, 'email_hourly_limit', result.reason);
        return result;
      }
    }

    // All checks passed
    result.approved = true;
    return result;

  } catch (error) {
    console.error('[Compliance Check] Error:', error);
    result.reason = `Compliance check error: ${error.message}`;
    return result;
  }
}

// ============================================================================
// EMAIL COMPLIANCE CHECK
// ============================================================================

async function checkEmailCompliance(emailData) {
  const result = {
    approved: true,
    reason: null,
    warnings: [],
    requirements: []
  };

  const { to, subject, body } = emailData;

  // Check 1: Do Not Contact list
  if (to) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('do_not_contact, email_status')
      .eq('email', to)
      .single();

    if (contact?.do_not_contact) {
      result.approved = false;
      result.reason = `Contact ${to} is on Do Not Contact list`;
      return result;
    }

    if (contact?.email_status === 'bounced') {
      result.approved = false;
      result.reason = `Email ${to} has bounced - cannot send`;
      return result;
    }

    if (contact?.email_status === 'complained') {
      result.approved = false;
      result.reason = `Contact ${to} has filed a spam complaint - cannot send`;
      return result;
    }
  }

  // Check 2: Blocked domains
  if (to) {
    const domain = to.split('@')[1]?.toLowerCase();
    const tld = domain?.split('.').pop();

    if (HARD_LIMITS.BLOCKED_DOMAINS.some(d => domain?.endsWith(d) || tld === d)) {
      result.approved = false;
      result.reason = `Cannot email blocked domain: ${domain}`;
      return result;
    }

    // Warn about personal emails
    if (HARD_LIMITS.PERSONAL_DOMAINS.includes(domain)) {
      result.warnings.push(`Sending to personal email domain: ${domain}`);
    }
  }

  // Check 3: Email frequency to same contact
  if (to) {
    const { count } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('to_email', to)
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (count >= HARD_LIMITS.MAX_EMAILS_PER_CONTACT_PER_WEEK) {
      result.approved = false;
      result.reason = `Contact ${to} has received ${count} emails this week (max: ${HARD_LIMITS.MAX_EMAILS_PER_CONTACT_PER_WEEK})`;
      return result;
    }
  }

  // Check 4: Forbidden words
  const contentToCheck = `${subject || ''} ${body || ''}`.toLowerCase();
  const foundForbidden = HARD_LIMITS.FORBIDDEN_WORDS.filter(word => 
    contentToCheck.includes(word.toLowerCase())
  );

  if (foundForbidden.length > 0) {
    result.approved = false;
    result.reason = `Email contains forbidden words: ${foundForbidden.join(', ')}`;
    return result;
  }

  // Check 5: Content length
  if (body && body.length > HARD_LIMITS.MAX_EMAIL_LENGTH_CHARS) {
    result.warnings.push(`Email body exceeds recommended length: ${body.length} chars`);
  }

  // Requirements: CAN-SPAM
  if (body && !body.toLowerCase().includes('unsubscribe')) {
    result.requirements.push('add_unsubscribe_link');
  }

  return result;
}

// ============================================================================
// PROPOSAL COMPLIANCE CHECK
// ============================================================================

async function checkProposalCompliance(proposalData) {
  const result = {
    approved: true,
    reason: null,
    warnings: []
  };

  const { value, total_amount } = proposalData;
  const amount = value || total_amount || 0;

  // Check 1: High-value proposals require approval
  if (amount > HARD_LIMITS.MAX_PROPOSAL_VALUE) {
    result.approved = false;
    result.reason = `Proposal value $${amount} exceeds auto-approval limit ($${HARD_LIMITS.MAX_PROPOSAL_VALUE}). Requires human approval.`;
    return result;
  }

  // Check 2: Daily proposal limit
  const { count } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .gte('created_at', new Date().toISOString().split('T')[0]);

  if (count >= HARD_LIMITS.MAX_PROPOSALS_PER_DAY) {
    result.approved = false;
    result.reason = `Daily proposal limit reached: ${count}/${HARD_LIMITS.MAX_PROPOSALS_PER_DAY}`;
    return result;
  }

  return result;
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

async function logComplianceViolation(botName, actionType, violationType, reason) {
  try {
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: TENANT_ID,
        bot_name: botName,
        action_type: 'compliance_violation',
        action_description: reason,
        status: 'blocked',
        metadata: {
          attempted_action: actionType,
          violation_type: violationType,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('[Compliance Log] Failed to log violation:', error);
  }
}

async function logApprovedAction(botName, actionType, actionData) {
  try {
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: TENANT_ID,
        bot_name: botName,
        action_type: actionType,
        action_description: `Approved action: ${actionType}`,
        status: 'approved',
        metadata: actionData,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('[Compliance Log] Failed to log action:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  checkCompliance,
  checkEmailCompliance,
  checkProposalCompliance,
  logComplianceViolation,
  logApprovedAction,
  HARD_LIMITS,
  CAN_SPAM_REQUIREMENTS,
  PRIVACY_REQUIREMENTS
};
