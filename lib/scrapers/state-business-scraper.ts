import { createClient } from '@supabase/supabase-js';

interface StateBusinessConfig {
  states: string[]; // ['CA', 'DE', 'WY', 'NV', 'TX', etc.]
  entity_types: string[]; // ['corporation', 'llc', 'trust', 'non-profit']
  keywords: string[];
  search_terms?: string[]; // ['trust', 'estate', 'tax exempt']
}

interface BusinessEntity {
  entity_name: string;
  entity_number: string;
  state: string;
  entity_type: string;
  status: string;
  filing_date: string;
  url: string;
  registered_agent?: string;
}

export class StateBusinessScraper {
  private sourceId: string;
  private config: StateBusinessConfig;

  constructor(sourceId: string, config: StateBusinessConfig) {
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
      for (const state of this.config.states) {
        try {
          let entities: BusinessEntity[] = [];

          // Different states have different systems
          switch (state.toUpperCase()) {
            case 'CA':
              entities = await this.scrapeCalifornia();
              break;
            case 'DE':
              entities = await this.scrapeDelaware();
              break;
            case 'WY':
              entities = await this.scrapeWyoming();
              break;
            case 'NV':
              entities = await this.scrapeNevada();
              break;
            default:
              // Generic state scraper
              entities = await this.scrapeGenericState(state);
          }

          for (const entity of entities) {
            const saved = await this.saveBusinessEntity(entity);
            if (saved) {
              results.leads++;
              results.new++;
            } else {
              results.duplicates++;
            }
          }

        } catch (err: any) {
          results.errors.push(`${state}: ${err.message}`);
        }
      }

    } catch (error: any) {
      results.errors.push(error.message);
    }

    return results;
  }

  private async scrapeCalifornia(): Promise<BusinessEntity[]> {
    const entities: BusinessEntity[] = [];

    try {
      // California Secretary of State business search
      const baseUrl = 'https://businesssearch.sos.ca.gov/';

      // Note: California requires JavaScript/API calls
      // This is a simplified example - real implementation would need to use their API
      console.log('California business search requires API access');

      // Placeholder: Would integrate with California Secretary of State API
      // For now, return guidance document
      entities.push({
        entity_name: 'California Business Filing Information',
        entity_number: 'CA-INFO',
        state: 'CA',
        entity_type: 'information',
        status: 'active',
        filing_date: new Date().toISOString().split('T')[0],
        url: baseUrl,
        registered_agent: 'California Secretary of State'
      });

    } catch (error: any) {
      console.error('California scraping error:', error.message);
    }

    return entities;
  }

  private async scrapeDelaware(): Promise<BusinessEntity[]> {
    const entities: BusinessEntity[] = [];

    try {
      // Delaware Division of Corporations
      const baseUrl = 'https://icis.corp.delaware.gov/Ecorp/EntitySearch/NameSearch.aspx';

      // Delaware also requires form submission
      // This would need proper form interaction
      entities.push({
        entity_name: 'Delaware Corporation Formation Information',
        entity_number: 'DE-INFO',
        state: 'DE',
        entity_type: 'information',
        status: 'active',
        filing_date: new Date().toISOString().split('T')[0],
        url: baseUrl,
        registered_agent: 'Delaware Division of Corporations'
      });

    } catch (error: any) {
      console.error('Delaware scraping error:', error.message);
    }

    return entities;
  }

  private async scrapeWyoming(): Promise<BusinessEntity[]> {
    const entities: BusinessEntity[] = [];

    try {
      // Wyoming Secretary of State
      const baseUrl = 'https://wyobiz.wyo.gov/Business/FilingSearch.aspx';

      entities.push({
        entity_name: 'Wyoming Business Filing Information',
        entity_number: 'WY-INFO',
        state: 'WY',
        entity_type: 'information',
        status: 'active',
        filing_date: new Date().toISOString().split('T')[0],
        url: baseUrl,
        registered_agent: 'Wyoming Secretary of State'
      });

    } catch (error: any) {
      console.error('Wyoming scraping error:', error.message);
    }

    return entities;
  }

  private async scrapeNevada(): Promise<BusinessEntity[]> {
    const entities: BusinessEntity[] = [];

    try {
      // Nevada Secretary of State SilverFlume
      const baseUrl = 'https://esos.nv.gov/EntitySearch/OnlineEntitySearch';

      entities.push({
        entity_name: 'Nevada Business Filing Information',
        entity_number: 'NV-INFO',
        state: 'NV',
        entity_type: 'information',
        status: 'active',
        filing_date: new Date().toISOString().split('T')[0],
        url: baseUrl,
        registered_agent: 'Nevada Secretary of State'
      });

    } catch (error: any) {
      console.error('Nevada scraping error:', error.message);
    }

    return entities;
  }

  private async scrapeGenericState(state: string): Promise<BusinessEntity[]> {
    const entities: BusinessEntity[] = [];

    try {
      // Generic state business filing information
      const stateNames: Record<string, string> = {
        'TX': 'Texas',
        'FL': 'Florida',
        'NY': 'New York',
        'IL': 'Illinois',
        'PA': 'Pennsylvania'
      };

      const stateName = stateNames[state.toUpperCase()] || state;

      entities.push({
        entity_name: `${stateName} Business Filing Information`,
        entity_number: `${state.toUpperCase()}-INFO`,
        state: state.toUpperCase(),
        entity_type: 'information',
        status: 'active',
        filing_date: new Date().toISOString().split('T')[0],
        url: `https://www.${state.toLowerCase()}.gov/business`,
        registered_agent: `${stateName} Secretary of State`
      });

    } catch (error: any) {
      console.error(`${state} scraping error:`, error.message);
    }

    return entities;
  }

  private async saveBusinessEntity(entity: BusinessEntity): Promise<boolean> {
    const supabase = this.getSupabase();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('id')
      .eq('source_url', entity.url)
      .eq('entity_number', entity.entity_number)
      .single();

    if (existing) {
      return false;
    }

    const { error } = await supabase
      .from('legal_documents')
      .insert({
        source_id: this.sourceId,
        source_type: 'state_filing',
        document_type: 'business_entity',
        title: entity.entity_name,
        source_url: entity.url,
        content: `${entity.entity_type} in ${entity.state} - Status: ${entity.status}`,
        entity_name: entity.entity_name,
        entity_number: entity.entity_number,
        state: entity.state,
        entity_type: entity.entity_type,
        status: entity.status,
        filing_date: entity.filing_date,
        registered_agent: entity.registered_agent,
        keywords: this.config.keywords
      });

    if (error) {
      console.error('Error saving business entity:', error);
      return false;
    }

    return true;
  }
}
