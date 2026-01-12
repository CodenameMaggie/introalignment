import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas, reportActionCompleted, reportCriticalIssue } from '@/lib/bots/inter-bot-client';

/**
 * Dave - The Client-Lawyer Matching Bot
 *
 * PURPOSE: Matches high-net-worth clients with estate planning attorneys
 * FOCUS: Dynasty trusts, asset protection, sophisticated estate structures
 * REPORTS TO: MFS C-Suite Bot
 *
 * RESPONSIBILITIES:
 * - Match clients with attorneys based on needs and specialization
 * - Score attorney-client compatibility
 * - Consider: specialization, state licensing, experience level, client fit
 * - Recommend best-fit attorneys for each client inquiry
 * - Track successful matches and referrals
 */

interface MatchRequest {
  client_inquiry_id?: string; // UUID from client_inquiries table
  client_id?: string; // Legacy support
  client_needs?: {
    estate_size?: string; // e.g., "$10M-$50M", "$50M-$100M", "$100M+"
    primary_need?: string; // e.g., "dynasty_trust", "asset_protection", "tax_planning"
    state?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
  };
  attorney_requirements?: {
    min_experience_years?: number;
    required_credentials?: string[];
    required_specializations?: string[];
  };
  max_matches?: number; // Max number of attorneys to return (default 3)
  auto_send_to_client?: boolean; // Whether to automatically send matches to client (default false)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: MatchRequest = await request.json();
    const { client_inquiry_id, client_id, client_needs, attorney_requirements, max_matches, auto_send_to_client } = body;

    // Get client inquiry details if provided
    let clientInquiry = null;
    if (client_inquiry_id) {
      const { data } = await supabase
        .from('client_inquiries')
        .select('*')
        .eq('id', client_inquiry_id)
        .single();

      clientInquiry = data;

      if (!clientInquiry) {
        return NextResponse.json({ error: 'Client inquiry not found' }, { status: 404 });
      }

      console.log(`[Dave] Matching client inquiry ${client_inquiry_id}: ${clientInquiry.full_name} (${clientInquiry.estate_size}, ${clientInquiry.primary_residence})`);
    }

    // Query Atlas for matching strategy research
    const estateSize = clientInquiry?.estate_size || client_needs?.estate_size || '$10M+';
    const primaryNeed = clientInquiry?.legal_needs?.[0] || client_needs?.primary_need || 'dynasty trusts and asset protection';

    console.log('[Dave] Analyzing client-attorney compatibility, querying Atlas...');

    const atlasResponse = await askAtlas(
      'dave',
      `What are the most important factors in matching high-net-worth clients (${estateSize}) with estate planning attorneys for ${primaryNeed}? Consider: specialization fit, experience level, state licensing, and client relationship factors. List top 5 matching criteria.`,
      {
        context: clientInquiry ? JSON.stringify({
          estate_size: clientInquiry.estate_size,
          legal_needs: clientInquiry.legal_needs,
          state: clientInquiry.primary_residence,
          urgency: clientInquiry.urgency
        }) : (client_needs ? JSON.stringify(client_needs) : undefined),
        max_tokens: 512,
        prefer_provider: 'bedrock'
      }
    );

