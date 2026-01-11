import { createClient } from '@supabase/supabase-js';

interface LegalCaseLawConfig {
  sources: ('justia' | 'cornell')[];
  topics: string[]; // ['trust law', 'estate planning', 'tax law', 'corporate law']
  keywords: string[];
  jurisdictions?: string[]; // ['federal', 'state', 'supreme-court']
  max_results_per_topic?: number;
}

interface LegalCase {
  title: string;
  url: string;
  citation?: string;
  court: string;
  decision_date?: string;
  summary: string;
  jurisdiction: string;
  source: 'justia' | 'cornell';
}

export class LegalCaseLawScraper {
  private sourceId: string;
  private config: LegalCaseLawConfig;

  constructor(sourceId: string, config: LegalCaseLawConfig) {
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
      for (const source of this.config.sources) {
        for (const topic of this.config.topics) {
          try {
            let cases: LegalCase[] = [];

            if (source === 'justia') {
              cases = await this.scrapeJustia(topic);
            } else if (source === 'cornell') {
              cases = await this.scrapeCornellLaw(topic);
            }

            for (const legalCase of cases) {
              const saved = await this.saveLegalCase(legalCase);
              if (saved) {
                results.leads++;
                results.new++;
              } else {
                results.duplicates++;
              }
            }

          } catch (err: any) {
            results.errors.push(`${source} - ${topic}: ${err.message}`);
          }
        }
      }

    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async scrapeJustia(topic: string): Promise<LegalCase[]> {
    const cases: LegalCase[] = [];
    const maxResults = this.config.max_results_per_topic || 50;

    try {
      // Justia case law search
      const searchUrl = `https://law.justia.com/search?q=${encodeURIComponent(topic)}&cx=004471346504245195276%3Ajieqepl7s5a`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Parse Justia search results
      const resultMatches = html.matchAll(
        /<div class="gsc-thumbnail-inside">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"[\s\S]*?<div class="gs-bidi-start-align gs-snippet">([^<]+)<\/div>/gi
      );

      for (const match of resultMatches) {
        const url = match[1];
        const title = this.stripHtml(match[2]);
        const summary = this.stripHtml(match[3]);

        // Extract case information
        const citation = this.extractCitation(title);
        const court = this.extractCourt(url, title);
        const jurisdiction = this.extractJurisdiction(url);

        if (this.matchesKeywords(title + ' ' + summary)) {
          cases.push({
            title,
            url,
            citation,
            court,
            summary,
            jurisdiction,
            source: 'justia'
          });
        }

        if (cases.length >= maxResults) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error('Justia scraping error:', error.message);
    }

    return cases;
  }

  private async scrapeCornellLaw(topic: string): Promise<LegalCase[]> {
    const cases: LegalCase[] = [];
    const maxResults = this.config.max_results_per_topic || 50;

    try {
      // Cornell LII search
      const searchUrl = `https://www.law.cornell.edu/search/site/${encodeURIComponent(topic)}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Parse Cornell search results
      const resultMatches = html.matchAll(
        /<h3 class="title">[\s\S]*?<a href="([^"]+)">([^<]+)<\/a>[\s\S]*?<p class="search-snippet[^"]*">([^<]+)<\/p>/gi
      );

      for (const match of resultMatches) {
        let url = match[1];
        const title = this.stripHtml(match[2]);
        const summary = this.stripHtml(match[3]);

        if (!url.startsWith('http')) {
          url = `https://www.law.cornell.edu${url}`;
        }

        // Extract case information
        const citation = this.extractCitation(title);
        const court = this.extractCourt(url, title);
        const jurisdiction = this.extractJurisdiction(url);

        if (this.matchesKeywords(title + ' ' + summary)) {
          cases.push({
            title,
            url,
            citation,
            court,
            summary,
            jurisdiction,
            source: 'cornell'
          });
        }

        if (cases.length >= maxResults) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error('Cornell Law scraping error:', error.message);
    }

    return cases;
  }

  private extractCitation(title: string): string | undefined {
    // Common citation formats: "123 U.S. 456", "123 F.3d 456", etc.
    const citationMatch = title.match(/\d+\s+[A-Z][^\d]*\d+/);
    return citationMatch ? citationMatch[0] : undefined;
  }

  private extractCourt(url: string, title: string): string {
    // Extract court from URL or title
    if (url.includes('supreme-court')) return 'U.S. Supreme Court';
    if (url.includes('circuit')) return 'U.S. Circuit Court';
    if (url.includes('/us/')) return 'U.S. Supreme Court';
    if (title.includes('Supreme Court')) return 'U.S. Supreme Court';
    if (title.includes('Circuit')) return 'U.S. Circuit Court';
    if (title.includes('District')) return 'U.S. District Court';

    return 'Unknown Court';
  }

  private extractJurisdiction(url: string): string {
    if (url.includes('supreme-court') || url.includes('/us/')) return 'federal';
    if (url.includes('circuit') || url.includes('federal')) return 'federal';

    // State jurisdictions
    const states = ['ca', 'ny', 'tx', 'fl', 'il', 'pa', 'oh', 'ga', 'nc', 'mi'];
    for (const state of states) {
      if (url.includes(`/${state}/`) || url.includes(`-${state}-`)) {
        return state.toUpperCase();
      }
    }

    return 'federal';
  }

  private matchesKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.config.keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async saveLegalCase(legalCase: LegalCase): Promise<boolean> {
    const supabase = this.getSupabase();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('source_url', legalCase.url)
      .single();

    if (existing) {
      return false;
    }

    const { error } = await supabase
      .from('legal_documents')
      .insert({
        source_id: this.sourceId,
        source_type: 'case_law',
        document_type: 'case',
        title: legalCase.title,
        source_url: legalCase.url,
        content: legalCase.summary,
        citation: legalCase.citation,
        court: legalCase.court,
        jurisdiction: legalCase.jurisdiction,
        decision_date: legalCase.decision_date,
        keywords: this.config.keywords,
        status: 'new'
      });

    if (error) {
      console.error('Error saving legal case:', error);
      return false;
    }

    return true;
  }
}
