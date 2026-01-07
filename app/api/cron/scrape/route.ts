import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RedditScraper } from '@/lib/scrapers/reddit-scraper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get sources due for scraping
    const { data: sources } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('is_active', true)
      .eq('source_type', 'reddit'); // Only Reddit for now

    if (!sources?.length) {
      return NextResponse.json({ message: 'No sources to scrape' });
    }

    const results = [];

    for (const source of sources) {
      try {
        const scraper = new RedditScraper(source.id, source.scrape_config);
        const result = await scraper.scrape();

        results.push({
          source: source.source_name,
          ...result
        });

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

      } catch (error: any) {
        console.error(`Error scraping ${source.source_name}:`, error);
        results.push({
          source: source.source_name,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('Scrape cron error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
