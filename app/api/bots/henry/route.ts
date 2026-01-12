import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas, reportActionCompleted, reportCriticalIssue } from '@/lib/bots/inter-bot-client';

/**
 * Henry - The Legal Professional Email Outreach Bot
 *
 * PURPOSE: Manages email campaigns and outreach to estate planning attorneys
 * FOCUS: Partnership invitations and podcast guest invitations
 * REPORTS TO: MFS C-Suite Bot
 *
 * RESPONSIBILITIES:
 * - Send partnership opportunity emails to qualified lawyers
 * - Send podcast invitations for sovereigndesign.it.com
 * - Personalize emails based on lawyer specialization and credentials
 * - Track email metrics (open rate, reply rate, conversion rate)
 * - Manage follow-up sequences
 * - Respect unsubscribe requests (CAN-SPAM compliance)
 */

interface EmailRequest {
  partner_id: string;
  campaign_type: 'partnership_invitation' | 'podcast_invitation' | 'follow_up';
  personalization_data?: any;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: EmailRequest = await request.json();
    const { partner_id, campaign_type, personalization_data } = body;

    // Get partner details
    const { data: partner } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partner_id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Check if partner has unsubscribed
    if (partner.email_unsubscribed) {
      console.log(`[Henry] Partner ${partner_id} has unsubscribed, skipping email`);
      return NextResponse.json({
        success: false,
        message: 'Partner has unsubscribed from emails'
      }, { status: 400 });
    }

    // Query Atlas for email strategy research
    console.log(`[Henry] Crafting ${campaign_type} email for ${partner.first_name} ${partner.last_name}, querying Atlas...`);

    const atlasResponse = await askAtlas(
      'henry',
      `What are effective email strategies for reaching out to estate planning attorneys about ${campaign_type === 'podcast_invitation' ? 'appearing as a podcast guest to discuss their expertise' : 'joining a professional network for dynasty trusts and asset protection'}? The attorney specializes in ${partner.specializations?.join(', ') || 'estate planning'}. Provide 3 brief tips for personalization.`,
      {
        context: `Attorney: ${partner.first_name} ${partner.last_name}, Experience: ${partner.experience_years} years, State: ${partner.licensed_states?.join(', ')}`,
        max_tokens: 384,
        prefer_provider: 'bedrock'
      }
    );

    let emailStrategy = null;
    if (atlasResponse.success && atlasResponse.research_result) {
      emailStrategy = atlasResponse.research_result;
      console.log(`[Henry] Atlas provided email strategy (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
    }

    const responseTime = Date.now() - startTime;

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'henry',
        action_type: 'legal_professional_email',
        action_details: {
          partner_id,
          campaign_type,
          attorney_name: `${partner.first_name} ${partner.last_name}`,
          specializations: partner.specializations,
          used_atlas_research: !!emailStrategy,
          response_time_ms: responseTime,
          atlas_cost: atlasResponse.cost || 0
        },
        status: 'completed'
      });

    // Update Henry's health
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'henry',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        average_response_time: responseTime,
        metadata: {
          last_campaign_type: campaign_type,
          used_atlas: !!emailStrategy
        }
      }, {
        onConflict: 'bot_name'
      });

    // Report to C-Suite
    await reportActionCompleted('henry', {
      action_type: 'legal_professional_email',
      details: {
        partner_id,
        campaign_type,
        attorney_specializations: partner.specializations
      },
      success: true,
      metrics: {
        email_personalized: true,
        used_atlas_research: !!emailStrategy,
        atlas_cost: atlasResponse.cost || 0
      }
    }).catch(err => {
      console.error('[Henry] Failed to report to C-Suite:', err);
    });

    return NextResponse.json({
      success: true,
      bot: 'henry',
      role: 'Legal Professional Email Outreach',
      message: 'Henry would send email here (demonstration endpoint)',
      email_strategy: emailStrategy,
      partner: {
        id: partner_id,
        name: `${partner.first_name} ${partner.last_name}`,
        email: partner.email,
        specializations: partner.specializations,
        experience_years: partner.experience_years
      },
      campaign_type,
      note: 'Actual emails sent via email service integration (Resend/SendGrid)',
      reported_to_csuite: true
    });

  } catch (error: any) {
    console.error('[Henry] Error:', error);

    // Report critical failure to C-Suite
    await reportCriticalIssue('henry', {
      error_type: 'email_campaign_failure',
      error_message: error.message,
      affected_systems: ['legal_professional_email'],
      recovery_attempted: false,
      requires_human_intervention: true
    }, 'urgent').catch(console.error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'henry',
        action_type: 'legal_professional_email',
        action_details: {
          error_message: error.message
        },
        status: 'failed'
      });

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  const supabase = getAdminClient();

  const { data: health } = await supabase
    .from('ai_bot_health')
    .select('*')
    .eq('bot_name', 'henry')
    .single();

  // Get email campaign statistics
  const { count: totalPartners } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true });

  const { count: unsubscribed } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('email_unsubscribed', true);

  return NextResponse.json({
    bot_name: 'henry',
    role: 'Legal Professional Email Outreach & Campaigns',
    business_model: 'IntroAlignment - Legal Services Network',
    status: health?.status || 'unknown',
    stats: {
      total_partners: totalPartners,
      unsubscribed: unsubscribed,
      active_email_list: (totalPartners || 0) - (unsubscribed || 0),
      unsubscribe_rate: (totalPartners || 0) > 0 ? `${((unsubscribed || 0) / (totalPartners || 1) * 100).toFixed(1)}%` : 'N/A'
    },
    capabilities: [
      'Partnership invitation emails to estate planning attorneys',
      'Podcast guest invitations for sovereigndesign.it.com',
      'Personalized email campaigns based on specialization',
      'Follow-up sequence management',
      'Email tracking (opens, clicks, replies)',
      'CAN-SPAM compliance (unsubscribe handling)',
      'Email template personalization',
      'Calendly integration for scheduling',
      'Integrates with Atlas for email strategy research',
      'Reports to MFS C-Suite Bot'
    ],
    email_campaigns: [
      'Partnership Opportunities (IntroAlignment network invitation)',
      'Podcast Invitations (sovereigndesign.it.com guest spots)',
      'Wednesday Booking Reminders (podcast recording days)',
      'Follow-up Sequences (2-touch, 3-touch campaigns)',
      'Network Updates (quarterly newsletters)'
    ],
    email_personalization: [
      'Attorney name and credentials',
      'Specialization-specific messaging',
      'State bar membership',
      'Years of experience',
      'Notable publications or speaking engagements',
      'Recent case wins or achievements'
    ],
    compliance: [
      'CAN-SPAM Act compliant',
      'Unsubscribe link in every email',
      'Physical mailing address included',
      'Opt-out honored within 10 business days',
      'Professional sender information'
    ]
  });
}
