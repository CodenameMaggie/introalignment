import { createClient } from '@supabase/supabase-js';

interface ScraperConfig {
  target_specializations?: string[];
  target_states?: string[];
  min_years_experience?: number;
  max_results?: number;
}

interface LawyerProfile {
  full_name: string;
  email: string | null;
  professional_title: string;
  firm_name: string | null;
  specializations: string[];
  licensed_states: string[];
  years_experience: number | null;
  bio: string | null;
  website_url: string | null;
  phone: string | null;
  linkedin_url: string | null;
}

export class LawyerDirectoryScraper {
  private directoryId: string;
  private config: ScraperConfig;
  private supabase;

  constructor(directoryId: string, config: ScraperConfig = {}) {
    this.directoryId = directoryId;
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async scrape() {
    const startTime = Date.now();
    let lawyersFound = 0;
    let lawyersCreated = 0;
    let errors = 0;

    console.log(`[LawyerDirectoryScraper] Starting scrape for directory ${this.directoryId}`);

    try {
      // Get directory details
      const { data: directory } = await this.supabase
        .from('lawyer_directories')
        .select('*')
        .eq('id', this.directoryId)
        .single();

      if (!directory) {
        throw new Error('Directory not found');
      }

      // Merge directory config with provided config
      const mergedConfig = {
        ...directory.scrape_config,
        ...this.config
      };

      let lawyers: LawyerProfile[] = [];

      // Route to appropriate scraper based on directory type
      switch (directory.directory_type) {
        case 'avvo':
          lawyers = await this.scrapeAvvo(directory.directory_url, mergedConfig);
          break;
        case 'martindale':
          lawyers = await this.scrapeMartindale(directory.directory_url, mergedConfig);
          break;
        case 'super_lawyers':
          lawyers = await this.scrapeSuperLawyers(directory.directory_url, mergedConfig);
          break;
        case 'state_bar':
          lawyers = await this.scrapeStateBar(directory.directory_url, mergedConfig);
          break;
        default:
          console.log(`Unknown directory type: ${directory.directory_type}`);
      }

      lawyersFound = lawyers.length;

      // Insert lawyers into partners table as prospects
      for (const lawyer of lawyers) {
        try {
          // Check if lawyer already exists by email
          const { data: existing } = await this.supabase
            .from('partners')
            .select('id')
            .eq('email', lawyer.email)
            .single();

          if (!existing) {
            // Insert new partner
            await this.supabase.from('partners').insert([
              {
                ...lawyer,
                partner_type: 'prospect',
                status: 'pending',
                source: `directory_scrape_${directory.directory_name}`,
                initial_contact_date: new Date().toISOString().split('T')[0]
              }
            ]);

            lawyersCreated++;
          }
        } catch (error: any) {
          console.error(`Error inserting lawyer ${lawyer.full_name}:`, error.message);
          errors++;
        }
      }

      // Update directory stats
      await this.supabase
        .from('lawyer_directories')
        .update({
          total_lawyers_found: directory.total_lawyers_found + lawyersFound,
          last_scraped_at: new Date().toISOString()
        })
        .eq('id', this.directoryId);

      const duration = Date.now() - startTime;

      return {
        success: true,
        directory: directory.directory_name,
        lawyers_found: lawyersFound,
        lawyers_created: lawyersCreated,
        duplicates_skipped: lawyersFound - lawyersCreated - errors,
        errors,
        duration_ms: duration
      };

    } catch (error: any) {
      console.error(`[LawyerDirectoryScraper] Error:`, error);
      return {
        success: false,
        directory: 'unknown',
        lawyers_found: lawyersFound,
        lawyers_created: lawyersCreated,
        errors: errors + 1,
        error: error.message
      };
    }
  }

  private async scrapeAvvo(url: string, config: ScraperConfig): Promise<LawyerProfile[]> {
    console.log('[Avvo Scraper] Simulated scrape - would fetch from:', url);

    // This is a placeholder - in production, you would:
    // 1. Use a headless browser (Puppeteer/Playwright) or
    // 2. Make HTTP requests to Avvo's search API if available
    // 3. Parse HTML to extract lawyer profiles

    // For now, return sample data structure
    const sampleLawyers: LawyerProfile[] = [
      {
        full_name: 'Sample Attorney (Avvo)',
        email: 'sample@example.com',
        professional_title: 'Estate Planning Attorney',
        firm_name: 'Sample Law Firm',
        specializations: ['Estate Planning', 'Trust Administration'],
        licensed_states: ['California'],
        years_experience: 15,
        bio: 'Experienced estate planning attorney specializing in high-net-worth clients.',
        website_url: 'https://example.com',
        phone: '555-0123',
        linkedin_url: null
      }
    ];

    return sampleLawyers;
  }

  private async scrapeMartindale(url: string, config: ScraperConfig): Promise<LawyerProfile[]> {
    console.log('[Martindale Scraper] Simulated scrape - would fetch from:', url);
    // Similar implementation as Avvo
    return [];
  }

  private async scrapeSuperLawyers(url: string, config: ScraperConfig): Promise<LawyerProfile[]> {
    console.log('[SuperLawyers Scraper] Simulated scrape - would fetch from:', url);
    // Similar implementation as Avvo
    return [];
  }

  private async scrapeStateBar(url: string, config: ScraperConfig): Promise<LawyerProfile[]> {
    console.log('[State Bar Scraper] Simulated scrape - would fetch from:', url);

    // Each state bar has different structure, would need custom logic per state
    // California Bar: https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch
    // New York Bar: https://iapps.courts.state.ny.us/attorney/AttorneySearch
    // etc.

    return [];
  }

  // Utility method to validate email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Utility method to normalize state names
  private normalizeState(state: string): string {
    const stateMap: Record<string, string> = {
      'CA': 'California',
      'NY': 'New York',
      'TX': 'Texas',
      'FL': 'Florida',
      'IL': 'Illinois',
      // Add more as needed
    };
    return stateMap[state] || state;
  }
}
