/**
 * Email Sender Utility
 * Sends transactional emails via Resend API using template system
 */

const { createClient } = require('@supabase/supabase-js');
const { renderEmailTemplate } = require('./email-templates/renderer');
const emailTemplates = require('./email-templates/emails');
const { canReceiveEmail, getUnsubscribeUrl } = require('./email-preferences');

// Use Supabase for Vercel compatibility
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const SENDER_EMAIL = 'support@growthmanagerpro.com';

// Get Resend API key at runtime
function getResendApiKey() {
  return process.env.GMP_RESEND_API_KEY;
}

/**
 * Send a single transactional email via Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} fromEmail - Optional sender email (defaults to support@)
 * @returns {Promise<boolean>} Success status
 */
async function sendEmail({ to, subject, htmlBody, fromEmail = SENDER_EMAIL }) {
  try {
    const apiKey = getResendApiKey();

    if (!apiKey) {
      console.error('[Email Sender] No API key found. GMP_RESEND_API_KEY:', !!process.env.GMP_RESEND_API_KEY, 'RESEND_API_KEY:', !!process.env.RESEND_API_KEY);
      return false;
    }

    console.log(`[Email Sender] Sending email to ${to} with subject: ${subject.substring(0, 50)}...`);
    console.log(`[Email Sender] Using API key: ${apiKey.substring(0, 10)}...`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: htmlBody
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Email Sender] Resend API error:', response.status, errorData);
      return false;
    }

    const result = await response.json();
    console.log(`[Email Sender] Email sent successfully. ID: ${result.id}`);
    return true;

  } catch (error) {
    console.error('[Email Sender] Error:', error);
    return false;
  }
}

/**
 * Get user ID from email address
 */
async function getUserIdFromEmail(email) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error) {
      console.error('[Email Sender] Error getting user ID:', error);
      return null;
    }

    return data ? data.id : null;
  } catch (error) {
    console.error('[Email Sender] Error getting user ID:', error);
    return null;
  }
}

/**
 * Helper function to render and send email using template
 * @param {string} to - Recipient email
 * @param {object} templateConfig - Email template configuration
 * @param {object} data - Template data
 * @param {string} category - Email category for preference checking (optional)
 * @param {boolean} bypassPreferences - Skip preference check (for critical emails)
 */
async function sendTemplatedEmail(to, templateConfig, data, category = null, bypassPreferences = false) {
  try {
    // Check email preferences unless bypassed
    if (!bypassPreferences && category) {
      const userId = await getUserIdFromEmail(to);

      if (userId) {
        const canSend = await canReceiveEmail(userId, category);

        if (!canSend) {
                    return false;
        }

        // Add unsubscribe URL to data
        try {
          const unsubscribeUrl = await getUnsubscribeUrl(userId, category);
          data.unsubscribe_url = unsubscribeUrl;
        } catch (error) {
          console.error('[Email Sender] Error getting unsubscribe URL:', error);
          // Continue without unsubscribe URL rather than failing
        }
      }
    }

    const subject = typeof templateConfig.subject === 'function'
      ? templateConfig.subject(data)
      : templateConfig.subject;

    const preheader = typeof templateConfig.preheader === 'function'
      ? templateConfig.preheader(data)
      : templateConfig.preheader || '';

    const content = templateConfig.template(data);
    const htmlBody = renderEmailTemplate(content, data, preheader);

    return await sendEmail({ to, subject, htmlBody });

  } catch (error) {
    console.error('[Email Sender] Error in sendTemplatedEmail:', error);
    return false;
  }
}

// =============================================================================
// AUTHENTICATION & ACCOUNT MANAGEMENT
// =============================================================================

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetUrl) {
  return await sendTemplatedEmail(email, emailTemplates.passwordReset, { resetUrl });
}

/**
 * Send password changed confirmation email
 */
async function sendPasswordChangedEmail({ email, name, changedAt, ipAddress, device }) {
  return await sendTemplatedEmail(email, emailTemplates.passwordChanged, {
    name, email, changedAt, ipAddress, device
  }, null, true); // Critical security email - bypass preferences
}

// =============================================================================
// SUBSCRIPTION & BILLING
// =============================================================================

/**
 * Send trial started email
 */
async function sendTrialStartedEmail({ email, name, tier, trialDays }) {
  return await sendTemplatedEmail(email, emailTemplates.trialStarted, { name, tier, trialDays }, 'product_updates');
}

/**
 * Send trial ending warning email
 */
async function sendTrialEndingEmail({ email, name, tier, daysRemaining, tierPrice }) {
  return await sendTemplatedEmail(email, emailTemplates.trialEnding, { name, tier, daysRemaining, tierPrice }, 'billing', true); // Critical - bypass preferences
}

