/**
 * Dave's Automated Proposal Generation
 * Automatically creates and sends proposals to qualified leads
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
    console.log('[Dave Auto Proposal] Starting automated proposal generation...');

    // =====================================================================
    // STEP 1: Find qualified leads who need proposals
    // =====================================================================

    // Use Supabase .rpc() to execute complex SQL query (bypasses RLS)
    const leadsResult = await supabase.rpc('get_qualified_leads_for_proposal', {
      p_tenant_id: tenantId
    });

    // Fallback: if RPC doesn't exist, use basic query
    let leads = [];
    if (leadsResult.error && leadsResult.error.message.includes('does not exist')) {
      console.log('[Dave Auto Proposal] RPC not found, using basic query');

      // Get deals that need proposals
      const dealsResult = await supabase
        .from('deals')
        .select(`
          id,
          title,
          value,
          stage,
          contact_id,
          contacts (
            id,
            full_name,
            first_name,
            email,
            company,
            title,
            notes
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .in('stage', ['discovery_call_completed', 'strategy_call_completed'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (dealsResult.data) {
        leads = dealsResult.data.map(d => ({
          contact_id: d.contacts.id,
          full_name: d.contacts.full_name,
          first_name: d.contacts.first_name,
          email: d.contacts.email,
          company: d.contacts.company,
          title: d.contacts.title,
          notes: d.contacts.notes,
          deal_id: d.id,
          deal_title: d.title,
          deal_value: d.value,
          deal_stage: d.stage
        }));
      }
    } else if (leadsResult.data) {
      leads = leadsResult.data;
    }

    if (leads.length === 0) {
      console.log('[Dave Auto Proposal] No leads need proposals');
      return res.json({
        success: true,
        data: { message: 'No leads requiring proposals', proposals_sent: 0 }
      });
    }

    console.log(`[Dave Auto Proposal] Found ${leads.length} leads for proposals`);

    // =====================================================================
    // STEP 2: Generate proposals using AI
    // =====================================================================

    const proposalsSent = [];
    const errors = [];

    for (const lead of leads.slice(0, 5)) { // Limit to 5 per run
      try {
        // Determine service type and pricing based on call type and notes
        const callNotes = lead.strategy_notes || lead.discovery_notes || '';
        const serviceType = lead.deal_stage === 'strategy_call_completed' ? 'Strategy Consulting' : 'Discovery & Strategy Package';

        // Use Claude to generate customized proposal
        const proposalPrompt = `Generate a professional business consulting proposal for this client:

Client Information:
- Name: ${lead.full_name || lead.first_name}
- Company: ${lead.company || 'Not specified'}
- Title: ${lead.title || 'Professional'}
- Contact Notes: ${lead.notes || 'None'}
- Call Notes: ${callNotes}

Service Type: ${serviceType}
Estimated Value: $${lead.deal_value || 5000}

Create a compelling proposal that includes:
1. Executive Summary (2-3 sentences about their needs)
2. Scope of Work (specific deliverables)
3. Timeline (realistic project duration)
4. Investment (pricing and payment terms)
5. Next Steps (clear call-to-action)

Return JSON:
{
  "title": "Proposal title",
  "executive_summary": "Brief summary",
  "scope_of_work": "Detailed scope with bullet points",
  "timeline": "Project timeline",
  "investment": "Pricing details",
  "next_steps": "Clear next steps",
  "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"]
}

Make it professional, specific to their situation, and focused on value.`;

        const atlasResponse = await queryAtlas(
          proposalPrompt,
          'sales',
          tenantId,
          {
            sources: ['gemini'],
            save_to_memory: true,
            calledBy: 'dave_auto_proposal'
          }
        );

        if (!atlasResponse.success) {
          throw new Error(`Atlas query failed: ${atlasResponse.error}`);
        }

        const proposalContent = JSON.parse(atlasResponse.answer);

        // Create proposal in database using Supabase
        const proposalResult = await supabase
          .from('proposals')
          .insert({
            tenant_id: tenantId,
            contact_id: lead.contact_id,
            title: proposalContent.title,
            status: 'draft',
            executive_summary: proposalContent.executive_summary,
            scope_of_work: proposalContent.scope_of_work,
            timeline: proposalContent.timeline,
            investment: proposalContent.investment,
            next_steps: proposalContent.next_steps,
            deliverables: JSON.stringify(proposalContent.deliverables),
            total_amount: lead.deal_value || 5000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (proposalResult.error) {
          throw new Error(`Failed to create proposal: ${proposalResult.error.message}`);
        }

        const proposalId = proposalResult.data.id;

        // Generate proposal view link
        const proposalLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://growthmanagerpro.com'}/sign-proposal?id=${proposalId}`;

        // Send proposal via email
        const emailSubject = `Your Custom Proposal: ${proposalContent.title}`;
        const emailBody = `Hi ${lead.first_name || lead.full_name},

Thank you for your time on our recent call. I've prepared a customized proposal based on our conversation.

${proposalContent.executive_summary}

📄 View Your Proposal: ${proposalLink}

The proposal includes:
${proposalContent.deliverables.map(d => `• ${d}`).join('\n')}

Investment: ${proposalContent.investment}
Timeline: ${proposalContent.timeline}

Please review the proposal at your convenience. I'm happy to discuss any questions or modifications.

Looking forward to working together!

Best regards,
Maggie Forbes
Maggie Forbes Strategies

---
View and sign your proposal: ${proposalLink}`;

        await sendEmail({
          to: lead.email,
          subject: emailSubject,
          htmlBody: emailBody.replace(/\n/g, '<br>'),
          fromEmail: 'support@growthmanagerpro.com'
        });

        // Update proposal status to sent
        await supabase
          .from('proposals')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarding_status: 'pending' // Set onboarding status
          })
          .eq('id', proposalId);

        // Update deal stage and set onboarding status
        await supabase
          .from('deals')
          .update({
            stage: 'proposal_sent',
            onboarding_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.deal_id);

        // Log activity
        await supabase
          .from('contact_activities')
          .insert({
            tenant_id: tenantId,
            contact_id: lead.contact_id,
            activity_type: 'proposal_sent',
            description: `Automated proposal sent: ${proposalContent.title}`,
            metadata: {
              proposal_id: proposalId,
              proposal_title: proposalContent.title,
              proposal_value: lead.deal_value,
              generated_by: 'dave_automation'
            },
            created_at: new Date().toISOString()
          });

        // Log bot action
        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'dave',
            action_type: 'proposal_generation',
            action_description: `Generated and sent proposal to ${lead.full_name || lead.email}`,
            status: 'completed',
            related_entity_type: 'proposal',
            related_entity_id: proposalId,
            triggered_by: req.body?.triggered_by || 'automated',
            metadata: {
              contact_id: lead.contact_id,
              deal_id: lead.deal_id,
              proposal_value: lead.deal_value,
              ai_generated: true
            },
            created_at: new Date().toISOString()
          });

        proposalsSent.push({
          contact_id: lead.contact_id,
          contact_name: lead.full_name,
          email: lead.email,
          proposal_id: proposalId,
          proposal_title: proposalContent.title,
          proposal_value: lead.deal_value
        });

        console.log(`[Dave Auto Proposal] Sent proposal to ${lead.email}`);

        // Rate limit: wait 3 seconds between proposals
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`[Dave Auto Proposal] Failed for ${lead.email}:`, error);
        errors.push({
          contact_id: lead.contact_id,
          email: lead.email,
          error: error.message
        });
      }
    }

    console.log(`[Dave Auto Proposal] Sent ${proposalsSent.length} proposals, ${errors.length} errors`);

    return res.json({
      success: true,
      data: {
        proposals_sent: proposalsSent.length,
        proposals: proposalsSent,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('[Dave Auto Proposal] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