    let matchingStrategy = null;
    if (atlasResponse.success && atlasResponse.research_result) {
      matchingStrategy = atlasResponse.research_result;
      console.log(`[Dave] Atlas provided matching strategy (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
    }

    // Use SQL matching function for client inquiries
    let matchingAttorneys: any[] = [];
    let matchScores: any[] = [];

    if (client_inquiry_id) {
      const { data: matches, error: matchError } = await supabase
        .rpc('match_client_with_attorneys', {
          p_client_inquiry_id: client_inquiry_id,
          p_max_matches: max_matches || 3
        });

      if (matchError) {
        console.error('[Dave] SQL match function error:', matchError);
        throw new Error(`Matching failed: ${matchError.message}`);
      }

      matchScores = matches || [];

      // Get full attorney details for matched partners
      if (matchScores.length > 0) {
        const partnerIds = matchScores.map((m: any) => m.partner_id);
        const { data: attorneys } = await supabase
          .from('partners')
          .select('*')
          .in('id', partnerIds);

        matchingAttorneys = attorneys || [];

        // Create client-attorney match records
        const matchRecords = matchScores.map((match: any) => ({
          client_inquiry_id,
          partner_id: match.partner_id,
          match_score: match.match_score,
          match_reasons: match.match_reasons,
          status: auto_send_to_client ? 'sent_to_client' : 'proposed',
          sent_to_client_at: auto_send_to_client ? new Date().toISOString() : null
        }));

        await supabase
          .from('client_attorney_matches')
          .insert(matchRecords);

        // Update client inquiry status
        await supabase
          .from('client_inquiries')
          .update({
            match_status: 'matched',
            match_date: new Date().toISOString(),
            matched_attorney_ids: partnerIds,
            status: 'matched'
          })
          .eq('id', client_inquiry_id);

        console.log(`[Dave] ✅ Created ${matchRecords.length} matches for client inquiry ${client_inquiry_id}`);
      } else {
        console.log(`[Dave] ⚠️  No matching attorneys found for client inquiry ${client_inquiry_id}`);
      }
    } else {
      // Legacy matching for manual requests
      const { data: attorneys, error: matchError } = await supabase
        .from('partners')
        .select('*')
        .contains('specializations', client_needs?.primary_need ? [client_needs.primary_need] : [])
        .gte('years_experience', attorney_requirements?.min_experience_years || 5)
        .limit(10);

      if (matchError) {
        console.error('[Dave] Match query error:', matchError);
      }

      matchingAttorneys = attorneys || [];
    }

    const responseTime = Date.now() - startTime;

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dave',
        action_type: 'client_attorney_matching',
        action_details: {
          client_inquiry_id,
          client_id,
          client_inquiry_name: clientInquiry?.full_name,
          client_estate_size: clientInquiry?.estate_size,
          client_needs,
          attorney_requirements,
          matches_found: matchingAttorneys?.length || 0,
          match_scores: matchScores.map((m: any) => ({ partner_id: m.partner_id, score: m.match_score })),
          used_atlas_research: !!matchingStrategy,
          response_time_ms: responseTime,
          atlas_cost: atlasResponse.cost || 0
        },
        status: 'completed'
      });

    // Update Dave's health
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'dave',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        average_response_time: responseTime,
        metadata: {
          last_client_need: client_needs?.primary_need,
          matches_found: matchingAttorneys?.length || 0,
          used_atlas: !!matchingStrategy
        }
      }, {
        onConflict: 'bot_name'
      });

    // Report to C-Suite
    await reportActionCompleted('dave', {
      action_type: 'client_attorney_matching',
      details: {
        client_need: client_needs?.primary_need,
        matches_found: matchingAttorneys?.length || 0
      },
      success: true,
      metrics: {
        used_atlas_research: !!matchingStrategy,
        atlas_cost: atlasResponse.cost || 0
      }
    }).catch(err => {
      console.error('[Dave] Failed to report to C-Suite:', err);
    });

    return NextResponse.json({
      success: true,
      bot: 'dave',
      role: 'Client-Lawyer Matching & Compatibility',
      message: client_inquiry_id
        ? `✅ Matched ${matchingAttorneys.length} attorneys for ${clientInquiry?.full_name} (${clientInquiry?.estate_size})`
        : 'Dave matches high-net-worth clients with estate planning attorneys',
      client_inquiry: clientInquiry ? {
        id: clientInquiry.id,
        name: clientInquiry.full_name,
        estate_size: clientInquiry.estate_size,
        legal_needs: clientInquiry.legal_needs,
        state: clientInquiry.primary_residence,
        urgency: clientInquiry.urgency
      } : null,
      matching_strategy: matchingStrategy,
      client_needs: client_needs,
      matches_found: matchingAttorneys?.length || 0,
      matches_created: client_inquiry_id ? matchScores.length : 0,
      top_matches: matchingAttorneys?.map((a, idx) => {
        const scoreData = matchScores.find((m: any) => m.partner_id === a.id);
        return {
          partner_id: a.id,
          name: a.full_name || `${a.first_name} ${a.last_name}`,
          firm: a.firm_name,
          professional_title: a.professional_title,
          specializations: a.specializations,
          years_experience: a.years_experience,
          licensed_states: a.licensed_states,
          match_score: scoreData?.match_score || null,
          match_reasons: scoreData?.match_reasons || []
        };
      }),
      note: client_inquiry_id
        ? 'SQL-based algorithmic matching with score calculation'
        : 'Legacy matching using specialization and experience',
      reported_to_csuite: true
    });

  } catch (error: any) {
    console.error('[Dave] Error:', error);

    // Report critical failure to C-Suite
    await reportCriticalIssue('dave', {
      error_type: 'matching_failure',
      error_message: error.message,
      affected_systems: ['client_attorney_matching'],
      recovery_attempted: false,
      requires_human_intervention: true
    }, 'urgent').catch(console.error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dave',
        action_type: 'client_attorney_matching',
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
    .eq('bot_name', 'dave')
    .single();

  return NextResponse.json({
    bot_name: 'dave',
    role: 'Client-Lawyer Matching & Compatibility',
    business_model: 'IntroAlignment - Legal Services Network',
    status: health?.status || 'unknown',
    capabilities: [
      'Algorithmic client-attorney matching',
      'Compatibility scoring based on specialization',
      'State licensing verification',
      'Experience level matching',
      'Estate size appropriateness check',
      'Urgency-based prioritization',
      'Credential requirement verification',
      'Integrates with Atlas for matching research',
      'Reports to MFS C-Suite Bot'
    ],
    matching_factors: [
      'Attorney Specialization (dynasty trusts, asset protection, etc.)',
      'State Bar Licensing (client state + multi-state practice)',
      'Experience Level (minimum years, high-net-worth experience)',
      'Credentials (ACTEC Fellow, Board Certified, AEP)',
      'Estate Size Fit (attorneys accustomed to client\'s wealth level)',
      'Availability (current capacity for new clients)',
      'Geographic Proximity (if in-person meetings needed)',
      'Reputation & Track Record (successful similar cases)'
    ],
    client_segments: [
      'Ultra High Net Worth ($100M+ estates) → ACTEC Fellows, 15+ years',
      'High Net Worth ($10M-$100M) → Board Certified, 10+ years',
      'Emerging Wealth ($1M-$10M) → Experienced attorneys, 5+ years',
      'Business Owners → Asset protection + tax planning specialists',
      'Family Offices → Multi-generational planning experts',
      'International Clients → Multi-jurisdiction expertise required'
    ],
    matching_algorithm: 'Rule-based (100% algorithmic, NO AI)',
    note: 'Matching uses business logic, not AI. Atlas research improves algorithm over time.'
  });
}