/**
 * Send payment success confirmation
 */
async function sendPaymentSuccessEmail({ email, name, tier, amount, nextBillingDate }) {
  return await sendTemplatedEmail(email, emailTemplates.paymentSuccess, { name, tier, amount, nextBillingDate }, 'billing', true); // Critical - bypass preferences
}

/**
 * Send payment failed notification
 */
async function sendPaymentFailedEmail({ email, name, tier, amount }) {
  return await sendTemplatedEmail(email, emailTemplates.paymentFailed, { name, tier, amount }, 'billing', true); // Critical - bypass preferences
}

/**
 * Send subscription canceled confirmation
 */
async function sendSubscriptionCanceledEmail({ email, name, tier, accessUntil }) {
  return await sendTemplatedEmail(email, emailTemplates.subscriptionCanceled, { name, tier, accessUntil }, 'billing', true); // Critical - bypass preferences
}

/**
 * Send trial converted to paid email
 */
async function sendTrialConvertedEmail({ email, name, tier, amount, nextBillingDate, trialDays }) {
  return await sendTemplatedEmail(email, emailTemplates.trialConverted, {
    name, tier, amount, nextBillingDate, trialDays
  }, 'billing', true); // Critical - bypass preferences
}

/**
 * Send tier upgrade/downgrade email
 */
async function sendTierChangedEmail({ email, name, oldTier, newTier, amount, changeType, effectiveDate, prorationCredit }) {
  return await sendTemplatedEmail(email, emailTemplates.tierChanged, {
    name, oldTier, newTier, amount, changeType, effectiveDate, prorationCredit
  }, 'billing', true); // Critical - bypass preferences
}

// =============================================================================
// USER ONBOARDING & TEAM MANAGEMENT
// =============================================================================

/**
 * Send new user welcome email
 */
async function sendNewUserWelcomeEmail({ email, name, role, tier = 'FREE' }) {
  return await sendTemplatedEmail(email, emailTemplates.newUserWelcome, { name, role, tier }, 'onboarding');
}

/**
 * Send team member invitation email
 */
async function sendTeamInvitationEmail({ email, role, inviterName, businessName, inviteLink, expiresAt }) {
  return await sendTemplatedEmail(email, emailTemplates.teamInvitation, {
    role, inviterName, businessName, inviteLink, expiresAt
  }, 'team', true); // Critical - bypass preferences
}

// =============================================================================
// PROPOSALS & CLIENT MANAGEMENT
// =============================================================================

/**
 * Send proposal welcome email
 */
async function sendProposalWelcomeEmail(email, name, proposalTitle) {
  return await sendTemplatedEmail(email, emailTemplates.proposalWelcome, { name, proposalTitle });
}

/**
 * Send Zoom meeting invitation
 */
async function sendZoomMeetingInvite({ contactEmail, contactName, meetingType, scheduledTime, zoomUrl, duration = 30 }) {
  return await sendTemplatedEmail(contactEmail, emailTemplates.zoomMeetingInvite, {
    contactName, meetingType, scheduledTime, zoomUrl, duration
  });
}

/**
 * Send client portal invitation
 */
async function sendClientInvitationEmail({ clientEmail, advisorName, advisorEmail }) {
  return await sendTemplatedEmail(clientEmail, emailTemplates.clientInvitation, { advisorName, advisorEmail });
}

/**
 * Send advisor notification about new client
 */
async function sendAdvisorNotificationEmail({ advisorEmail, clientName, clientEmail }) {
  return await sendTemplatedEmail(advisorEmail, emailTemplates.advisorNotification, { clientName, clientEmail });
}

/**
 * Send client portal credentials email
 */
async function sendClientPortalCredentialsEmail({ email, clientName, advisorName, loginUrl, temporaryPassword }) {
  return await sendTemplatedEmail(email, emailTemplates.clientPortalCredentials, {
    clientName, advisorName, loginUrl, temporaryPassword, email
  }, 'team', true); // Critical - bypass preferences
}

/**
 * Send proposal viewed notification
 */
async function sendProposalViewedEmail({ email, userName, proposalTitle, contactName, contactEmail, viewedAt, viewCount, timeOnPage, dashboardUrl }) {
  return await sendTemplatedEmail(email, emailTemplates.proposalViewed, {
    userName, proposalTitle, contactName, contactEmail, viewedAt, viewCount, timeOnPage, dashboardUrl
  }, 'pipeline');
}

// =============================================================================
// AI & PIPELINE AUTOMATION
// =============================================================================

/**
 * Send high-scoring call notification
 */
