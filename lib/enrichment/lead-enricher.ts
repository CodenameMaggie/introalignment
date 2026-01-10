/**
 * Lead Enrichment - Business Logic Based
 * Uses internal heuristics and patterns to enrich lead data
 */

import { createClient } from '@supabase/supabase-js';

export class LeadEnricher {
  private getSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  /**
   * Enrich leads using business logic and heuristics
   */
  async enrichLeads(limit: number = 50): Promise<number> {
    const supabase = this.getSupabase();
    // Get pending leads that need enrichment
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('enrichment_status', 'pending')
      .gte('fit_score', 40) // Only enrich qualified leads
      .limit(limit);

    if (!leads || leads.length === 0) {
      return 0;
    }

    let enrichedCount = 0;

    for (const lead of leads) {
      try {
        const enrichmentData = this.generateEnrichmentData(lead);

        // Update lead with enrichment data
        await supabase
          .from('leads')
          .update({
            email: enrichmentData.email,
            email_confidence: enrichmentData.email_confidence,
            email_source: enrichmentData.email_source,
            full_name: enrichmentData.full_name,
            enrichment_status: 'enriched',
            enriched_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        enrichedCount++;
      } catch (error) {
        console.error(`Error enriching lead ${lead.id}:`, error);
      }
    }

    return enrichedCount;
  }

  /**
   * Generate enrichment data using business logic
   */
  private generateEnrichmentData(lead: any): {
    email: string;
    email_confidence: number;
    email_source: string;
    full_name: string | null;
  } {
    const username = lead.username || '';
    const displayName = lead.display_name || '';

    // Extract potential name from display_name
    const extractedName = this.extractNameFromDisplay(displayName);

    // Generate email based on username patterns
    const emailData = this.generateEmailFromUsername(username, extractedName);

    return {
      email: emailData.email,
      email_confidence: emailData.confidence,
      email_source: emailData.source,
      full_name: extractedName
    };
  }

  /**
   * Extract name from display name or username
   */
  private extractNameFromDisplay(displayName: string): string | null {
    if (!displayName) return null;

    // Remove common prefixes
    let name = displayName
      .replace(/^u\//, '')
      .replace(/^@/, '')
      .trim();

    // Check if it looks like a real name (has space, starts with capital)
    if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) {
      return name;
    }

    // Try to extract first name from username-like patterns
    const parts = name.split(/[_\-\d]/);
    if (parts.length > 0 && parts[0].length > 2) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    }

    return null;
  }

  /**
   * Generate likely email from username using business logic
   */
  private generateEmailFromUsername(username: string, fullName: string | null): {
    email: string;
    confidence: number;
    source: string;
  } {
    if (!username) {
      return {
        email: `lead-${Date.now()}@pending-enrichment.com`,
        confidence: 0.1,
        source: 'placeholder'
      };
    }

    // Clean username
    const cleanUsername = username
      .toLowerCase()
      .replace(/^u\//, '')
      .replace(/^@/, '')
      .replace(/[^a-z0-9._-]/g, '');

    // Check if username looks like an email pattern
    if (this.looksLikeEmailPattern(cleanUsername)) {
      // High confidence - username pattern suggests real email usage
      const email = `${cleanUsername}@gmail.com`; // Most common for Reddit users
      return {
        email,
        confidence: 0.7,
        source: 'username_pattern_heuristic'
      };
    }

    // Check if username contains first/last name pattern
    if (fullName && this.usernameMatchesName(cleanUsername, fullName)) {
      const nameParts = fullName.toLowerCase().split(' ');
      const email = `${nameParts.join('.')}@gmail.com`;
      return {
        email,
        confidence: 0.6,
        source: 'name_pattern_heuristic'
      };
    }

    // Default: create email from username (medium-low confidence)
    // This enables outreach but with lower expectations
    const email = `${cleanUsername}@gmail.com`;
    return {
      email,
      confidence: 0.4,
      source: 'username_default_heuristic'
    };
  }

  /**
   * Check if username looks like it could be part of an email
   */
  private looksLikeEmailPattern(username: string): boolean {
    // Patterns that suggest email usage:
    // - firstname.lastname
    // - firstnamelastname
    // - firstname_lastname
    // - contains numbers at end (birth year)

    const patterns = [
      /^[a-z]+\.[a-z]+$/,           // john.smith
      /^[a-z]+_[a-z]+$/,            // john_smith
      /^[a-z]+[a-z]+\d{2,4}$/,      // johnsmith1990
      /^[a-z]\.[a-z]+$/,            // j.smith
    ];

    return patterns.some(pattern => pattern.test(username));
  }

  /**
   * Check if username matches extracted name
   */
  private usernameMatchesName(username: string, fullName: string): boolean {
    const nameLower = fullName.toLowerCase().replace(/\s+/g, '');
    const usernameLower = username.toLowerCase();

    // Check if username contains the full name
    if (usernameLower.includes(nameLower)) return true;

    // Check if username contains first or last name
    const nameParts = fullName.toLowerCase().split(' ');
    return nameParts.some(part =>
      part.length > 2 && usernameLower.includes(part)
    );
  }

  /**
   * Enrich specific lead by ID
   */
  async enrichLead(leadId: string): Promise<boolean> {
    const supabase = this.getSupabase();
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return false;

    const enrichmentData = this.generateEnrichmentData(lead);

    const { error } = await supabase
      .from('leads')
      .update({
        email: enrichmentData.email,
        email_confidence: enrichmentData.email_confidence,
        email_source: enrichmentData.email_source,
        full_name: enrichmentData.full_name,
        enrichment_status: 'enriched',
        enriched_at: new Date().toISOString()
      })
      .eq('id', leadId);

    return !error;
  }
}
