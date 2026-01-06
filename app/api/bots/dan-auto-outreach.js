/**
 * Dan's Automated Email Outreach
 * Automatically reaches out to leads with personalized emails
 */

const axios = require('axios');
const { withCronAuth } = require('../lib/api-wrapper');
const { sendEmail } = require('../lib/email-sender');
const { renderEmail } = require('../lib/email-templates/renderer');
const outreachTemplate = require('../lib/email-templates/emails/outreach-invitation');
const { createClient } = require('@supabase/supabase-js');

// CRITICAL: Use Supabase service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  try {
    console.log('[Dan Auto Outreach] Starting automated email outreach...');

    // =====================================================================
    // STEP 0: Check Resend email budget (100/day, 3000/month)
    // =====================================================================

    const today = new Date().toISOString().split('T')[0];

    // Get today's email usage
    const dailyEmailResult = await supabase
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('type', 'outreach')
      .gte('sent_at', `${today}T00:00:00Z`);

    if (dailyEmailResult.error) {
      throw new Error(`Database query failed for daily emails: ${dailyEmailResult.error.message}`);
    }

    const todayEmailsSent = dailyEmailResult.count || 0;
    const dailyEmailLimit = 100; // Resend free tier: 100 emails/day
    const remainingDailyEmails = dailyEmailLimit - todayEmailsSent;

    // Also check monthly limit
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyEmailResult = await supabase
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('type', 'outreach')
      .gte('sent_at', monthStart.toISOString());

    if (monthlyEmailResult.error) {
      throw new Error(`Database query failed for monthly emails: ${monthlyEmailResult.error.message}`);
    }

    const monthEmailsSent = monthlyEmailResult.count || 0;
    const monthlyEmailLimit = 3000; // Resend free tier: 3000 emails/month
    const remainingMonthlyEmails = monthlyEmailLimit - monthEmailsSent;

    // Check if daily budget reached
    if (todayEmailsSent >= dailyEmailLimit) {
      console.log(`[Dan Auto Outreach] Daily email budget reached (${todayEmailsSent}/${dailyEmailLimit})`);
      return res.json({
        success: true,
        data: {
          emails_sent: 0,
          budget_reached: true,
          message: `Daily Resend budget of ${dailyEmailLimit} emails reached. Resets at midnight.`,
          usage: {
            daily: { sent: todayEmailsSent, limit: dailyEmailLimit },
            monthly: { sent: monthEmailsSent, limit: monthlyEmailLimit }
          }
        }
      });
    }

    // Check if monthly budget reached
    if (monthEmailsSent >= monthlyEmailLimit) {
      console.log(`[Dan Auto Outreach] Monthly email budget reached (${monthEmailsSent}/${monthlyEmailLimit})`);
      return res.json({
        success: true,
        data: {
          emails_sent: 0,
          budget_reached: true,
          message: `Monthly Resend budget of ${monthlyEmailLimit} emails reached. Resets on 1st of next month.`,
          usage: {
            daily: { sent: todayEmailsSent, limit: dailyEmailLimit },
            monthly: { sent: monthEmailsSent, limit: monthlyEmailLimit }
          }
        }
      });
    }

    console.log(`[Dan Auto Outreach] Email budget remaining: ${remainingDailyEmails}/day, ${remainingMonthlyEmails}/month`);

    // =====================================================================
    // STEP 1: Find leads that need outreach from the queue
    // =====================================================================

    // Simplified query for Supabase client compatibility
    // ONLY get NEW Hunter.io leads (not old imported leads)
    // Filter to leads created in the last 30 days (all new Hunter discoveries)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const queueResult = await supabase
      .from('dan_outreach_queue')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .not('contact_email', 'is', null)
      .neq('contact_email', '')
      .gte('created_at', thirtyDaysAgo.toISOString()) // ONLY NEW LEADS
      .or('scheduled_for.is.null,scheduled_for.lte.now()')
      .order('created_at', { ascending: true })
      .limit(20);

    let leads = queueResult.data || [];

    // Enrich with marketing_leads data if lead_id exists
    if (leads.length > 0) {
      const leadIds = leads.map(l => l.lead_id).filter(Boolean);
      if (leadIds.length > 0) {
        const mlResult = await supabase
          .from('marketing_leads')
          .select('id, score, score_reasons, industry, revenue_estimate, team_size')
          .in('id', leadIds);

        const mlMap = {};
        (mlResult.data || []).forEach(ml => { mlMap[ml.id] = ml; });

        leads = leads.map(lead => {
          const mlData = mlMap[lead.lead_id] || {};
          // IMPORTANT: Preserve queue item ID, don't overwrite with marketing_lead ID
          const { id: _mlId, ...mlDataWithoutId } = mlData;
          return {
            ...lead,
            ...mlDataWithoutId
          };
        });
      }
    }

    // Sort by priority (high=1, medium=2, low=3)
    leads.sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    if (leads.length === 0) {
      console.log('[Dan Auto Outreach] No leads in queue need outreach');
      return res.json({
        success: true,
        data: { message: 'No leads requiring outreach', emails_sent: 0 }
      });
    }

    console.log(`[Dan Auto Outreach] Found ${leads.length} leads in queue for outreach`);

    // =====================================================================
    // STEP 2: Generate personalized emails using AI
    // =====================================================================

    const emailsSent = [];
    const errors = [];

    // Limit emails per run based on remaining daily budget
    const maxEmailsThisRun = Math.min(10, remainingDailyEmails, remainingMonthlyEmails);

    console.log(`[Dan Auto Outreach] Will send up to ${maxEmailsThisRun} emails this run`);

    for (const lead of leads.slice(0, maxEmailsThisRun)) {
      try {
        // Use standardized template for outreach (no AI cost per email)
        const calendlyLink = process.env.CALENDLY_DISCOVERY_LINK || 'https://calendly.com/maggieforbes/discovery';
        const signupLink = `https://growthmanagerpro.com/signup?ref=maggie&lead_id=${lead.lead_id || lead.id}`;

        // Prepare template data
        const templateData = {
          contactName: lead.contact_name,
          companyName: lead.company_name,
          industry: lead.industry,
          signupLink: signupLink,
          calendlyLink: calendlyLink
        };

        // Generate subject and HTML from template
        const subject = outreachTemplate.subject(templateData);
        const htmlBody = renderEmail(
          outreachTemplate.template(templateData),
          outreachTemplate.preheader(templateData)
        );

        // Send email via Resend
        const emailResult = await sendEmail({
          to: lead.contact_email,
          subject: subject,
          htmlBody: htmlBody,
          fromEmail: 'support@growthmanagerpro.com'
        });

        // Check if email was actually sent
        if (!emailResult) {
          console.error(`[Dan Auto Outreach] Email failed to send to ${lead.contact_email}`);
          throw new Error(`Email failed to send to ${lead.contact_email}`);
        }

        // Log email in database
        await supabase
          .from('emails')
          .insert({
            tenant_id: tenantId,
            type: 'outreach',
            subject: subject,
            body: htmlBody,
            sent_at: new Date().toISOString(),
            status: 'sent',
            from_email: 'support@growthmanagerpro.com',
            to_email: lead.contact_email,
            metadata: {
              generated_by: 'dan',
              template: 'outreach-invitation',
              calendly_link: calendlyLink,
              signup_link: signupLink,
              lead_id: lead.lead_id,
              queue_id: lead.id,
              company_name: lead.company_name,
              contact_name: lead.contact_name,
              industry: lead.industry,
              score: lead.score,
              priority: lead.priority,
              ai_generated: false
            }
          });

        // Update queue status to 'sent'
        await supabase
          .from('dan_outreach_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        // Update marketing_leads contacted_at timestamp
        if (lead.lead_id) {
          await supabase
            .from('marketing_leads')
            .update({
              contacted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.lead_id);
        }

        // Log bot action
        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'dan',
            action_type: 'email_outreach',
            action_description: `Sent personalized outreach email to ${lead.contact_name || lead.contact_email} at ${lead.company_name}`,
            status: 'completed',
            related_entity_type: 'marketing_lead',
            related_entity_id: lead.lead_id,
            triggered_by: req.query?.triggered_by || req.body?.triggered_by || 'automated',
            created_at: new Date().toISOString()
          });

        emailsSent.push({
          queue_id: lead.id,
          lead_id: lead.lead_id,
          company_name: lead.company_name,
          contact_name: lead.contact_name,
          email: lead.contact_email,
          subject: subject,
          priority: lead.priority,
          score: lead.score
        });

        console.log(`[Dan Auto Outreach] Sent email to ${lead.contact_email} (${lead.company_name})`);

        // Rate limit: wait 2 seconds between emails
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Dan Auto Outreach] Failed for ${lead.contact_email}:`, error);

        // Mark queue item as failed
        await supabase
          .from('dan_outreach_queue')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id)
          .then(result => {
            if (result.error) console.error('[Dan Auto Outreach] Failed to update queue:', result.error);
          });

        errors.push({
          queue_id: lead.id,
          lead_id: lead.lead_id,
          company_name: lead.company_name,
          email: lead.contact_email,
          error: error.message
        });
      }
    }

    console.log(`[Dan Auto Outreach] Sent ${emailsSent.length} emails, ${errors.length} errors`);

    return res.json({
      success: true,
      data: {
        emails_sent: emailsSent.length,
        emails: emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('[Dan Auto Outreach] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