async function sendHighScoringCallNotification({ email, userName, callType, contactName, score, keyInsights, nextAction, dashboardUrl }) {
  return await sendTemplatedEmail(email, emailTemplates.highScoringCall, {
    userName, callType, contactName, score, keyInsights, nextAction, dashboardUrl
  }, 'pipeline');
}

/**
 * Send qualified lead reminder
 */
async function sendQualifiedLeadReminder({ email, userName, contactName, contactEmail, callType, daysSinceCall, dashboardUrl }) {
  return await sendTemplatedEmail(email, emailTemplates.qualifiedLeadReminder, {
    userName, contactName, contactEmail, callType, daysSinceCall, dashboardUrl
  }, 'pipeline');
}

/**
 * Send meeting completed (AI analysis ready) email
 */
async function sendMeetingCompletedEmail({ email, userName, contactName, meetingType, completedAt, aiScore, keyInsights, nextSteps, dashboardUrl }) {
  return await sendTemplatedEmail(email, emailTemplates.meetingCompleted, {
    userName, contactName, meetingType, completedAt, aiScore, keyInsights, nextSteps, dashboardUrl
  }, 'pipeline');
}

// =============================================================================
// MEETING REMINDERS
// =============================================================================

/**
 * Send 24-hour meeting reminder
 */
async function send24HourMeetingReminder({ email, contactName, meetingType, meetingDate, meetingTime, zoomLink, rescheduleLink }) {
  return await sendTemplatedEmail(email, emailTemplates.meetingReminder24hr, {
    contactName, meetingType, meetingDate, meetingTime, zoomLink, rescheduleLink
  }, 'meeting_reminders');
}

/**
 * Send 1-hour meeting reminder
 */
async function send1HourMeetingReminder({ email, contactName, meetingType, meetingTime, zoomLink }) {
  return await sendTemplatedEmail(email, emailTemplates.meetingReminder1hr, {
    contactName, meetingType, meetingTime, zoomLink
  }, 'meeting_reminders');
}

// =============================================================================
// FUNNEL STAGE INVITATIONS
// =============================================================================

/**
 * Send podcast interview invitation
 */
async function sendPodcastInvitationEmail({ email, contactName, hostName, podcastName, topicArea, schedulingLink, whyThem }) {
  return await sendTemplatedEmail(email, emailTemplates.podcastInvitation, {
    contactName, hostName, podcastName, topicArea, schedulingLink, whyThem
  }, 'pipeline');
}

/**
 * Send discovery call invitation (after podcast)
 */
async function sendDiscoveryInvitationEmail({ email, contactName, hostName, podcastDate, keyInsights, schedulingLink, personalNote }) {
  return await sendTemplatedEmail(email, emailTemplates.discoveryInvitation, {
    contactName, hostName, podcastDate, keyInsights, schedulingLink, personalNote
  }, 'pipeline');
}

/**
 * Send strategy call invitation (after discovery)
 */
async function sendStrategyInvitationEmail({ email, contactName, hostName, discoveryDate, painPoints, proposedSolutions, schedulingLink, customMessage }) {
  return await sendTemplatedEmail(email, emailTemplates.strategyInvitation, {
    contactName, hostName, discoveryDate, painPoints, proposedSolutions, schedulingLink, customMessage
  }, 'pipeline');
}

// =============================================================================
// MEETING MANAGEMENT EMAILS
// =============================================================================

/**
 * Send meeting canceled notification
 */
async function sendMeetingCanceledEmail({ email, contactName, meetingType, meetingDate, meetingTime, canceledBy, reason, rescheduleLink }) {
  return await sendTemplatedEmail(email, emailTemplates.meetingCanceled, {
    contactName, meetingType, meetingDate, meetingTime, canceledBy, reason, rescheduleLink
  }, 'meeting_reminders');
}

/**
 * Send meeting rescheduled notification
 */
async function sendMeetingRescheduledEmail({ email, contactName, meetingType, oldDate, oldTime, newDate, newTime, zoomLink, rescheduledBy, rescheduleLink }) {
  return await sendTemplatedEmail(email, emailTemplates.meetingRescheduled, {
    contactName, meetingType, oldDate, oldTime, newDate, newTime, zoomLink, rescheduledBy, rescheduleLink
  }, 'meeting_reminders');
}

/**
 * Send no-show follow-up email
 */
async function sendNoShowFollowUpEmail({ email, contactName, meetingType, missedDate, missedTime, rescheduleLink, supportEmail }) {
  return await sendTemplatedEmail(email, emailTemplates.noShowFollowUp, {
    contactName, meetingType, missedDate, missedTime, rescheduleLink, supportEmail
  }, 'pipeline');
}

// =============================================================================
// SUPPORT TICKET EMAILS
// =============================================================================

