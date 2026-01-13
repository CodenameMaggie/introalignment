import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ACTECScraper } from '@/lib/scrapers/actec-scraper';
import { WealthCounselScraper } from '@/lib/scrapers/wealthcounsel-scraper';
import { GoogleSearchScraper } from '@/lib/scrapers/google-search-scraper';
import { StateBarScraper } from '@/lib/scrapers/state-bar-scraper';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ATTORNEY_TARGET = 10000; // Target: 10,000 estate planning attorneys
const SCRAPING_ENABLED = process.env.ATTORNEY_SCRAPING_ENABLED !== 'false'; // Default enabled

/**
 * Attorney Scraper Cron Job
 *
 * Runs every 6 hours (configured in vercel.json)
 *
 * RESPONSIBILITIES:
 * 1. Scrape ACTEC directory (~2,600 Fellows)
 * 2. Scrape WealthCounsel directory (~4,000 members)
 * 3. Auto-score prospects (business_builder + expertise)
 * 4. Insert into partners table as 'prospect'
 * 5. Throttle at 10,000 attorneys
 *
 * SOURCES (all free, public directories):
 * - ACTEC (American College of Trust and Estate Counsel)
 *   - Invitation-only, top-tier estate planning attorneys
 *   - 10+ years experience typically
 *   - Complex estate planning expertise
 *   - ~2,600 Fellows
 *
 * - WealthCounsel
 *   - Practice owners and entrepreneurs
 *   - Business-focused estate planning
 *   - Asset protection and dynasty planning
 *   - ~4,000 members
 *
 * - Google Search
 *   - Public search results for estate planning attorneys
 *   - Searches by city/state for targeted results
 *   - Extracts firm websites and contact information
 *
 * - State Bar Directories
 *   - Public records from state bar associations
 *   - CA, NY, TX, FL (highest HNW states)
 *   - Licensed attorney information
 *   - Practice area specializations
 *
 * AUTO-ENROLLMENT:
 * - After scraping, qualified prospects (fit_score >= 12) automatically
 *   enrolled in podcast sequence by podcast-outreach cron job
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabase();

  try {
    // Check if scraping is enabled
    if (!SCRAPING_ENABLED) {
      return NextResponse.json({
        success: true,
        scraping_status: 'DISABLED',
        message: 'Attorney scraping disabled. Set ATTORNEY_SCRAPING_ENABLED=true to activate.',
        attorneys_scraped: 0
      });
    }

    // Check current attorney count - throttle if we've hit target
    const { count: totalAttorneys } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .in('source', ['actec_directory', 'wealthcounsel_directory']);

    if (totalAttorneys && totalAttorneys >= ATTORNEY_TARGET) {
      console.log(`[Attorney Scraper] Target reached: ${totalAttorneys}/${ATTORNEY_TARGET} - Throttling`);
      return NextResponse.json({
        success: true,
        scraping_status: 'THROTTLED',
        message: `Attorney target reached (${totalAttorneys}/${ATTORNEY_TARGET})`,
        attorneys_scraped: 0,
        total_attorneys: totalAttorneys
      });
    }

    console.log(`[Attorney Scraper] Current attorneys: ${totalAttorneys}/${ATTORNEY_TARGET} - Continuing scraping`);

    // Get active attorney sources
    const { data: sources } = await supabase
      .from('attorney_sources')
      .select('*')
      .eq('is_active', true);

    if (!sources?.length) {
      // If no sources configured, use defaults
      console.log('[Attorney Scraper] No sources configured, using defaults (ACTEC + WealthCounsel)');
    }

    const results: any[] = [];

    // Run scrapers in parallel for efficiency
    const scrapePromises: Promise<any>[] = [];

    const HIGH_VALUE_STATES = ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington'];
    const RESULTS_PER_SOURCE = 20; // Reduced to allow room for all sources

    // ACTEC Scraper
    const actecSource = sources?.find(s => s.source_type === 'actec');
    if (!actecSource || actecSource.is_active !== false) {
      console.log('[Attorney Scraper] Running ACTEC scraper...');
      const actecScraper = new ACTECScraper('actec', {
        target_states: HIGH_VALUE_STATES,
        max_results: RESULTS_PER_SOURCE
      });
      scrapePromises.push(actecScraper.scrape());
    }

    // WealthCounsel Scraper
    const wcSource = sources?.find(s => s.source_type === 'wealthcounsel');
    if (!wcSource || wcSource.is_active !== false) {
      console.log('[Attorney Scraper] Running WealthCounsel scraper...');
      const wcScraper = new WealthCounselScraper('wealthcounsel', {
        target_states: HIGH_VALUE_STATES,
        max_results: RESULTS_PER_SOURCE
      });
      scrapePromises.push(wcScraper.scrape());
    }

    // Google Search Scraper
    const googleSource = sources?.find(s => s.source_type === 'google_search');
    if (!googleSource || googleSource.is_active !== false) {
      console.log('[Attorney Scraper] Running Google Search scraper...');
      const googleScraper = new GoogleSearchScraper('google_search', {
        target_states: HIGH_VALUE_STATES,
        target_cities: ['Los Angeles', 'San Francisco', 'New York', 'Dallas', 'Houston', 'Miami'],
        max_results: RESULTS_PER_SOURCE
      });
      scrapePromises.push(googleScraper.scrape());
    }

    // State Bar Scraper
    const stateBarSource = sources?.find(s => s.source_type === 'state_bar');
    if (!stateBarSource || stateBarSource.is_active !== false) {
      console.log('[Attorney Scraper] Running State Bar scraper...');
      const stateBarScraper = new StateBarScraper('state_bar', {
        target_states: ['California', 'New York', 'Texas', 'Florida'], // Top 4 HNW states
        target_specializations: ['Estate Planning', 'Trusts & Estates', 'Asset Protection'],
        max_results_per_state: 5 // 5 per state = 20 total
      });
      scrapePromises.push(stateBarScraper.scrape());
    }

    // Wait for all scrapers to complete
    const scrapeResults = await Promise.all(scrapePromises);
    results.push(...scrapeResults);

    // Calculate totals
    const totalFound = results.reduce((sum, r) => sum + (r.attorneys_found || 0), 0);
    const totalCreated = results.reduce((sum, r) => sum + (r.attorneys_created || 0), 0);
    const totalDuplicates = results.reduce((sum, r) => sum + (r.duplicates_skipped || 0), 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);

    // Get updated attorney count
    const { count: newTotalAttorneys } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .in('source', ['actec_directory', 'wealthcounsel_directory']);

    // Get high-quality prospects ready for outreach
    const { count: readyForOutreach } = await supabase
      .from('podcast_prospects_high_priority')
      .select('id', { count: 'exact', head: true })
      .in('podcast_status', ['not_contacted', null]);

    console.log(`[Attorney Scraper] ✅ Complete: ${totalCreated} created, ${totalDuplicates} duplicates, ${totalErrors} errors`);
    console.log(`[Attorney Scraper] Total attorneys: ${newTotalAttorneys}/${ATTORNEY_TARGET}`);
    console.log(`[Attorney Scraper] Ready for podcast outreach: ${readyForOutreach}`);

    return NextResponse.json({
      success: true,
      scraping_status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      scrapers_run: results.length,
      attorneys_found: totalFound,
      attorneys_created: totalCreated,
      duplicates_skipped: totalDuplicates,
      errors: totalErrors,
      total_attorneys: newTotalAttorneys || 0,
      attorney_target: ATTORNEY_TARGET,
      ready_for_outreach: readyForOutreach || 0,
      results
    });

  } catch (error: any) {
    console.error('[Attorney Scraper] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
