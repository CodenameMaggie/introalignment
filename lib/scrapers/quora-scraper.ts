import { createClient } from '@supabase/supabase-js';

interface QuoraScrapeConfig {
  topics: string[];
  keywords: string[];
  exclude_keywords?: string[];
  min_answer_length?: number;
}

interface QuoraQuestion {
  url: string;
  question: string;
  asker?: string;
  answers: number;
  followers: number;
  content?: string;
}

export class QuoraScraper {
  private sourceId: string;
  private config: QuoraScrapeConfig;

  constructor(sourceId: string, config: QuoraScrapeConfig) {
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
      // Scrape each topic
      for (const topic of this.config.topics) {
        try {
          const questions = await this.scrapeTopicQuestions(topic);

          for (const question of questions) {
            if (this.meetsQualityThreshold(question)) {
              const saved = await this.saveLead(question, topic);
              if (saved) {
                results.leads++;
                results.new++;
              } else {
                results.duplicates++;
              }
            }
          }
        } catch (err: any) {
          results.errors.push(`${topic}: ${err.message}`);
        }
      }
    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async scrapeTopicQuestions(topic: string): Promise<QuoraQuestion[]> {
    const questions: QuoraQuestion[] = [];

    // Quora topic URL structure
    const topicUrl = `https://www.quora.com/topic/${topic.replace(/\s+/g, '-')}`;

    try {
      // Fetch topic page
      const response = await fetch(topicUrl, {
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

      // Extract questions from HTML
      // Quora's HTML structure: look for question links and metadata
      const questionMatches = html.matchAll(
        /<a[^>]*class="[^"]*question[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
      );

      for (const match of questionMatches) {
        const url = match[1].startsWith('http') ? match[1] : `https://www.quora.com${match[1]}`;
        const question = this.decodeHtmlEntities(match[2]);

        // Check if question matches keywords
        if (this.matchesKeywords(question)) {
          questions.push({
            url,
            question,
            answers: 0,
            followers: 0
          });
        }
      }

      // Limit to prevent overload
      return questions.slice(0, 20);

    } catch (error: any) {
      throw new Error(`Failed to scrape ${topic}: ${error.message}`);
    }
  }

  private matchesKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Must contain at least one keyword
    const hasKeyword = this.config.keywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (!hasKeyword) return false;

    // Must not contain excluded keywords
    if (this.config.exclude_keywords) {
      const hasExcluded = this.config.exclude_keywords.some(keyword =>
        lowerText.includes(keyword.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    return true;
  }

  private meetsQualityThreshold(question: QuoraQuestion): boolean {
    // Question should be substantial
    if (question.question.length < 20) return false;

    // Should match our keywords
    return this.matchesKeywords(question.question);
  }

  private async saveLead(question: QuoraQuestion, topic: string): Promise<boolean> {
    const supabase = this.getSupabase();
    // Check for duplicates
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('source_url', question.url)
      .single();

    if (existing) {
      return false; // Duplicate
    }

    // Extract potential indicators
    const indicators = this.extractIndicators(question.question);

    // Save lead
    const { error } = await supabase
      .from('leads')
      .insert({
        source_id: this.sourceId,
        source_type: 'quora',
        source_identifier: question.url.split('/').pop(),
        source_url: question.url,

        username: question.asker || null,

        trigger_content: question.question,
        trigger_keywords: this.config.keywords.filter(k =>
          question.question.toLowerCase().includes(k.toLowerCase())
        ),

        estimated_age_range: indicators.ageRange,
        estimated_gender: indicators.gender,
        relationship_goal: indicators.relationshipGoal,

        status: 'new',
        outreach_status: 'pending'
      });

    if (error) {
      console.error('Error saving Quora lead:', error);
      return false;
    }

    return true;
  }

  private extractIndicators(text: string) {
    const lowerText = text.toLowerCase();

    // Age indicators
    let ageRange = null;
    if (lowerText.match(/\b(20s|twenties|25|26|27|28|29)\b/)) ageRange = '25-29';
    else if (lowerText.match(/\b(30s|thirties|early 30|30|31|32|33|34)\b/)) ageRange = '30-34';
    else if (lowerText.match(/\b(mid 30|35|36|37|38|39)\b/)) ageRange = '35-39';
    else if (lowerText.match(/\b(40s|forties|early 40|40|41|42|43|44)\b/)) ageRange = '40-44';
    else if (lowerText.match(/\b(mid 40|late 40|45|46|47|48|49)\b/)) ageRange = '45-49';
    else if (lowerText.match(/\b(50s|fifties|50|51|52|53|54)\b/)) ageRange = '50-54';
    else if (lowerText.match(/\b(55|56|57|58|59|60)\b/)) ageRange = '55-60';

    // Gender indicators (loose)
    let gender = null;
    if (lowerText.match(/\b(i'm a man|i'm a guy|male|m\d\d)\b/)) gender = 'male';
    else if (lowerText.match(/\b(i'm a woman|i'm a girl|female|f\d\d)\b/)) gender = 'female';

    // Relationship goal
    let relationshipGoal = 'unknown';
    if (lowerText.match(/\b(serious relationship|long.?term|marriage|life partner|settle down)\b/)) {
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
      '&nbsp;': ' '
    };

    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
  }
}
