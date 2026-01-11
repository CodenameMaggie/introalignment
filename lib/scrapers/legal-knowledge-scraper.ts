import { createClient } from '@supabase/supabase-js';

interface LegalKnowledgeConfig {
  sources: ('cornell_wex' | 'nolo' | 'findlaw' | 'legal_dictionary')[];
  topics: string[]; // ['trust', 'estate', 'c-corp', 'tax-exempt', 'asset protection']
  keywords: string[];
  max_results_per_topic?: number;
}

interface LegalKnowledgeEntry {
  title: string;
  url: string;
  content: string;
  topic: string;
  source: string;
  entry_type: 'definition' | 'guide' | 'article' | 'FAQ';
  last_updated?: string;
}

export class LegalKnowledgeScraper {
  private sourceId: string;
  private config: LegalKnowledgeConfig;

  constructor(sourceId: string, config: LegalKnowledgeConfig) {
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
            let entries: LegalKnowledgeEntry[] = [];

            switch (source) {
              case 'cornell_wex':
                entries = await this.scrapeCornellWex(topic);
                break;
              case 'nolo':
                entries = await this.scrapeNolo(topic);
                break;
              case 'findlaw':
                entries = await this.scrapeFindLaw(topic);
                break;
              case 'legal_dictionary':
                entries = await this.scrapeLegalDictionary(topic);
                break;
            }

            for (const entry of entries) {
              const saved = await this.saveLegalKnowledge(entry);
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

  private async scrapeCornellWex(topic: string): Promise<LegalKnowledgeEntry[]> {
    const entries: LegalKnowledgeEntry[] = [];

    try {
      // Cornell Legal Information Institute - Wex Legal Dictionary
      const searchUrl = `https://www.law.cornell.edu/wex/${encodeURIComponent(topic.replace(/\s+/g, '_'))}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });

      if (response.ok) {
        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        const title = titleMatch ? this.stripHtml(titleMatch[1]) : topic;

        // Extract main content
        const contentMatch = html.match(/<div class="content">([\s\S]*?)<\/div>/);
        const content = contentMatch ? this.stripHtml(contentMatch[1]).substring(0, 2000) : '';

        if (this.matchesKeywords(title + ' ' + content)) {
          entries.push({
            title: `Wex: ${title}`,
            url: searchUrl,
            content,
            topic,
            source: 'Cornell Wex',
            entry_type: 'definition'
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error: any) {
      console.error('Cornell Wex scraping error:', error.message);
    }

    return entries;
  }

  private async scrapeNolo(topic: string): Promise<LegalKnowledgeEntry[]> {
    const entries: LegalKnowledgeEntry[] = [];
    const maxResults = this.config.max_results_per_topic || 20;

    try {
      // Nolo legal encyclopedia search
      const searchUrl = `https://www.nolo.com/search?q=${encodeURIComponent(topic)}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        return entries;
      }

      const html = await response.text();

      // Parse Nolo search results
      const resultMatches = html.matchAll(
        /<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<p[^>]*>([^<]+)<\/p>/gi
      );

      for (const match of resultMatches) {
        let url = match[1];
        const title = this.stripHtml(match[2]);
        const content = this.stripHtml(match[3]);

        if (!url.startsWith('http')) {
          url = `https://www.nolo.com${url}`;
        }

        if (this.matchesKeywords(title + ' ' + content)) {
          entries.push({
            title,
            url,
            content,
            topic,
            source: 'Nolo',
            entry_type: 'article'
          });
        }

        if (entries.length >= maxResults) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error('Nolo scraping error:', error.message);
    }

    return entries;
  }

  private async scrapeFindLaw(topic: string): Promise<LegalKnowledgeEntry[]> {
    const entries: LegalKnowledgeEntry[] = [];
    const maxResults = this.config.max_results_per_topic || 20;

    try {
      // FindLaw search
      const searchUrl = `https://www.findlaw.com/search?q=${encodeURIComponent(topic)}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        return entries;
      }

      const html = await response.text();

      // Parse FindLaw search results
      const resultMatches = html.matchAll(
        /<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/gi
      );

      for (const match of resultMatches) {
        let url = match[1];
        const title = this.stripHtml(match[2]);
        const content = this.stripHtml(match[3]);

        if (!url.startsWith('http')) {
          url = `https://www.findlaw.com${url}`;
        }

        if (this.matchesKeywords(title + ' ' + content)) {
          entries.push({
            title,
            url,
            content,
            topic,
            source: 'FindLaw',
            entry_type: 'guide'
          });
        }

        if (entries.length >= maxResults) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error('FindLaw scraping error:', error.message);
    }

    return entries;
  }

  private async scrapeLegalDictionary(topic: string): Promise<LegalKnowledgeEntry[]> {
    const entries: LegalKnowledgeEntry[] = [];

    try {
      // Law.com Legal Dictionary
      const searchUrl = `https://dictionary.law.com/Default.aspx?selected=${encodeURIComponent(topic)}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });

      if (response.ok) {
        const html = await response.text();

        // Extract definition
        const defMatch = html.match(/<div[^>]*class="[^"]*definition[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        const content = defMatch ? this.stripHtml(defMatch[1]).substring(0, 2000) : '';

        if (content && this.matchesKeywords(topic + ' ' + content)) {
          entries.push({
            title: `Legal Definition: ${topic}`,
            url: searchUrl,
            content,
            topic,
            source: 'Law.com Dictionary',
            entry_type: 'definition'
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error: any) {
      console.error('Legal Dictionary scraping error:', error.message);
    }

    return entries;
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

  private async saveLegalKnowledge(entry: LegalKnowledgeEntry): Promise<boolean> {
    const supabase = this.getSupabase();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('source_url', entry.url)
      .single();

    if (existing) {
      return false;
    }

    const { error } = await supabase
      .from('legal_documents')
      .insert({
        source_id: this.sourceId,
        source_type: 'legal_knowledge',
        document_type: entry.entry_type,
        title: entry.title,
        source_url: entry.url,
        content: entry.content,
        topic: entry.topic,
        source: entry.source,
        last_updated: entry.last_updated,
        keywords: this.config.keywords,
        status: 'new'
      });

    if (error) {
      console.error('Error saving legal knowledge:', error);
      return false;
    }

    return true;
  }
}
