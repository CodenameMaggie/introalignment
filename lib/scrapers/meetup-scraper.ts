import { createClient } from '@supabase/supabase-js';

interface MeetupScrapeConfig {
  cities: string[];
  keywords: string[];
  exclude_keywords?: string[];
  event_categories?: string[];
}

interface MeetupEvent {
  url: string;
  title: string;
  description: string;
  organizer?: string;
  city: string;
  attendees?: number;
  eventDate?: string;
}

export class MeetupScraper {
  private sourceId: string;
  private config: MeetupScrapeConfig;

  constructor(sourceId: string, config: MeetupScrapeConfig) {
    this.sourceId = sourceId;
    this.config = config;
  }

  private getSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async scrape() {
    const results = {
      leads: 0,
      new: 0,
      duplicates: 0,
      errors: [] as string[]
    };

    try {
      for (const city of this.config.cities) {
        try {
          const events = await this.scrapeCityEvents(city);

          for (const event of events) {
            if (this.meetsQualityThreshold(event)) {
              const saved = await this.saveLead(event);
              if (saved) {
                results.leads++;
                results.new++;
              } else {
                results.duplicates++;
              }
            }
          }
        } catch (err: any) {
          results.errors.push(`${city}: ${err.message}`);
        }
      }
    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async scrapeCityEvents(city: string): Promise<MeetupEvent[]> {
    const events: MeetupEvent[] = [];

    try {
      // Build search URLs for singles/dating events in the city
      const searchTerms = ['singles', 'dating', 'relationships', 'matchmaking'];

      for (const term of searchTerms) {
        const searchUrl = `https://www.meetup.com/find/?keywords=${encodeURIComponent(term)}&location=${encodeURIComponent(city)}`;

        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });

        if (!response.ok) {
          continue; // Skip this search term
        }

        const html = await response.text();
        const parsedEvents = this.parseMeetupPage(html, city);
        events.push(...parsedEvents);
      }

      // Remove duplicates
      const uniqueEvents = events.filter((event, index, self) =>
        index === self.findIndex((e) => e.url === event.url)
      );

      return uniqueEvents.slice(0, 100);

    } catch (error: any) {
      throw new Error(`Failed to scrape ${city}: ${error.message}`);
    }
  }

  private parseMeetupPage(html: string, city: string): MeetupEvent[] {
    const events: MeetupEvent[] = [];

    // Meetup group links
    const groupMatches = html.matchAll(
      /<a[^>]*href="(https:\/\/www\.meetup\.com\/[^"\/]+\/?)"[^>]*>([^<]+)<\/a>/gi
    );

    for (const match of groupMatches) {
      const url = match[1];
      const title = this.decodeHtmlEntities(match[2]);

      // Skip navigation links
      if (title.length < 10) continue;
      if (url.includes('/login') || url.includes('/register')) continue;

      if (this.matchesKeywords(title)) {
        events.push({
          url,
          title,
          description: title,
          city,
          attendees: 0
        });
      }
    }

    // Event-specific links
    const eventMatches = html.matchAll(
      /<a[^>]*href="(https:\/\/www\.meetup\.com\/[^"]+\/events\/[^"]+)"[^>]*>([^<]+)<\/a>/gi
    );

    for (const match of eventMatches) {
      const url = match[1];
      const title = this.decodeHtmlEntities(match[2]);

      if (title.length < 10) continue;

      if (this.matchesKeywords(title)) {
        events.push({
          url,
          title,
          description: title,
          city,
          attendees: 0
        });
      }
    }

    return events;
  }

  private matchesKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();

    const hasKeyword = this.config.keywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (!hasKeyword) return false;

    if (this.config.exclude_keywords) {
      const hasExcluded = this.config.exclude_keywords.some(keyword =>
        lowerText.includes(keyword.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    return true;
  }

  private meetsQualityThreshold(event: MeetupEvent): boolean {
    if (event.title.length < 15) return false;

    return this.matchesKeywords(event.title + ' ' + event.description);
  }

  private async saveLead(event: MeetupEvent): Promise<boolean> {
    const supabase = this.getSupabase();
    // Check for duplicates
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('source_url', event.url)
      .single();

    if (existing) {
      return false;
    }

    const indicators = this.extractIndicators(event.title + ' ' + event.description);

    const { error } = await supabase
      .from('leads')
      .insert({
        source_id: this.sourceId,
        source_type: 'meetup',
        source_identifier: event.url.split('/').pop()?.split('?')[0],
        source_url: event.url,

        display_name: event.organizer || null,
        location_mentioned: event.city,

        trigger_content: event.description || event.title,
        trigger_keywords: this.config.keywords.filter(k =>
          (event.title + ' ' + event.description).toLowerCase().includes(k.toLowerCase())
        ),

        estimated_age_range: indicators.ageRange,
        relationship_goal: 'serious', // Meetup attendees are generally serious

        status: 'new',
        outreach_status: 'pending'
      });

    if (error) {
      console.error('Error saving Meetup lead:', error);
      return false;
    }

    return true;
  }

  private extractIndicators(text: string) {
    const lowerText = text.toLowerCase();

    let ageRange = null;
    // Meetup often specifies age ranges in event titles
    if (lowerText.match(/\b(20s|twenties|20.?30|25.?35)\b/)) ageRange = '25-34';
    else if (lowerText.match(/\b(30s|thirties|30.?40|35.?45)\b/)) ageRange = '35-44';
    else if (lowerText.match(/\b(40s|forties|40.?50|45.?55)\b/)) ageRange = '45-54';
    else if (lowerText.match(/\b(50s|fifties|50.?60|over 50)\b/)) ageRange = '50-60';
    else if (lowerText.match(/\b(young professionals?|under 35)\b/)) ageRange = '25-34';
    else if (lowerText.match(/\b(mature|established|over 40)\b/)) ageRange = '40-54';

    return { ageRange };
  }

  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&nbsp;': ' ',
      '&rsquo;': "'",
      '&lsquo;': "'",
      '&rdquo;': '"',
      '&ldquo;': '"'
    };

    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
  }
}
