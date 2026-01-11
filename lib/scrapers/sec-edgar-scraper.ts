import { createClient } from '@supabase/supabase-js';

interface SECEdgarConfig {
  filing_types: string[]; // ['10-K', '8-K', 'S-1', 'DEF 14A', etc.]
  company_keywords: string[]; // ['trust', 'estate', 'tax', 'holding company']
  industries?: string[]; // ['Trust Management', 'Estate Services']
  keywords: string[];
  max_results_per_filing?: number;
}

interface SECFiling {
  company_name: string;
  cik: string;
  filing_type: string;
  filing_date: string;
  url: string;
  description: string;
  accession_number: string;
}

export class SECEdgarScraper {
  private sourceId: string;
  private config: SECEdgarConfig;

  constructor(sourceId: string, config: SECEdgarConfig) {
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
      // Search for companies by keywords
      for (const keyword of this.config.company_keywords) {
        try {
          const companies = await this.searchCompanies(keyword);

          // Get filings for each company
          for (const company of companies.slice(0, 10)) { // Limit to 10 companies per keyword
            for (const filingType of this.config.filing_types) {
              try {
                const filings = await this.getCompanyFilings(company.cik, filingType);

                for (const filing of filings) {
                  const saved = await this.saveSECFiling(filing);
                  if (saved) {
                    results.leads++;
                    results.new++;
                  } else {
                    results.duplicates++;
                  }
                }

              } catch (err: any) {
                results.errors.push(`${company.cik} ${filingType}: ${err.message}`);
              }
            }
          }

        } catch (err: any) {
          results.errors.push(`Keyword ${keyword}: ${err.message}`);
        }
      }

    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async searchCompanies(keyword: string): Promise<{ cik: string; name: string }[]> {
    const companies: { cik: string; name: string }[] = [];

    try {
      // SEC EDGAR company search
      const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(keyword)}&owner=exclude&action=getcompany`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'LegalTrustPlatform info@example.com', // SEC requires User-Agent with contact
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Parse company results
      const companyMatches = html.matchAll(
        /<td scope="row"><a href="\/cgi-bin\/browse-edgar\?action=getcompany&amp;CIK=(\d+)[^"]*">([^<]+)<\/a><\/td>/gi
      );

      for (const match of companyMatches) {
        const cik = match[1].padStart(10, '0'); // CIK should be 10 digits
        const name = this.stripHtml(match[2]);

        companies.push({ cik, name });

        if (companies.length >= 20) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // SEC rate limiting

    } catch (error: any) {
      console.error('SEC company search error:', error.message);
    }

    return companies;
  }

  private async getCompanyFilings(cik: string, filingType: string): Promise<SECFiling[]> {
    const filings: SECFiling[] = [];
    const maxResults = this.config.max_results_per_filing || 20;

    try {
      // SEC EDGAR filings URL
      const filingsUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${encodeURIComponent(filingType)}&dateb=&owner=exclude&count=100`;

      const response = await fetch(filingsUrl, {
        headers: {
          'User-Agent': 'LegalTrustPlatform info@example.com',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Extract company name
      const companyMatch = html.match(/<span class="companyName">([^<]+)/);
      const companyName = companyMatch ? this.stripHtml(companyMatch[1]) : 'Unknown';

      // Parse filing rows
      const filingMatches = html.matchAll(
        /<tr>[\s\S]*?<td[^>]*>(\d{4}-\d{2}-\d{2})<\/td>[\s\S]*?<td[^>]*><a[^>]*id="documentsbutton"[^>]*href="([^"]+)"[\s\S]*?<\/tr>/gi
      );

      for (const match of filingMatches) {
        const filingDate = match[1];
        let documentsUrl = match[2];

        if (!documentsUrl.startsWith('http')) {
          documentsUrl = `https://www.sec.gov${documentsUrl}`;
        }

        // Extract accession number from URL
        const accessionMatch = documentsUrl.match(/Accession-Number=(\d+-\d+-\d+)/);
        const accessionNumber = accessionMatch ? accessionMatch[1] : '';

        filings.push({
          company_name: companyName,
          cik,
          filing_type: filingType,
          filing_date: filingDate,
          url: documentsUrl,
          description: `${filingType} filing for ${companyName}`,
          accession_number: accessionNumber
        });

        if (filings.length >= maxResults) break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error(`SEC filings error for CIK ${cik}:`, error.message);
    }

    return filings;
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

  private async saveSECFiling(filing: SECFiling): Promise<boolean> {
    const supabase = this.getSupabase();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('source_url', filing.url)
      .single();

    if (existing) {
      return false;
    }

    const { error } = await supabase
      .from('legal_documents')
      .insert({
        source_id: this.sourceId,
        source_type: 'sec_filing',
        document_type: filing.filing_type.toLowerCase().replace(/\s+/g, '_'),
        title: `${filing.company_name} - ${filing.filing_type}`,
        source_url: filing.url,
        content: filing.description,
        company_name: filing.company_name,
        cik: filing.cik,
        filing_type: filing.filing_type,
        filing_date: filing.filing_date,
        accession_number: filing.accession_number,
        keywords: this.config.keywords,
        status: 'new'
      });

    if (error) {
      console.error('Error saving SEC filing:', error);
      return false;
    }

    return true;
  }
}
