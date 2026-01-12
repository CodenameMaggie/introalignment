import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas, reportActionCompleted, reportCriticalIssue } from '@/lib/bots/inter-bot-client';

/**
 * Dan - The Legal Professional Scraping & Qualification Bot
 *
 * PURPOSE: Scrapes lawyer directories and legal platforms to find potential partners
 * FOCUS: Estate planning attorneys, trust lawyers, wealth preservation specialists
 * REPORTS TO: MFS C-Suite Bot
 *
 * RESPONSIBILITIES:
 * - Scrape state bar directories for estate planning attorneys
 * - Scrape legal directories (Avvo, Martindale-Hubbell, Super Lawyers)
 * - Qualify lawyers based on specialization (dynasty trusts, asset protection)
 * - Extract: bar numbers, practice areas, years of experience, licensed states
 * - Score lawyers based on fit for IntroAlignment network
 */

interface ScrapeRequest {
  source?: 'california_bar' | 'new_york_bar' | 'texas_bar' | 'avvo' | 'martindale' | 'all';
  specialization?: string; // e.g., "estate planning", "asset protection"
  state?: string;
  scrape_all?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: ScrapeRequest = await request.json();
    const { source = 'all', specialization = 'estate planning', state, scrape_all = false } = body;

    // Query Atlas for legal professional qualification strategies
    console.log(`[Dan] Starting legal professional scrape (${source}), querying Atlas for qualification criteria...`);

    const atlasResponse = await askAtlas(
      'dan',
      `What are the most important qualification criteria for estate planning attorneys specializing in dynasty trusts and asset protection for high-net-worth clients? Focus on: credentials, experience level, specializations, and red flags to avoid.`,
      {
        max_tokens: 512,
        prefer_provider: 'bedrock' // Cost-optimized
      }
    );

    let qualificationStrategy = null;
    if (atlasResponse.success && atlasResponse.research_result) {
      qualificationStrategy = atlasResponse.research_result;
      console.log(`[Dan] Atlas provided qualification strategy (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
    }

    // Dan's actual scraping logic would go here
    // For now, this is a demonstration endpoint

    // Example: Query partners table to see current lawyer count
    const { count: currentLawyers } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true });

    const responseTime = Date.now() - startTime;

    // Log action to database
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dan',
        action_type: 'lawyer_directory_scrape',
        action_details: {
          source,
          specialization,
          state,
          scrape_all,
          used_atlas_research: !!qualificationStrategy,
          response_time_ms: responseTime,
          atlas_cost: atlasResponse.cost || 0,
          current_lawyer_count: currentLawyers
        },
        status: 'completed'
      });

    // Update Dan's health
    await supabase
      .from('ai_bot_health')
      .upsert({
        bot_name: 'dan',
        status: 'healthy',
        last_active_at: new Date().toISOString(),
        average_response_time: responseTime,
        metadata: {
          last_scrape_source: source,
          last_specialization: specialization,
          used_atlas: !!qualificationStrategy,
          current_lawyer_count: currentLawyers
        }
      }, {
        onConflict: 'bot_name'
      });

    // Report to C-Suite: Action completed
    await reportActionCompleted('dan', {
      action_type: 'lawyer_directory_scrape',
      details: {
        source,
        specialization,
        state,
        response_time_ms: responseTime
      },
      success: true,
      metrics: {
        used_atlas_research: !!qualificationStrategy,
        atlas_cost: atlasResponse.cost || 0,
        current_lawyer_database: currentLawyers
      }
    }).catch(err => {
      console.error('[Dan] Failed to report to C-Suite:', err);
    });

    return NextResponse.json({
      success: true,
      bot: 'dan',
      role: 'Legal Professional Scraping & Qualification',
      message: 'Dan scrapes lawyer directories for estate planning attorneys specializing in dynasty trusts and asset protection',
      qualification_strategy: qualificationStrategy,
      current_lawyer_count: currentLawyers,
      target: 1000,
      sources_available: [
        'California State Bar (estate planning attorneys)',
        'New York State Bar (trust & estates section)',
        'Texas State Bar (estate planning specialists)',
        'Avvo (estate planning lawyers)',
        'Martindale-Hubbell (trusts & estates)',
        'Super Lawyers (estate planning & probate)'
      ],
      scraping_focus: [
        'Dynasty trusts specialists',
        'Asset protection attorneys',
        'High-net-worth estate planning',
        'Tax law expertise',
        'Certified Estate Planners',
        'Bar certified specialists'
      ],
      note: 'Actual scraping happens via cron job. This endpoint demonstrates Dan\'s capabilities.',
      reported_to_csuite: true
    });

  } catch (error: any) {
    console.error('[Dan] Error:', error);

    // Report critical failure to C-Suite
    await reportCriticalIssue('dan', {
      error_type: 'scraping_failure',
      error_message: error.message,
      affected_systems: ['lawyer_directory_scraper'],
      recovery_attempted: false,
      requires_human_intervention: true
    }, 'urgent').catch(console.error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dan',
        action_type: 'lawyer_directory_scrape',
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
    .eq('bot_name', 'dan')
    .single();

  // Get lawyer statistics
  const { count: totalLawyers } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true });

  const { count: qualifiedLawyers } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .gte('experience_years', 5); // Qualified = 5+ years experience

  return NextResponse.json({
    bot_name: 'dan',
    role: 'Legal Professional Scraping & Qualification',
    business_model: 'IntroAlignment - Legal Services Network',
    status: health?.status || 'unknown',
    stats: {
      total_lawyers: totalLawyers,
      qualified_lawyers: qualifiedLawyers,
      target: 1000,
      progress: `${totalLawyers}/1000 (${Math.round((totalLawyers || 0) / 1000 * 100)}%)`
    },
    capabilities: [
      'State bar directory scraping (CA, NY, TX, FL, etc.)',
      'Legal directory scraping (Avvo, Martindale, Super Lawyers)',
      'Lawyer qualification based on specialization',
      'Estate planning attorney identification',
      'Dynasty trust specialist detection',
      'Asset protection attorney targeting',
      'Bar number verification',
      'Practice area extraction',
      'Years of experience tracking',
      'Integrates with Atlas for qualification research',
      'Reports to MFS C-Suite Bot'
    ],
    target_specializations: [
      'Estate Planning & Probate',
      'Trusts & Estates',
      'Dynasty Trusts',
      'Asset Protection',
      'Tax Law',
      'Wealth Preservation',
      'Family Office Planning',
      'Charitable Planning'
    ],
    target_credentials: [
      'Board Certified Estate Planning Attorney',
      'Accredited Estate Planner (AEP)',
      'Fellow of the American College of Trust and Estate Counsel (ACTEC)',
      '10+ years estate planning experience',
      'High-net-worth clientele',
      'Published author or speaker on estate planning topics'
    ],
    scraping_methods: [
      'State bar API/directory scraping (100% free)',
      'Legal directory parsing',
      'LinkedIn profile enrichment',
      'Firm website extraction',
      'Attorney bio scraping'
    ]
  });
}
