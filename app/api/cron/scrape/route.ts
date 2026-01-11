import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RedditScraper } from '@/lib/scrapers/reddit-scraper';
import { QuoraScraper } from '@/lib/scrapers/quora-scraper';
import { ForumScraper } from '@/lib/scrapers/forum-scraper';
import { MeetupScraper } from '@/lib/scrapers/meetup-scraper';
import { WebScraper } from '@/lib/scrapers/web-scraper';
import { WikipediaScraper } from '@/lib/scrapers/wikipedia-scraper';
import { IRSScraper } from '@/lib/scrapers/irs-scraper';
import { LegalCaseLawScraper } from '@/lib/scrapers/legal-caselaw-scraper';
import { SECEdgarScraper } from '@/lib/scrapers/sec-edgar-scraper';
import { StateBusinessScraper } from '@/lib/scrapers/state-business-scraper';
import { LegalKnowledgeScraper } from '@/lib/scrapers/legal-knowledge-scraper';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const LEAD_TARGET = 1000000; // Target: 1 Million leads (10X increase)

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  try {
    // Check current lead count - throttle if we've hit target
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });

    if (totalLeads && totalLeads >= LEAD_TARGET) {
      console.log(`Lead target reached: ${totalLeads}/${LEAD_TARGET} - Throttling scraper`);
      return NextResponse.json({
        success: true,
        message: `Lead target reached (${totalLeads}/${LEAD_TARGET})`,
        throttled: true,
        results: []
      });
    }

    console.log(`Current leads: ${totalLeads}/${LEAD_TARGET} - Continuing scraping`);

    // Get all active sources
    const { data: sources } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('is_active', true);

    if (!sources?.length) {
      return NextResponse.json({ message: 'No sources to scrape' });
    }

    const results: any[] = [];

    // Process sources in parallel for 10X speed boost
    const scrapePromises = sources.map(async (source) => {
      try {
        let scraper;
        let result;

        // Create appropriate scraper based on source type
        switch (source.source_type) {
          case 'reddit':
            scraper = new RedditScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'quora':
            scraper = new QuoraScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'forum':
            scraper = new ForumScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'meetup':
            scraper = new MeetupScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'web':
            scraper = new WebScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'wikipedia':
            scraper = new WikipediaScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'irs':
            scraper = new IRSScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'legal_caselaw':
            scraper = new LegalCaseLawScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'sec_edgar':
            scraper = new SECEdgarScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'state_business':
            scraper = new StateBusinessScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          case 'legal_knowledge':
            scraper = new LegalKnowledgeScraper(source.id, source.scrape_config);
            result = await scraper.scrape();
            break;

          default:
            console.log(`Unknown source type: ${source.source_type}`);
            return null;
        }

        // Calculate next scrape time
        const delays: Record<string, number> = {
          'hourly': 3600000,
          'daily': 86400000,
          'weekly': 604800000
        };

        const delay = delays[source.scrape_frequency] || 86400000;

        await supabase
          .from('lead_sources')
          .update({
            last_scraped_at: new Date().toISOString(),
            next_scrape_at: new Date(Date.now() + delay).toISOString()
          })
          .eq('id', source.id);

        // Return result for parallel aggregation
        return {
          source: source.source_name,
          type: source.source_type,
          ...result
        };

      } catch (error: any) {
        console.error(`Error scraping ${source.source_name}:`, error);
        return {
          source: source.source_name,
          type: source.source_type,
          error: error.message
        };
      }
    });

    // Wait for all scrapes to complete in parallel
    const parallelResults = await Promise.allSettled(scrapePromises);
    parallelResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    // Get updated lead count
    const { count: updatedLeadCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      results,
      totalLeads: updatedLeadCount,
      target: LEAD_TARGET,
      progress: `${updatedLeadCount}/${LEAD_TARGET} (${Math.round((updatedLeadCount || 0) / LEAD_TARGET * 100)}%)`
    });

  } catch (error: any) {
    console.error('Scrape cron error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
