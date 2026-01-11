import { createClient } from '@supabase/supabase-js';

interface WebScrapeConfig {
  search_engines: string[]; // 'google', 'bing', 'duckduckgo'
  keywords: string[];
  exclude_keywords?: string[];
  domains_to_scrape?: string[];
  max_results_per_engine?: number;
}

interface WebResult {
  url: string;
  title: string;
  snippet: string;
  source: string;
}

export class WebScraper {
  private sourceId: string;
  private config: WebScrapeConfig;

  constructor(sourceId: string, config: WebScrapeConfig) {
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
      const allResults: WebResult[] = [];

      // Search across all configured search engines
      for (const engine of this.config.search_engines) {
        for (const keyword of this.config.keywords) {
          try {
            const searchResults = await this.searchEngine(engine, keyword);
            allResults.push(...searchResults);
          } catch (err: any) {
            results.errors.push(`${engine} - ${keyword}: ${err.message}`);
          }
        }
      }

      // Process results and save leads
      for (const result of allResults) {
        if (this.meetsQualityThreshold(result)) {
          const saved = await this.saveLead(result);
          if (saved) {
            results.leads++;
            results.new++;
          } else {
            results.duplicates++;
          }
        }
      }
    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async searchEngine(engine: string, keyword: string): Promise<WebResult[]> {
    switch (engine) {
      case 'google':
        return this.searchGoogle(keyword);
      case 'bing':
        return this.searchBing(keyword);
      case 'duckduckgo':
        return this.searchDuckDuckGo(keyword);
      default:
        return [];
    }
  }

  private async searchGoogle(keyword: string): Promise<WebResult[]> {
    const results: WebResult[] = [];
    const maxResults = this.config.max_results_per_engine || 50;

    try {
      // Using Google Custom Search JSON API (requires API key)
      // For free tier, we'll use web scraping of Google search results
      const query = encodeURIComponent(keyword + ' dating relationship single looking for');
      const url = `https://www.google.com/search?q=${query}&num=${maxResults}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Parse Google search results
      // Google uses various div structures - look for result snippets
      const resultMatches = html.matchAll(
        /<a[^>]*href="\/url\?q=([^"&]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<div[^>]*>([^<]+)<\/div>/gi
      );

      for (const match of resultMatches) {
        let resultUrl = decodeURIComponent(match[1]);
        const title = this.stripHtml(match[2]);
        const snippet = this.stripHtml(match[3]);

        // Filter out Google's own pages
        if (resultUrl.includes('google.com')) continue;

        results.push({
          url: resultUrl,
          title,
          snippet,
          source: 'google'
        });

        if (results.length >= maxResults) break;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error('Google search error:', error.message);
    }

    return results;
  }

  private async searchBing(keyword: string): Promise<WebResult[]> {
    const results: WebResult[] = [];
    const maxResults = this.config.max_results_per_engine || 50;

    try {
      const query = encodeURIComponent(keyword + ' dating relationship single');
      const url = `https://www.bing.com/search?q=${query}&count=${maxResults}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Parse Bing results
      const resultMatches = html.matchAll(
        /<h2><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a><\/h2>[\s\S]*?<p[^>]*>([^<]+)<\/p>/gi
      );

      for (const match of resultMatches) {
        results.push({
          url: match[1],
          title: this.stripHtml(match[2]),
          snippet: this.stripHtml(match[3]),
          source: 'bing'
        });

        if (results.length >= maxResults) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error('Bing search error:', error.message);
    }

    return results;
  }

  private async searchDuckDuckGo(keyword: string): Promise<WebResult[]> {
    const results: WebResult[] = [];
    const maxResults = this.config.max_results_per_engine || 50;

    try {
      const query = encodeURIComponent(keyword + ' dating single relationship');
      const url = `https://html.duckduckgo.com/html/?q=${query}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Parse DuckDuckGo results
      const resultMatches = html.matchAll(
        /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([^<]+)<\/a>/gi
      );

      for (const match of resultMatches) {
        results.push({
          url: match[1],
          title: this.stripHtml(match[2]),
          snippet: this.stripHtml(match[3]),
          source: 'duckduckgo'
        });

        if (results.length >= maxResults) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error('DuckDuckGo search error:', error.message);
    }

    return results;
  }

  private meetsQualityThreshold(result: WebResult): boolean {
    const combined = (result.title + ' ' + result.snippet).toLowerCase();

    // Must match keywords
    const hasKeyword = this.config.keywords.some(kw =>
      combined.includes(kw.toLowerCase())
    );

    if (!hasKeyword) return false;

    // Filter out excluded keywords
    if (this.config.exclude_keywords) {
      const hasExcluded = this.config.exclude_keywords.some(kw =>
        combined.includes(kw.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    return true;
  }

  private async saveLead(result: WebResult): Promise<boolean> {
    const supabase = this.getSupabase();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('source_url', result.url)
      .single();

    if (existing) {
      return false;
    }

    const indicators = this.extractIndicators(result.title + ' ' + result.snippet);

    const { error } = await supabase
      .from('leads')
      .insert({
        source_id: this.sourceId,
        source_type: 'web',
        source_identifier: this.generateIdentifier(result.url),
        source_url: result.url,

        trigger_content: result.snippet,
        trigger_keywords: this.config.keywords.filter(k =>
          (result.title + ' ' + result.snippet).toLowerCase().includes(k.toLowerCase())
        ),

        estimated_age_range: indicators.ageRange,
        estimated_gender: indicators.gender,
        relationship_goal: indicators.relationshipGoal,

        status: 'new',
        outreach_status: 'pending'
      });

    if (error) {
      console.error('Error saving web lead:', error);
      return false;
    }

    return true;
  }

  private extractIndicators(text: string) {
    const lowerText = text.toLowerCase();

    let ageRange = null;
    if (lowerText.match(/\b(20s|twenties|25|26|27|28|29)\b/)) ageRange = '25-29';
    else if (lowerText.match(/\b(30s|thirties|early 30|30|31|32|33|34)\b/)) ageRange = '30-34';
    else if (lowerText.match(/\b(mid 30|35|36|37|38|39)\b/)) ageRange = '35-39';
    else if (lowerText.match(/\b(40s|forties|early 40|40|41|42|43|44)\b/)) ageRange = '40-44';
    else if (lowerText.match(/\b(mid 40|late 40|45|46|47|48|49)\b/)) ageRange = '45-49';
    else if (lowerText.match(/\b(50s|fifties|50|51|52|53|54)\b/)) ageRange = '50-54';

    let gender = null;
    if (lowerText.match(/\b(man|male|guy|m\d\d)\b/)) gender = 'male';
    else if (lowerText.match(/\b(woman|female|girl|f\d\d)\b/)) gender = 'female';

    let relationshipGoal = 'unknown';
    if (lowerText.match(/\b(serious relationship|long.?term|marriage|life partner|settle down)\b/)) {
      relationshipGoal = 'serious';
    } else if (lowerText.match(/\b(casual|hookup|fwb|friends with benefits)\b/)) {
      relationshipGoal = 'casual';
    }

    return { ageRange, gender, relationshipGoal };
  }

  private generateIdentifier(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/[^\w]/g, '_').substring(0, 100);
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
      .trim();
  }
}
