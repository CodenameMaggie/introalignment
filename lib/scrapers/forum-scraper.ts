import { createClient } from '@supabase/supabase-js';

interface ForumScrapeConfig {
  forum_url: string;
  forum_type: 'loveshack' | 'enotalone' | 'talkaboutmarriage' | 'generic';
  board_urls: string[];
  keywords: string[];
  exclude_keywords?: string[];
  min_post_length?: number;
}

interface ForumPost {
  url: string;
  title: string;
  author: string;
  content: string;
  postDate?: string;
  replies?: number;
}

export class ForumScraper {
  private sourceId: string;
  private config: ForumScrapeConfig;

  constructor(sourceId: string, config: ForumScrapeConfig) {
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
      for (const boardUrl of this.config.board_urls) {
        try {
          const posts = await this.scrapeBoard(boardUrl);

          for (const post of posts) {
            if (this.meetsQualityThreshold(post)) {
              const saved = await this.saveLead(post);
              if (saved) {
                results.leads++;
                results.new++;
              } else {
                results.duplicates++;
              }
            }
          }
        } catch (err: any) {
          results.errors.push(`${boardUrl}: ${err.message}`);
        }
      }
    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async scrapeBoard(boardUrl: string): Promise<ForumPost[]> {
    const posts: ForumPost[] = [];

    try {
      const response = await fetch(boardUrl, {
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

      // Parse based on forum type
      switch (this.config.forum_type) {
        case 'loveshack':
          return this.parseLoveShack(html, boardUrl);
        case 'enotalone':
          return this.parseENotAlone(html, boardUrl);
        case 'talkaboutmarriage':
          return this.parseTalkAboutMarriage(html, boardUrl);
        default:
          return this.parseGenericForum(html, boardUrl);
      }

    } catch (error: any) {
      throw new Error(`Failed to scrape board: ${error.message}`);
    }
  }

  private parseLoveShack(html: string, baseUrl: string): ForumPost[] {
    const posts: ForumPost[] = [];

    // LoveShack uses vBulletin forum software
    // Thread titles are in <a class="title" href="...">
    const threadMatches = html.matchAll(
      /<a[^>]*class="[^"]*title[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    );

    for (const match of threadMatches) {
      let url = match[1];
      if (!url.startsWith('http')) {
        url = new URL(url, baseUrl).href;
      }

      const title = this.decodeHtmlEntities(match[2]);

      if (this.matchesKeywords(title)) {
        posts.push({
          url,
          title,
          author: 'Unknown',
          content: title, // Use title as content preview
          replies: 0
        });
      }
    }

    return posts.slice(0, 100);
  }

  private parseENotAlone(html: string, baseUrl: string): ForumPost[] {
    const posts: ForumPost[] = [];

    // ENotAlone forum structure
    const threadMatches = html.matchAll(
      /<a[^>]*href="([^"]*showthread[^"]*)"[^>]*>([^<]+)<\/a>/gi
    );

    for (const match of threadMatches) {
      let url = match[1];
      if (!url.startsWith('http')) {
        url = new URL(url, baseUrl).href;
      }

      const title = this.decodeHtmlEntities(match[2]);

      if (this.matchesKeywords(title)) {
        posts.push({
          url,
          title,
          author: 'Unknown',
          content: title,
          replies: 0
        });
      }
    }

    return posts.slice(0, 100);
  }

  private parseTalkAboutMarriage(html: string, baseUrl: string): ForumPost[] {
    const posts: ForumPost[] = [];

    // Similar vBulletin structure
    const threadMatches = html.matchAll(
      /<a[^>]*href="([^"]*showthread[^"]*)"[^>]*title="([^"]*)"[^>]*>/gi
    );

    for (const match of threadMatches) {
      let url = match[1];
      if (!url.startsWith('http')) {
        url = new URL(url, baseUrl).href;
      }

      const title = this.decodeHtmlEntities(match[2]);

      if (this.matchesKeywords(title)) {
        posts.push({
          url,
          title,
          author: 'Unknown',
          content: title,
          replies: 0
        });
      }
    }

    return posts.slice(0, 20);
  }

  private parseGenericForum(html: string, baseUrl: string): ForumPost[] {
    const posts: ForumPost[] = [];

    // Generic forum thread detection
    const linkMatches = html.matchAll(
      /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    );

    for (const match of linkMatches) {
      let url = match[1];
      const title = this.decodeHtmlEntities(match[2]);

      // Skip navigation/meta links
      if (title.length < 15) continue;
      if (url.includes('login') || url.includes('register')) continue;

      if (!url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }

      if (this.matchesKeywords(title)) {
        posts.push({
          url,
          title,
          author: 'Unknown',
          content: title,
          replies: 0
        });
      }
    }

    return posts.slice(0, 100);
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

  private meetsQualityThreshold(post: ForumPost): boolean {
    const minLength = this.config.min_post_length || 30;
    if (post.title.length < minLength) return false;

    return this.matchesKeywords(post.title + ' ' + post.content);
  }

  private async saveLead(post: ForumPost): Promise<boolean> {
    const supabase = this.getSupabase();
    // Check for duplicates
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('source_url', post.url)
      .single();

    if (existing) {
      return false;
    }

    const indicators = this.extractIndicators(post.title + ' ' + post.content);

    const { error } = await supabase
      .from('leads')
      .insert({
        source_id: this.sourceId,
        source_type: 'forum',
        source_identifier: post.url.split('/').pop()?.split('?')[0],
        source_url: post.url,

        username: post.author,
        display_name: post.author,

        trigger_content: post.content || post.title,
        trigger_keywords: this.config.keywords.filter(k =>
          (post.title + ' ' + post.content).toLowerCase().includes(k.toLowerCase())
        ),

        estimated_age_range: indicators.ageRange,
        estimated_gender: indicators.gender,
        relationship_goal: indicators.relationshipGoal,

        status: 'new',
        outreach_status: 'pending'
      });

    if (error) {
      console.error('Error saving forum lead:', error);
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
    else if (lowerText.match(/\b(55|56|57|58|59|60)\b/)) ageRange = '55-60';

    let gender = null;
    if (lowerText.match(/\b(i'm a man|i'm a guy|male|m\d\d|husband|boyfriend)\b/)) gender = 'male';
    else if (lowerText.match(/\b(i'm a woman|i'm a girl|female|f\d\d|wife|girlfriend)\b/)) gender = 'female';

    let relationshipGoal = 'unknown';
    if (lowerText.match(/\b(serious relationship|long.?term|marriage|life partner|settle down|committed)\b/)) {
      relationshipGoal = 'serious';
    } else if (lowerText.match(/\b(casual|hookup|fwb|friends with benefits)\b/)) {
      relationshipGoal = 'casual';
    }

    return { ageRange, gender, relationshipGoal };
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
