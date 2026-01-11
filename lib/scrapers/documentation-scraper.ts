/**
 * Free Documentation Scraper
 * Scrapes public documentation sites without AI dependency
 */

import { createClient } from '@supabase/supabase-js';

interface DocSource {
  name: string;
  url: string;
  selectors: {
    title?: string;
    content?: string;
    links?: string;
  };
}

export class DocumentationScraper {
  private getSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Scrape documentation from public sources
   * Uses fetch (free, no AI) to get HTML content
   */
  async scrapeDocumentation(
    botName: string,
    category: string,
    sources: DocSource[]
  ): Promise<number> {
    const supabase = this.getSupabase();
    let scraped = 0;

    // Get bot ID
    const { data: bot } = await supabase
      .from('ai_bot_health')
      .select('id')
      .eq('bot_name', botName)
      .single();

    if (!bot) {
      throw new Error(`Bot ${botName} not found`);
    }

    for (const source of sources) {
      try {
        console.log(`Scraping ${source.name}...`);

        // Fetch the page content (free, no API cost)
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'SovereigntyIntroAlignment/1.0 (Documentation Scraper)'
          }
        });

        if (!response.ok) {
          console.log(`Failed to fetch ${source.url}: ${response.status}`);
          continue;
        }

        const html = await response.text();

        // Extract text content (simple text extraction, no AI)
        const content = this.extractTextContent(html);
        const sections = this.splitIntoSections(content);

        // Store each section as knowledge
        for (const section of sections) {
          if (section.text.length < 50) continue; // Skip very short sections

          const keywords = this.extractKeywords(section.text);

          const { error } = await supabase.from('bot_knowledge').insert({
            bot_id: bot.id,
            category,
            topic: section.title || source.name,
            source_url: source.url,
            content: section.text,
            summary: this.createSummary(section.text),
            keywords,
            confidence_score: 0.75
          });

          if (!error) {
            scraped++;
          }
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
      }
    }

    return scraped;
  }

  /**
   * Extract plain text from HTML (no dependencies)
   */
  private extractTextContent(html: string): string {
    // Remove script and style tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  /**
   * Split content into logical sections
   */
  private splitIntoSections(content: string): Array<{ title: string; text: string }> {
    const sections: Array<{ title: string; text: string }> = [];

    // Split by common section indicators
    const parts = content.split(/(?:\n\n|\.(?:\s{2,}|\n))/);

    let currentSection = { title: '', text: '' };

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length === 0) continue;

      // Check if this looks like a heading (short, starts with capital)
      if (trimmed.length < 100 && /^[A-Z]/.test(trimmed) && !/[.!?]$/.test(trimmed)) {
        if (currentSection.text.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { title: trimmed, text: '' };
      } else {
        currentSection.text += (currentSection.text ? ' ' : '') + trimmed;
      }
    }

    if (currentSection.text.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract keywords from text (simple, no AI)
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const wordFreq: Record<string, number> = {};

    // Common stop words to exclude
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    // Count word frequency
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    // Get top keywords
    const sorted = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return sorted;
  }

  /**
   * Create simple summary (first 200 chars)
   */
  private createSummary(text: string): string {
    const summary = text.substring(0, 200).trim();
    return summary + (text.length > 200 ? '...' : '');
  }

  /**
   * Scrape free government and public documentation
   */
  async scrapeFreeResources(botName: string, category: string): Promise<number> {
    const sources: DocSource[] = [];

    if (category === 'accounting_finance') {
      sources.push(
        {
          name: 'IRS Small Business Guide',
          url: 'https://www.irs.gov/businesses/small-businesses-self-employed',
          selectors: {}
        },
        {
          name: 'SBA Business Guide',
          url: 'https://www.sba.gov/business-guide/launch-your-business',
          selectors: {}
        },
        {
          name: 'IRS Tax Info for Businesses',
          url: 'https://www.irs.gov/businesses',
          selectors: {}
        }
      );
    } else if (category === 'organization_management') {
      sources.push(
        {
          name: 'Project Management Guide',
          url: 'https://www.pmi.org/learning/library',
          selectors: {}
        },
        {
          name: 'Business Management Best Practices',
          url: 'https://www.sba.gov/business-guide/manage-your-business',
          selectors: {}
        }
      );
    } else if (category === 'legal_compliance') {
      sources.push(
        {
          name: 'FTC Business Guidance',
          url: 'https://www.ftc.gov/business-guidance',
          selectors: {}
        },
        {
          name: 'Privacy & Data Protection',
          url: 'https://www.ftc.gov/business-guidance/privacy-security',
          selectors: {}
        }
      );
    }

    return await this.scrapeDocumentation(botName, category, sources);
  }
}
