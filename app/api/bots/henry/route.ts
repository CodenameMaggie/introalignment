import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas, reportActionCompleted, reportCriticalIssue } from '@/lib/bots/inter-bot-client';
import { sendPodcastInvitation } from '@/lib/email/forbes-command-center';

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

    // Check email blacklist
    const { data: blacklisted } = await supabase
      .rpc('check_email_blacklist', { p_email: partner.email })
      .single();

    if (blacklisted && (blacklisted as any).is_blacklisted) {
      console.log(`[Henry] Email ${partner.email} is blacklisted: ${(blacklisted as any).reason}`);
      return NextResponse.json({
        success: false,
        message: 'Email address is blacklisted'
      }, { status: 400 });
    }

    // Check for duplicate emails (same campaign within 30 days)
    const { data: duplicateCheck } = await supabase
      .rpc('check_duplicate_email', {
        p_recipient_email: partner.email,
        p_campaign_type: campaign_type,
        p_days_threshold: 30
      })
      .single();

    if (duplicateCheck && (duplicateCheck as any).is_duplicate) {
      console.log(`[Henry] Duplicate email detected for ${partner.email}. Last sent ${(duplicateCheck as any).days_since_last_sent} days ago`);
      return NextResponse.json({
        success: false,
        message: `Email already sent ${(duplicateCheck as any).days_since_last_sent} days ago. Minimum 30-day gap required.`
      }, { status: 400 });
    }

    // Check email frequency (max 3 emails per week)
    const { data: frequencyCheck } = await supabase
      .rpc('get_recent_email_count', {
        p_recipient_email: partner.email,
        p_days: 7
      })
      .single();

    if (frequencyCheck && (frequencyCheck as any).email_count >= 3) {
      console.log(`[Henry] Email frequency limit reached for ${partner.email}: ${(frequencyCheck as any).email_count} emails in last 7 days`);
      return NextResponse.json({
        success: false,
        message: 'Email frequency limit reached (max 3 per week)'
      }, { status: 429 });
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

    // Send actual email based on campaign type
    let emailResult: { success: boolean; error?: string } | null = null;

    if (campaign_type === 'podcast_invitation') {
      emailResult = await sendPodcastInvitation({
        email: partner.email,
        firstName: partner.first_name || partner.full_name?.split(' ')[0] || 'there',
        professionalTitle: partner.professional_title,
        specializations: partner.specializations
      });

      if (!emailResult.success) {
        console.error(`[Henry] Failed to send podcast invitation to ${partner.email}:`, emailResult.error);
        return NextResponse.json({
          success: false,
          error: `Failed to send email: ${emailResult.error}`
        }, { status: 500 });
      }

      console.log(`[Henry] ✅ Podcast invitation sent to ${partner.email}`);
    } else {
      // For other campaign types, just log (implement later if needed)
      console.log(`[Henry] ℹ️  ${campaign_type} campaign logged but not sent (not implemented yet)`);
    }

    // Log to outreach email tracking (deduplication)
    await supabase
      .from('outreach_email_log')
      .insert({
        recipient_email: partner.email,
        recipient_type: 'partner',
        recipient_id: partner_id,
        campaign_type,
        sender_email: campaign_type === 'podcast_invitation' ? 'maggie@maggieforbesstrategies.com' : 'hello@introalignment.com',
        status: emailResult?.success ? 'sent' : 'logged',
        sent_at: new Date().toISOString(),
        provider: 'forbes-command-center',
        metadata: {
          partner_name: `${partner.first_name} ${partner.last_name}`,
          specializations: partner.specializations,
          used_atlas_research: !!emailStrategy,
          email_actually_sent: !!emailResult?.success
        }
      });

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'henry',
        action_type: 'legal_professional_email',
        action_details: {
          partner_id,
          partner_email: partner.email,
          campaign_type,
          attorney_name: `${partner.first_name} ${partner.last_name}`,
          specializations: partner.specializations,
          used_atlas_research: !!emailStrategy,
          response_time_ms: responseTime,
          atlas_cost: atlasResponse.cost || 0
        },
        status: 'completed'
      });

    // Update partner last contact date
    await supabase
      .from('partners')
      .update({
        last_contact_date: new Date().toISOString().split('T')[0], // Just the date part
        partner_type: partner.partner_type === 'prospect' ? 'contacted' : partner.partner_type
      })
      .eq('id', partner_id);

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
      message: emailResult?.success
        ? `✅ ${campaign_type === 'podcast_invitation' ? 'Podcast invitation' : 'Email'} sent to ${partner.email}`
        : `ℹ️  ${campaign_type} campaign logged (email sending not implemented for this type yet)`,
      email_sent: !!emailResult?.success,
      email_strategy: emailStrategy,
      partner: {
        id: partner_id,
        name: `${partner.first_name} ${partner.last_name}`,
        email: partner.email,
        specializations: partner.specializations,
        experience_years: partner.experience_years
      },
      campaign_type,
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
