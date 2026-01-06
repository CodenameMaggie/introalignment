/**
 * Annie's Auto-Support
 * AI handles support tickets and sends health checks to inactive clients
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { sendEmail } = require('../lib/email-sender');
const { queryAtlas } = require('./atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

// Use Supabase service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  try {
    console.log('[Annie Support] Starting auto-support processing...');

    const ticketsProcessed = [];
    const healthChecks = [];
    const errors = [];

    // =====================================================================
    // PART 1: Process Open Support Tickets with AI
    // =====================================================================

    console.log('[Annie Support] Processing open support tickets...');

    const ticketsResult = await supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        description,
        priority,
        status,
        user_id,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .eq('ai_processed', false)
      .order('created_at', { ascending: true })
      .limit(10);

    const tickets = ticketsResult.data || [];

    console.log(`[Annie Support] Found ${tickets.length} open tickets to process`);

    for (const ticket of tickets) {
      try {
        const user = ticket.users;

        console.log(`[Annie Support] Processing ticket ${ticket.id}: ${ticket.subject}`);

        // Use AI to analyze and respond to ticket
        const supportPrompt = `Analyze this support ticket and provide a helpful response:

Ticket Subject: ${ticket.subject}
Ticket Description: ${ticket.description}
Priority: ${ticket.priority}

Based on this ticket:
1. Can it be resolved automatically? (yes/no)
2. What's the solution or response?
3. Should it be escalated to Maggie? (yes/no)
4. If escalated, why?

Respond with JSON:
{
  "can_resolve": true/false,
  "confidence": 85.5,
  "response": "Helpful response to user",
  "escalate": true/false,
  "escalation_reason": "Why this needs human attention"
}`;

        const atlasResponse = await queryAtlas(
          supportPrompt,
          'assistant',
          tenantId,
          {
            sources: ['claude'],
            save_to_memory: false,
            calledBy: 'annie_auto_support'
          }
        );

        if (!atlasResponse.success) {
          throw new Error(`AI support failed: ${atlasResponse.error}`);
        }

        // Parse AI response
        let aiAnalysis;
        try {
          let jsonText = atlasResponse.answer;
          const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
          const objMatch = jsonText.match(/\{[\s\S]*\}/);
          if (objMatch) {
            jsonText = objMatch[0];
          }
          aiAnalysis = JSON.parse(jsonText.trim());
        } catch (e) {
          console.error('[Annie Support] Failed to parse AI response:', e);
          aiAnalysis = {
            can_resolve: false,
            confidence: 50,
            response: atlasResponse.answer,
            escalate: true,
            escalation_reason: 'Could not parse AI analysis'
          };
        }

        console.log(`[Annie Support] AI analysis: can_resolve=${aiAnalysis.can_resolve}, escalate=${aiAnalysis.escalate}, confidence=${aiAnalysis.confidence}`);

        // Update ticket with AI processing
        await supabase
          .from('support_tickets')
          .update({
            ai_processed: true,
            ai_processed_at: new Date().toISOString(),
            ai_response: aiAnalysis.response,
            ai_confidence: aiAnalysis.confidence,
            escalated: aiAnalysis.escalate,
            escalated_at: aiAnalysis.escalate ? new Date().toISOString() : null,
            escalation_reason: aiAnalysis.escalation_reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id);

        // If can resolve automatically and confidence is high
        if (aiAnalysis.can_resolve && aiAnalysis.confidence >= 75 && !aiAnalysis.escalate) {
          // Send resolution email
          const subject = `Re: ${ticket.subject}`;
          const htmlBody = `
            <p>Hi ${user.full_name},</p>

            <p>Thanks for reaching out! I've reviewed your ticket and here's how I can help:</p>

            ${aiAnalysis.response.split('\n').map(p => `<p>${p}</p>`).join('\n')}

            <p>This should resolve your issue. If you need further assistance, please reply to this email or create a new support ticket.</p>

            <p>Best,<br/>
            Annie (Your AI Assistant)<br/>
            Growth Manager Pro</p>
          `;

          await sendEmail({
            to: user.email,
            subject: subject,
            htmlBody: htmlBody,
            fromEmail: 'support@growthmanagerpro.com'
          });

          // Mark ticket as resolved
          await supabase
            .from('support_tickets')
            .update({
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);

          console.log(`[Annie Support] Auto-resolved ticket ${ticket.id}`);

          ticketsProcessed.push({
            ticket_id: ticket.id,
            user_email: user.email,
            subject: ticket.subject,
            action: 'auto_resolved',
            confidence: aiAnalysis.confidence
          });
        } else {
          // Escalate to Maggie
          console.log(`[Annie Support] Escalated ticket ${ticket.id} - ${aiAnalysis.escalation_reason}`);

          ticketsProcessed.push({
            ticket_id: ticket.id,
            user_email: user.email,
            subject: ticket.subject,
            action: 'escalated',
            reason: aiAnalysis.escalation_reason
          });
        }

        // Log bot action
        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'annie',
            action_type: 'ticket_processed',
            action_description: `Processed support ticket: ${ticket.subject}`,
            status: 'completed',
            related_entity_type: 'support_ticket',
            related_entity_id: ticket.id,
            triggered_by: req.query?.triggered_by || req.body?.triggered_by || 'automated',
            metadata: {
              can_resolve: aiAnalysis.can_resolve,
              confidence: aiAnalysis.confidence,
              escalated: aiAnalysis.escalate
            },
            created_at: new Date().toISOString()
          });

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Annie Support] Error processing ticket ${ticket.id}:`, error);
        errors.push({
          ticket_id: ticket.id,
          error: error.message
        });
      }
    }

    // =====================================================================
    // PART 2: Client Health Checks (Inactive Clients)
    // =====================================================================

    console.log('[Annie Support] Running client health checks...');

    // Find clients who haven't logged in recently
    const inactiveClientsResult = await supabase
      .from('users')
      .select('id, full_name, email, last_login_at, created_at')
      .eq('tenant_id', tenantId)
      .eq('role', 'client')
      .lt('last_login_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // Not logged in for 14+ days
      .limit(5);

    const inactiveClients = inactiveClientsResult.data || [];

    console.log(`[Annie Support] Found ${inactiveClients.length} inactive clients`);

    for (const client of inactiveClients) {
      try {
        const daysSinceLogin = Math.floor((Date.now() - new Date(client.last_login_at).getTime()) / (24 * 60 * 60 * 1000));

        console.log(`[Annie Support] Client ${client.email} - ${daysSinceLogin} days since login`);

        // Get active deals and open tickets count
        const dealsResult = await supabase
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('user_id', client.id)
          .neq('stage', 'closed_won')
          .neq('stage', 'closed_lost');

        const ticketsResult = await supabase
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('user_id', client.id)
          .eq('status', 'open');

        const activeDeals = dealsResult.count || 0;
        const openTickets = ticketsResult.count || 0;

        // Calculate health score (0-100)
        let healthScore = 100;
        if (daysSinceLogin > 30) healthScore -= 40;
        else if (daysSinceLogin > 14) healthScore -= 20;
        if (activeDeals === 0) healthScore -= 20;
        if (openTickets > 0) healthScore -= 10;

        let healthStatus = 'healthy';
        if (healthScore < 40) healthStatus = 'churned';
        else if (healthScore < 60) healthStatus = 'at_risk';
        else if (healthScore < 80) healthStatus = 'inactive';

        console.log(`[Annie Support] Client health: score=${healthScore}, status=${healthStatus}`);

        // Store health check
        await supabase
          .from('client_health_checks')
          .insert({
            tenant_id: tenantId,
            client_id: client.id,
            last_login_days_ago: daysSinceLogin,
            active_deals: activeDeals,
            open_tickets: openTickets,
            health_score: healthScore,
            health_status: healthStatus,
            ai_analysis: `Client inactive for ${daysSinceLogin} days`,
            checked_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        // Send check-in email if at risk or churned
        if (healthStatus === 'at_risk' || healthStatus === 'churned') {
          const subject = `We miss you! Let's reconnect`;
          const htmlBody = `
            <p>Hi ${client.full_name},</p>

            <p>It's been a while since we last connected! I wanted to check in and see how things are going.</p>

            <p>Is there anything I can help you with? Whether it's:</p>
            <ul>
              <li>Getting started with a new project</li>
              <li>Questions about using Growth Manager Pro</li>
              <li>Scheduling a check-in call</li>
            </ul>

            <p>I'm here to help! Just reply to this email or log in to your account.</p>

            <p>Looking forward to hearing from you!</p>

            <p>Best,<br/>
            Annie (Your AI Assistant)<br/>
            Growth Manager Pro</p>
          `;

          await sendEmail({
            to: client.email,
            subject: subject,
            htmlBody: htmlBody,
            fromEmail: 'support@growthmanagerpro.com'
          });

          await supabase
            .from('client_health_checks')
            .update({
              outreach_sent: true,
              outreach_sent_at: new Date().toISOString(),
              outreach_type: healthStatus === 'churned' ? 'churn_prevention' : 'reactivation'
            })
            .eq('client_id', client.id)
            .eq('checked_at', new Date().toISOString());

          console.log(`[Annie Support] Sent ${healthStatus} outreach to ${client.email}`);

          healthChecks.push({
            client_id: client.id,
            email: client.email,
            health_status: healthStatus,
            health_score: healthScore,
            days_inactive: daysSinceLogin,
            outreach_sent: true
          });
        } else {
          healthChecks.push({
            client_id: client.id,
            email: client.email,
            health_status: healthStatus,
            health_score: healthScore,
            days_inactive: daysSinceLogin,
            outreach_sent: false
          });
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Annie Support] Error checking client ${client.id}:`, error);
        errors.push({
          client_id: client.id,
          error: error.message
        });
      }
    }

    // =====================================================================
    // SUCCESS
    // =====================================================================

    console.log(`[Annie Support] Processed ${ticketsProcessed.length} tickets, ${healthChecks.length} health checks, ${errors.length} errors`);

    return res.json({
      success: true,
      data: {
        tickets_processed: ticketsProcessed.length,
        tickets: ticketsProcessed,
        health_checks_completed: healthChecks.length,
        health_checks: healthChecks,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('[Annie Support] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
