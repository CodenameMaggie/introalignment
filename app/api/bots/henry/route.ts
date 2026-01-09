import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas } from '@/lib/bots/inter-bot-client';

/**
 * Henry - The Email Outreach Bot
 * Handles email campaigns and invitations
 * Queries Atlas for research on messaging strategies and engagement tactics
 */

interface EmailRequest {
  lead_id: string;
  campaign_type: 'invitation' | 'follow_up' | 'engagement';
  personalization_data?: any;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: EmailRequest = await request.json();
    const { lead_id, campaign_type, personalization_data } = body;

    // Get lead details
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Example: Henry queries Atlas for email strategy research
    console.log(`[Henry] Crafting ${campaign_type} email for lead ${lead_id}, querying Atlas...`);

    const atlasResponse = await askAtlas(
      'henry',
      `What are effective strategies for ${campaign_type} emails in dating apps? The user appears interested in ${lead.interests || 'dating'}. Provide 3 brief tips.`,
      {
        context: `Lead source: ${lead.source_platform}, Fit score: ${lead.fit_score}`,
        max_tokens: 256,
        prefer_provider: 'bedrock' // Cost-optimized
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
        action_type: 'email_campaign',
        action_details: {
          lead_id,
          campaign_type,
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

    return NextResponse.json({
      success: true,
      bot: 'henry',
      message: 'Henry would send email here (demonstration endpoint)',
      email_strategy: emailStrategy,
      lead: {
        id: lead_id,
        email: lead.email,
        fit_score: lead.fit_score
      }
    });

  } catch (error: any) {
    console.error('[Henry] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'henry',
        action_type: 'email_campaign',
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

  return NextResponse.json({
    bot_name: 'henry',
    role: 'Email Outreach & Campaigns',
    status: health?.status || 'unknown',
    capabilities: [
      'Invitation email campaigns',
      'Follow-up sequences',
      'Engagement tracking',
      'Integrates with Atlas for messaging strategy research'
    ]
  });
}
