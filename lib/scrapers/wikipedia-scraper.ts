import { createClient } from '@supabase/supabase-js';

interface WikipediaScrapeConfig {
  categories: string[]; // Wikipedia categories to scrape
  keywords: string[];
  exclude_keywords?: string[];
  languages?: string[]; // ['en', 'es', 'fr', etc.]
}

interface WikipediaArticle {
  title: string;
  url: string;
  content: string;
  categories: string[];
}

export class WikipediaScraper {
  private sourceId: string;
  private config: WikipediaScrapeConfig;

  constructor(sourceId: string, config: WikipediaScrapeConfig) {
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
      const languages = this.config.languages || ['en'];

      for (const lang of languages) {
        for (const category of this.config.categories) {
          try {
            const articles = await this.scrapeCategoryArticles(lang, category);

            for (const article of articles) {
              if (this.meetsQualityThreshold(article)) {
                const saved = await this.saveLead(article, lang);
                if (saved) {
                  results.leads++;
                  results.new++;
                } else {
                  results.duplicates++;
                }
              }
            }
          } catch (err: any) {
            results.errors.push(`${lang}:${category} - ${err.message}`);
          }
        }
      }
    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async scrapeCategoryArticles(lang: string, category: string): Promise<WikipediaArticle[]> {
    const articles: WikipediaArticle[] = [];

    try {
      // Use Wikipedia API to get articles in a category
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(category)}&cmlimit=100&format=json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SovereigntyIntroAlignment/1.0 (Dating Platform Lead Discovery)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.query || !data.query.categorymembers) {
        return articles;
      }

      // Fetch content for each article
      for (const member of data.query.categorymembers) {
        if (articles.length >= 50) break; // Limit to 50 articles per category

        try {
          const articleData = await this.fetchArticleContent(lang, member.title);
          if (articleData) {
            articles.push(articleData);
          }
        } catch (err) {
          console.error(`Error fetching article ${member.title}:`, err);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error: any) {
      throw new Error(`Failed to scrape category ${category}: ${error.message}`);
    }

    return articles;
  }

  private async fetchArticleContent(lang: string, title: string): Promise<WikipediaArticle | null> {
    try {
      // Use Wikipedia API to get article extract
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts|categories&exintro=1&format=json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SovereigntyIntroAlignment/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.query || !data.query.pages) {
        return null;
      }

      const pageId = Object.keys(data.query.pages)[0];
      const page = data.query.pages[pageId];

      if (!page.extract) {
        return null;
      }

      const categories = page.categories?.map((cat: any) => cat.title) || [];

      return {
        title: page.title,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        content: this.stripHtml(page.extract),
        categories
      };

    } catch (error) {
      return null;
    }
  }

  private async searchWikipedia(lang: string, query: string): Promise<WikipediaArticle[]> {
    const articles: WikipediaArticle[] = [];

    try {
      // Use Wikipedia search API
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=50&format=json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SovereigntyIntroAlignment/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.query || !data.query.search) {
        return articles;
      }

      for (const result of data.query.search) {
        const articleData = await this.fetchArticleContent(lang, result.title);
        if (articleData) {
          articles.push(articleData);
        }

        if (articles.length >= 30) break;

        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error: any) {
      console.error('Wikipedia search error:', error.message);
    }

    return articles;
  }

  private meetsQualityThreshold(article: WikipediaArticle): boolean {
    const combined = (article.title + ' ' + article.content).toLowerCase();

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

    return article.content.length > 100;
  }

  private async saveLead(article: WikipediaArticle, lang: string): Promise<boolean> {
    const supabase = this.getSupabase();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('source_url', article.url)
      .single();

    if (existing) {
      return false;
    }

    const indicators = this.extractIndicators(article.title + ' ' + article.content);

    const { error } = await supabase
      .from('leads')
      .insert({
        source_id: this.sourceId,
        source_type: 'wikipedia',
        source_identifier: article.title.replace(/[^\w]/g, '_'),
        source_url: article.url,

        trigger_content: article.content.substring(0, 1000),
        trigger_keywords: this.config.keywords.filter(k =>
          (article.title + ' ' + article.content).toLowerCase().includes(k.toLowerCase())
        ),

        estimated_age_range: indicators.ageRange,
        estimated_gender: indicators.gender,
        relationship_goal: indicators.relationshipGoal,

        status: 'new',
        outreach_status: 'pending'
      });

    if (error) {
      console.error('Error saving Wikipedia lead:', error);
      return false;
    }

    return true;
  }

  private extractIndicators(text: string) {
    const lowerText = text.toLowerCase();

    let ageRange = null;
    if (lowerText.match(/\b(20s|twenties|young adult)\b/)) ageRange = '25-29';
    else if (lowerText.match(/\b(30s|thirties|middle.?aged)\b/)) ageRange = '30-39';
    else if (lowerText.match(/\b(40s|forties)\b/)) ageRange = '40-49';
    else if (lowerText.match(/\b(50s|fifties|senior)\b/)) ageRange = '50-60';

    let gender = null;
    if (lowerText.match(/\b(men|male|man)\b/)) gender = 'male';
    else if (lowerText.match(/\b(women|female|woman)\b/)) gender = 'female';

    let relationshipGoal = 'unknown';
    if (lowerText.match(/\b(marriage|long.?term relationship|commitment|partnership)\b/)) {
      relationshipGoal = 'serious';
    } else if (lowerText.match(/\b(casual|dating|hookup)\b/)) {
      relationshipGoal = 'casual';
    }

    return { ageRange, gender, relationshipGoal };
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
