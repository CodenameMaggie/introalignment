import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { askAtlas } from '@/lib/bots/inter-bot-client';

/**
 * Dan - The Lead Scraping & Qualification Bot
 * Handles lead scraping from Reddit and other platforms
 * Queries Atlas for research on lead qualification strategies
 */

interface ScrapeRequest {
  source_id?: string;
  scrape_all?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getAdminClient();
  const startTime = Date.now();

  try {
    const body: ScrapeRequest = await request.json();
    const { source_id, scrape_all = false } = body;

    // Example: Dan queries Atlas for lead qualification research
    console.log('[Dan] Starting scrape operation, querying Atlas for qualification strategies...');

    const atlasResponse = await askAtlas(
      'dan',
      'What are effective criteria for qualifying leads in dating apps? Focus on behavioral signals that indicate genuine interest in finding a partner.',
      {
        max_tokens: 384,
        prefer_provider: 'bedrock' // Cost-optimized
      }
    );

    let qualificationStrategy = null;
    if (atlasResponse.success && atlasResponse.research_result) {
      qualificationStrategy = atlasResponse.research_result;
      console.log(`[Dan] Atlas provided qualification strategy (${atlasResponse.provider}, $${atlasResponse.cost?.toFixed(6)})`);
    }

    // Dan's scraping logic would go here
    // This is a demonstration of how Dan integrates with Atlas

    const responseTime = Date.now() - startTime;

    // Log action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dan',
        action_type: 'lead_scrape',
        action_details: {
          source_id,
          scrape_all,
          used_atlas_research: !!qualificationStrategy,
          response_time_ms: responseTime,
          atlas_cost: atlasResponse.cost || 0
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
          last_scrape_type: scrape_all ? 'all_sources' : 'single_source',
          used_atlas: !!qualificationStrategy
        }
      }, {
        onConflict: 'bot_name'
      });

    return NextResponse.json({
      success: true,
      bot: 'dan',
      message: 'Dan scrapes via /api/cron/scrape endpoint (demonstration endpoint)',
      qualification_strategy: qualificationStrategy,
      note: 'Dan scrapes Reddit using 100% free JSON API - no AI keys required for scraping'
    });

  } catch (error: any) {
    console.error('[Dan] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'dan',
        action_type: 'lead_scrape',
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

  // Get scraping stats
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true });

  const { count: enrichedLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'enriched');

  return NextResponse.json({
    bot_name: 'dan',
    role: 'Lead Scraping & Qualification',
    status: health?.status || 'unknown',
    stats: {
      total_leads: totalLeads,
      enriched_leads: enrichedLeads,
      target: 1000000
    },
    capabilities: [
      'Reddit lead scraping (100% free, no AI keys)',
      'Lead qualification using fit scores',
      'Business logic enrichment',
      'Integrates with Atlas for qualification strategy research'
    ]
  });
}
