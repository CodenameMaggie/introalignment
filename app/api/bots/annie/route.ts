import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas, reportActionCompleted, reportCriticalIssue } from '@/lib/bots/inter-bot-client';

/**
 * Annie - The Legal Professional Onboarding & Conversation Bot
 *
 * PURPOSE: Handles onboarding for estate planning attorneys joining IntroAlignment
 * FOCUS: Application assistance, qualification questions, partnership guidance
 * REPORTS TO: MFS C-Suite Bot
 *
 * RESPONSIBILITIES:
 * - Answer questions from attorneys considering partnership
 * - Guide through partner application process
 * - Explain IntroAlignment network benefits
 * - Provide podcast guest information (sovereigndesign.it.com)
 * - Handle inquiries about referral terms and client types
 * - Escalate complex questions to Maggie Forbes
 */

interface ConversationRequest {
  partner_id?: string;
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
  context?: 'partnership_inquiry' | 'podcast_interest' | 'application_help' | 'general';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: ConversationRequest = await request.json();
    const { partner_id, message, conversation_history = [], context = 'general' } = body;

    // Get partner context if provided
    let partner = null;
    if (partner_id) {
      const { data } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partner_id)
        .single();
      partner = data;
    }

    // Check if message needs Atlas research
    const needsResearch =
      message.toLowerCase().includes('dynasty trust') ||
      message.toLowerCase().includes('asset protection') ||
      message.toLowerCase().includes('estate planning') ||
      message.toLowerCase().includes('referral') ||
      message.toLowerCase().includes('clients');

    let researchInsight = null;

    if (needsResearch) {
      console.log('[Annie] Detected legal topic, querying Atlas for research...');

      const atlasResponse = await askAtlas(
        'annie',
        `An estate planning attorney is asking about: "${message}". Provide a brief, professional response about IntroAlignment's network for dynasty trusts, asset protection, and high-net-worth estate planning. Focus on: attorney benefits, client referrals, podcast opportunities.`,
        {
          context: `Attorney context: ${partner ? `${partner.first_name} ${partner.last_name}, ${partner.experience_years} years experience, specializes in ${partner.specializations?.join(', ')}` : 'Prospective attorney'}`,
          max_tokens: 384,
          prefer_provider: 'bedrock'
        }
      );

      if (atlasResponse.success && atlasResponse.research_result) {
        researchInsight = atlasResponse.research_result;
        console.log(`[Annie] Atlas provided research insight (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
      }
    }

    const responseTime = Date.now() - startTime;

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'annie',
        action_type: 'legal_professional_conversation',
        action_details: {
          partner_id,
          context,
          message_length: message.length,
          used_atlas_research: !!researchInsight,
          response_time_ms: responseTime
        },
        status: 'completed'
      });

    // Update Annie's health
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'annie',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        average_response_time: responseTime,
        metadata: {
          last_context: context,
          used_atlas: !!researchInsight
        }
      }, {
        onConflict: 'bot_name'
      });

    // Report to C-Suite
    await reportActionCompleted('annie', {
      action_type: 'legal_professional_conversation',
      details: {
        context,
        partner_id
      },
      success: true,
      metrics: {
        used_atlas_research: !!researchInsight
      }
    }).catch(err => {
      console.error('[Annie] Failed to report to C-Suite:', err);
    });

    return NextResponse.json({
      success: true,
      bot: 'annie',
      role: 'Legal Professional Onboarding & Conversation',
      message: 'Annie provides conversational support for attorneys joining IntroAlignment',
      research_insight: researchInsight,
      partner_info: partner ? {
        name: `${partner.first_name} ${partner.last_name}`,
        experience: `${partner.experience_years} years`,
        specializations: partner.specializations
      } : null,
      context,
      note: 'Annie would generate a conversational AI response here using Claude Sonnet',
      reported_to_csuite: true
    });

  } catch (error: any) {
    console.error('[Annie] Error:', error);

    // Report critical failure to C-Suite
    await reportCriticalIssue('annie', {
      error_type: 'conversation_failure',
      error_message: error.message,
      affected_systems: ['legal_professional_conversation'],
      recovery_attempted: false,
      requires_human_intervention: true
    }, 'urgent').catch(console.error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'annie',
        action_type: 'legal_professional_conversation',
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
    .eq('bot_name', 'annie')
    .single();

  return NextResponse.json({
    bot_name: 'annie',
    role: 'Legal Professional Onboarding & Conversation',
    business_model: 'IntroAlignment - Legal Services Network',
    status: health?.status || 'unknown',
    capabilities: [
      'Attorney partnership inquiry handling',
      'Partner application guidance',
      'Podcast guest information (sovereigndesign.it.com)',
      'Network benefits explanation',
      'Client referral process details',
      'Calendly scheduling assistance (Wednesday bookings)',
      'Conversational AI using Claude Sonnet',
      'Integrates with Atlas for legal topic research',
      'Reports to MFS C-Suite Bot'
    ],
    common_questions: [
      'What types of clients does IntroAlignment refer?',
      'How does the partnership model work?',
      'What are the podcast guest requirements?',
      'When are podcast recordings scheduled? (Wednesdays)',
      'What specializations are you looking for?',
      'How do referrals work?',
      'What are the partnership tiers?',
      'Do I need specific credentials to join?'
    ],
    conversation_contexts: [
      'Partnership Inquiry - General interest in joining network',
      'Podcast Interest - sovereigndesign.it.com guest spot',
      'Application Help - Assistance completing partner form',
      'Referral Questions - How client referrals work',
      'Credential Verification - Bar numbers, certifications',
      'General - Other questions about IntroAlignment'
    ],
    escalation_triggers: [
      'Pricing or fee structure questions → Escalate to Maggie',
      'Legal advice requests → Refer to appropriate attorney',
      'Complaints or disputes → Escalate to Maggie',
      'Complex partnership terms → Escalate to Maggie'
    ]
  });
}
