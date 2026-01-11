import { createClient } from '@supabase/supabase-js';

interface RedditPost {
  id: string;
  author: string;
  title: string;
  selftext: string;
  subreddit: string;
  created_utc: number;
  permalink: string;
  score: number;
  num_comments: number;
}

interface RedditConfig {
  subreddit: string;
  sort: 'new' | 'hot' | 'top';
  time_filter: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  keywords: string[];
  exclude_keywords: string[];
  min_karma: number;
  min_account_age_days: number;
}

interface ScrapeResult {
  leads: number;
  new: number;
  duplicates: number;
}

export class RedditScraper {
  private sourceId: string;
  private config: RedditConfig;

  constructor(sourceId: string, config: RedditConfig) {
    this.sourceId = sourceId;
    this.config = config;
  }

  private getSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async scrape(): Promise<ScrapeResult> {
    const runId = await this.startRun();

    try {
      // Fetch posts from Reddit (using public JSON API)
      const posts = await this.fetchPosts();

      let leadsFound = 0;
      let newLeads = 0;
      let duplicates = 0;

      for (const post of posts) {
        // Skip deleted/removed
        if (post.author === '[deleted]' || post.author === '[removed]') continue;

        // Check if matches keywords
        if (!this.matchesKeywords(post)) continue;

        // Check if excluded
        if (this.matchesExcludeKeywords(post)) continue;

        leadsFound++;

        // Check for duplicate
        const fingerprint = this.generateFingerprint('reddit', post.author);
        const existing = await this.checkDuplicate(fingerprint);

        if (existing) {
          duplicates++;
          continue;
        }

        // Get author info
        const authorInfo = await this.getAuthorInfo(post.author);

        // Check karma and account age
        if (authorInfo.karma < this.config.min_karma) continue;
        if (authorInfo.accountAgeDays < this.config.min_account_age_days) continue;

        // Extract info from post
        const extractedInfo = this.extractInfo(post, authorInfo);

        // Create lead
        await this.createLead({
          source_id: this.sourceId,
          source_type: 'reddit',
          source_identifier: post.author,
          source_url: `https://reddit.com${post.permalink}`,
          username: post.author,
          trigger_content: post.title + '\n\n' + post.selftext,
          trigger_keywords: this.findMatchedKeywords(post),
          fingerprint,
          ...extractedInfo
        });

        newLeads++;
      }

      await this.completeRun(runId, {
        items_scraped: posts.length,
        leads_found: leadsFound,
        leads_new: newLeads,
        leads_duplicate: duplicates
      });

      return { leads: leadsFound, new: newLeads, duplicates };

    } catch (error: any) {
      await this.failRun(runId, error.message);
      throw error;
    }
  }

  private async fetchPosts(): Promise<RedditPost[]> {
    // Increased from 100 to 1000 for 10X lead collection speed
    const url = `https://www.reddit.com/r/${this.config.subreddit}/${this.config.sort}.json?t=${this.config.time_filter}&limit=1000`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SovereigntyIntroAlignment/1.0 (Lead Discovery)'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.children.map((child: any) => child.data);
  }

  private async getAuthorInfo(username: string): Promise<{ karma: number; accountAgeDays: number }> {
    try {
      const url = `https://www.reddit.com/user/${username}/about.json`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SovereigntyIntroAlignment/1.0' }
      });

      if (!response.ok) {
        return { karma: 0, accountAgeDays: 0 };
      }

      const data = await response.json();
      const created = data.data.created_utc;
      const karma = data.data.link_karma + data.data.comment_karma;
      const accountAgeDays = Math.floor((Date.now() / 1000 - created) / 86400);

      return { karma, accountAgeDays };
    } catch {
      return { karma: 0, accountAgeDays: 0 };
    }
  }

  private matchesKeywords(post: RedditPost): boolean {
    const content = (post.title + ' ' + post.selftext).toLowerCase();
    return this.config.keywords.some(kw => content.includes(kw.toLowerCase()));
  }

  private matchesExcludeKeywords(post: RedditPost): boolean {
    if (!this.config.exclude_keywords?.length) return false;
    const content = (post.title + ' ' + post.selftext).toLowerCase();
    return this.config.exclude_keywords.some(kw => content.includes(kw.toLowerCase()));
  }

  private findMatchedKeywords(post: RedditPost): string[] {
    const content = (post.title + ' ' + post.selftext).toLowerCase();
    return this.config.keywords.filter(kw => content.includes(kw.toLowerCase()));
  }

  private extractInfo(post: RedditPost, authorInfo: any): any {
    const content = post.title + ' ' + post.selftext;

    // Try to extract age (common patterns: "32M", "I'm 28", "28F")
    const agePatterns = [
      /\b(\d{2})[mfMF]\b/,
      /\b(?:I'm|I am|im)\s*(\d{2})\b/i,
      /\b(\d{2})\s*(?:year|yr)s?\s*old\b/i
    ];

    let estimatedAge: string | null = null;
    for (const pattern of agePatterns) {
      const match = content.match(pattern);
      if (match) {
        estimatedAge = match[1];
        break;
      }
    }

    // Try to extract gender
    const genderMatch = content.match(/\b(\d{2})([mfMF])\b/);
    const estimatedGender = genderMatch
      ? (genderMatch[2].toLowerCase() === 'm' ? 'male' : 'female')
      : null;

    // Try to extract location
    const locationPatterns = [
      /\b(?:from|in|live in|living in|based in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/i,
      /\b([A-Z][a-z]+,\s*[A-Z]{2})\b/,
      /\b([A-Z]{2})\b/
    ];

    let location: string | null = null;
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        location = match[1];
        break;
      }
    }

    // Determine relationship goal
    let relationshipGoal = 'unknown';
    const seriousKeywords = /\b(serious|long.?term|marriage|settle down|life partner|forever|committed)\b/i;
    const casualKeywords = /\b(casual|hookup|fwb|fun|no strings)\b/i;

    if (seriousKeywords.test(content)) {
      relationshipGoal = 'serious';
    } else if (casualKeywords.test(content)) {
      relationshipGoal = 'casual';
    }

    return {
      estimated_age_range: estimatedAge ? `${estimatedAge}-${parseInt(estimatedAge) + 5}` : null,
      estimated_gender: estimatedGender,
      location_mentioned: location,
      relationship_goal: relationshipGoal
    };
  }

  private generateFingerprint(source: string, identifier: string): string {
    return `${source}:${identifier}`.toLowerCase();
  }

  private async checkDuplicate(fingerprint: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('fingerprint', fingerprint)
      .single();
    return !!data;
  }

  private async createLead(lead: any): Promise<void> {
    const supabase = this.getSupabase();
    await supabase.from('leads').insert(lead);
  }

  private async startRun(): Promise<string> {
    const supabase = this.getSupabase();
    const { data } = await supabase
      .from('scrape_runs')
      .insert({ source_id: this.sourceId, status: 'running' })
      .select('id')
      .single();
    return data!.id;
  }

  private async completeRun(runId: string, stats: any): Promise<void> {
    const supabase = this.getSupabase();
    await supabase
      .from('scrape_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ...stats
      })
      .eq('id', runId);

    // Update source stats
    await supabase.rpc('increment_source_leads', {
      source_id: this.sourceId,
      new_leads: stats.leads_new
    });
  }

  private async failRun(runId: string, error: string): Promise<void> {
    const supabase = this.getSupabase();
    await supabase
      .from('scrape_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error
      })
      .eq('id', runId);
  }
}
