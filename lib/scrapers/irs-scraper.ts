import { createClient } from '@supabase/supabase-js';

interface IRSScrapeConfig {
  form_types: string[]; // ['1041', '706', '709', 'SS-4', etc.]
  topics: string[]; // ['trusts', 'estates', 'c-corps', 'tax-exemption']
  keywords: string[];
  publications?: string[]; // ['Pub 559', 'Pub 542', etc.]
}

interface IRSDocument {
  title: string;
  url: string;
  form_number?: string;
  publication_number?: string;
  content: string;
  document_type: 'form' | 'instruction' | 'publication' | 'guidance';
  year?: string;
}

export class IRSScraper {
  private sourceId: string;
  private config: IRSScrapeConfig;

  constructor(sourceId: string, config: IRSScrapeConfig) {
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
      // Scrape IRS forms
      for (const formType of this.config.form_types) {
        try {
          const forms = await this.scrapeIRSForm(formType);
          for (const form of forms) {
            const saved = await this.saveLegalDocument(form);
            if (saved) {
              results.leads++;
              results.new++;
            } else {
              results.duplicates++;
            }
          }
        } catch (err: any) {
          results.errors.push(`Form ${formType}: ${err.message}`);
        }
      }

      // Scrape IRS publications
      if (this.config.publications) {
        for (const pubNumber of this.config.publications) {
          try {
            const pub = await this.scrapeIRSPublication(pubNumber);
            if (pub) {
              const saved = await this.saveLegalDocument(pub);
              if (saved) {
                results.leads++;
                results.new++;
              } else {
                results.duplicates++;
              }
            }
          } catch (err: any) {
            results.errors.push(`Pub ${pubNumber}: ${err.message}`);
          }
        }
      }

      // Scrape IRS guidance by topic
      for (const topic of this.config.topics) {
        try {
          const guidance = await this.scrapeIRSGuidance(topic);
          for (const doc of guidance) {
            const saved = await this.saveLegalDocument(doc);
            if (saved) {
              results.leads++;
              results.new++;
            } else {
              results.duplicates++;
            }
          }
        } catch (err: any) {
          results.errors.push(`Topic ${topic}: ${err.message}`);
        }
      }

    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async scrapeIRSForm(formNumber: string): Promise<IRSDocument[]> {
    const documents: IRSDocument[] = [];

    try {
      // IRS Forms page URL
      const formUrl = `https://www.irs.gov/forms-pubs/about-form-${formNumber}`;

      const response = await fetch(formUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (!response.ok) {
        // Try alternate URL format
        const altUrl = `https://www.irs.gov/pub/irs-pdf/f${formNumber}.pdf`;
        documents.push({
          title: `Form ${formNumber}`,
          url: altUrl,
          form_number: formNumber,
          content: `IRS Form ${formNumber} - Tax form for trusts, estates, or corporations`,
          document_type: 'form',
          year: new Date().getFullYear().toString()
        });
        return documents;
      }

      const html = await response.text();

      // Extract form links and instructions
      const pdfMatches = html.matchAll(/href="([^"]*(?:f|i)${formNumber}[^"]*\.pdf)"/gi);

      for (const match of pdfMatches) {
        let pdfUrl = match[1];
        if (!pdfUrl.startsWith('http')) {
          pdfUrl = `https://www.irs.gov${pdfUrl}`;
        }

        const isInstruction = pdfUrl.includes('/i' + formNumber) || pdfUrl.includes('instructions');

        documents.push({
          title: isInstruction ? `Form ${formNumber} Instructions` : `Form ${formNumber}`,
          url: pdfUrl,
          form_number: formNumber,
          content: `IRS ${isInstruction ? 'Instructions for' : ''} Form ${formNumber}`,
          document_type: isInstruction ? 'instruction' : 'form',
          year: this.extractYear(pdfUrl) || new Date().getFullYear().toString()
        });
      }

      // If no PDFs found, add main page
      if (documents.length === 0) {
        documents.push({
          title: `Form ${formNumber} Information`,
          url: formUrl,
          form_number: formNumber,
          content: this.extractTextFromHtml(html),
          document_type: 'guidance',
          year: new Date().getFullYear().toString()
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting

    } catch (error: any) {
      console.error(`Error scraping form ${formNumber}:`, error.message);
    }

    return documents;
  }

  private async scrapeIRSPublication(pubNumber: string): Promise<IRSDocument | null> {
    try {
      const pubUrl = `https://www.irs.gov/pub/irs-pdf/p${pubNumber}.pdf`;

      // Check if publication exists
      const response = await fetch(pubUrl, { method: 'HEAD' });

      if (!response.ok) {
        return null;
      }

      return {
        title: `IRS Publication ${pubNumber}`,
        url: pubUrl,
        publication_number: pubNumber,
        content: `IRS Publication ${pubNumber} - Tax guidance publication`,
        document_type: 'publication',
        year: new Date().getFullYear().toString()
      };

    } catch (error) {
      return null;
    }
  }

  private async scrapeIRSGuidance(topic: string): Promise<IRSDocument[]> {
    const documents: IRSDocument[] = [];

    try {
      // Search IRS website for topic
      const searchUrl = `https://www.irs.gov/site-index-search?search=${encodeURIComponent(topic)}`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        return documents;
      }

      const html = await response.text();

      // Extract guidance links
      const linkMatches = html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi);

      for (const match of linkMatches) {
        let url = match[1];
        const title = this.stripHtml(match[2]);

        // Only include relevant IRS pages
        if (!url.includes('irs.gov')) continue;
        if (title.length < 10) continue;

        if (!url.startsWith('http')) {
          url = `https://www.irs.gov${url}`;
        }

        // Check if title matches keywords
        if (this.matchesKeywords(title)) {
          documents.push({
            title,
            url,
            content: title,
            document_type: 'guidance'
          });
        }

        if (documents.length >= 20) break; // Limit results
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error(`Error scraping guidance for ${topic}:`, error.message);
    }

    return documents;
  }

  private matchesKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.config.keywords.some(kw => lowerText.includes(kw.toLowerCase()));
  }

  private extractYear(url: string): string | null {
    const yearMatch = url.match(/20\d{2}/);
    return yearMatch ? yearMatch[0] : null;
  }

  private extractTextFromHtml(html: string): string {
    // Remove scripts and styles
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Extract main content
    const contentMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (contentMatch) {
      text = contentMatch[1];
    }

    // Strip HTML tags
    text = this.stripHtml(text);

    return text.substring(0, 2000); // Limit to 2000 chars
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

  private async saveLegalDocument(doc: IRSDocument): Promise<boolean> {
    const supabase = this.getSupabase();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('source_url', doc.url)
      .single();

    if (existing) {
      return false;
    }

    const { error } = await supabase
      .from('legal_documents')
      .insert({
        source_id: this.sourceId,
        source_type: 'irs',
        document_type: doc.document_type,
        title: doc.title,
        source_url: doc.url,
        content: doc.content,
        form_number: doc.form_number,
        publication_number: doc.publication_number,
        year: doc.year,
        keywords: this.config.keywords,
        status: 'new'
      });

    if (error) {
      console.error('Error saving IRS document:', error);
      return false;
    }

    return true;
  }
}