/**
 * Send support ticket submitted confirmation
 */
async function sendSupportTicketSubmittedEmail({ email, userName, ticketNumber, subject, description, priority, category, ticketUrl }) {
  return await sendTemplatedEmail(email, emailTemplates.supportTicketSubmitted, {
    userName, ticketNumber, subject, description, priority, category, ticketUrl
  }, null, true); // Bypass preferences - always send critical support emails
}

/**
 * Send support ticket updated notification
 */
async function sendSupportTicketUpdatedEmail({ email, userName, ticketNumber, subject, updateMessage, updatedBy, status, ticketUrl }) {
  return await sendTemplatedEmail(email, emailTemplates.supportTicketUpdated, {
    userName, ticketNumber, subject, updateMessage, updatedBy, status, ticketUrl
  }, null, true); // Bypass preferences - always send critical support emails
}

/**
 * Send support ticket resolved notification
 */
async function sendSupportTicketResolvedEmail({ email, userName, ticketNumber, subject, resolutionMessage, resolvedBy, resolutionTime, ticketUrl, feedbackUrl }) {
  return await sendTemplatedEmail(email, emailTemplates.supportTicketResolved, {
    userName, ticketNumber, subject, resolutionMessage, resolvedBy, resolutionTime, ticketUrl, feedbackUrl
  }, null, true); // Bypass preferences - always send critical support emails
}

// =============================================================================
// ENGAGEMENT & ANALYTICS EMAILS
// =============================================================================

/**
 * Send weekly digest summary
 */
async function sendWeeklyDigestEmail({ email, userName, weekStartDate, weekEndDate, stats, topQualifiedLeads, upcomingMeetings, completedDeals, dashboardLink }) {
  return await sendTemplatedEmail(email, emailTemplates.weeklyDigest, {
    userName, weekStartDate, weekEndDate, stats, topQualifiedLeads, upcomingMeetings, completedDeals, dashboardLink
  }, 'product_updates'); // Respects preferences
}

// =============================================================================
// ONBOARDING SEQUENCE EXPORTS
// (These are in a separate file: lib/onboarding-emails.js)
// =============================================================================

// Import onboarding email functions from separate file
const {
  sendOnboardingDay1,
  sendOnboardingDay2,
  sendOnboardingDay4,
  sendOnboardingDay6,
  sendOnboardingDay8,
  sendOnboardingDay10,
  sendOnboardingDay12,
  sendOnboardingDay14,
  sendOnboardingDay15,
  sendOnboardingDay17,
  sendOnboardingDay20,
  sendOnboardingDay23,
  sendOnboardingDay25,
  sendOnboardingDay28,
  sendOnboardingDay30
} = require('./onboarding-emails');

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core email utility
  sendEmail,

  // Authentication & Account
  sendPasswordResetEmail,
  sendPasswordChangedEmail,

  // Subscription & Billing
  sendTrialStartedEmail,
  sendTrialEndingEmail,
  sendTrialConvertedEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
  sendTierChangedEmail,

  // User Onboarding & Team
  sendNewUserWelcomeEmail,
  sendTeamInvitationEmail,

  // Proposals & Client Management
  sendProposalWelcomeEmail,
  sendProposalViewedEmail,
  sendZoomMeetingInvite,
  sendClientInvitationEmail,
  sendClientPortalCredentialsEmail,
  sendAdvisorNotificationEmail,

  // AI & Pipeline Automation
  sendHighScoringCallNotification,
  sendQualifiedLeadReminder,
  sendMeetingCompletedEmail,

  // Meeting Reminders
  send24HourMeetingReminder,
  send1HourMeetingReminder,

  // Funnel Stage Invitations
  sendPodcastInvitationEmail,
  sendDiscoveryInvitationEmail,
  sendStrategyInvitationEmail,

  // Meeting Management
  sendMeetingCanceledEmail,
  sendMeetingRescheduledEmail,
  sendNoShowFollowUpEmail,

  // Support Tickets
  sendSupportTicketSubmittedEmail,
  sendSupportTicketUpdatedEmail,
  sendSupportTicketResolvedEmail,

  // Engagement & Analytics
  sendWeeklyDigestEmail,

  // Onboarding Sequence (from separate file)
  sendOnboardingDay1,
  sendOnboardingDay2,
  sendOnboardingDay4,
  sendOnboardingDay6,
  sendOnboardingDay8,
  sendOnboardingDay10,
  sendOnboardingDay12,
  sendOnboardingDay14,
  sendOnboardingDay15,
  sendOnboardingDay17,
  sendOnboardingDay20,
  sendOnboardingDay23,
  sendOnboardingDay25,
  sendOnboardingDay28,
  sendOnboardingDay30
};
