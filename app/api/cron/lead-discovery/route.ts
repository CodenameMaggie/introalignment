import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Lead Discovery - Pure Business Logic
 * Uses curated list of target companies
 * No AI required
 */

// Curated list of potential leads (dating coaches, matchmakers, wedding industry)
const POTENTIAL_LEADS = [
  { name: "The Matchmaking Institute", domain: "matchmakinginstitute.com", industry: "matchmaking", size: "10-50" },
  { name: "It's Just Lunch", domain: "itsjustlunch.com", industry: "matchmaking", size: "100-500" },
  { name: "Selective Search", domain: "selectivesearch.com", industry: "matchmaking", size: "10-50" },
  { name: "Three Day Rule", domain: "threedayrule.com", industry: "matchmaking", size: "50-100" },
  { name: "The League Dating App", domain: "theleague.com", industry: "dating_app", size: "50-200" },
  { name: "Hinge", domain: "hinge.co", industry: "dating_app", size: "100-500" },
  { name: "Coffee Meets Bagel", domain: "coffeemeetsbagel.com", industry: "dating_app", size: "50-100" },
  { name: "Bumble", domain: "bumble.com", industry: "dating_app", size: "500+" },
  { name: "The Knot", domain: "theknot.com", industry: "wedding", size: "500+" },
  { name: "Zola", domain: "zola.com", industry: "wedding", size: "100-500" },
  { name: "WeddingWire", domain: "weddingwire.com", industry: "wedding", size: "500+" },
  { name: "Minted Weddings", domain: "minted.com", industry: "wedding", size: "100-500" },
  { name: "Relationship Hero", domain: "relationshiphero.com", industry: "coaching", size: "10-50" },
  { name: "BetterHelp", domain: "betterhelp.com", industry: "counseling", size: "500+" },
  { name: "Talkspace", domain: "talkspace.com", industry: "counseling", size: "100-500" },
  { name: "Eventbrite Singles Events", domain: "eventbrite.com", industry: "events", size: "500+" },
  { name: "Meetup Dating Groups", domain: "meetup.com", industry: "events", size: "500+" },
  { name: "SpeedLA Dating", domain: "speedladating.com", industry: "speed_dating", size: "10-50" },
  { name: "Pre-Dating", domain: "pre-dating.com", industry: "speed_dating", size: "10-50" },
  { name: "CitySwoon", domain: "cityswoon.com", industry: "speed_dating", size: "10-50" }
];

export async function GET(request: NextRequest) {
  try {
    console.log('[Lead Discovery] Starting company discovery...');

    // Step 1: Get existing companies to avoid duplicates
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('company')
      .not('company', 'is', null)
      .neq('company', '')
      .order('created_at', { ascending: false })
      .limit(100);

    const existingCompaniesSet = new Set(
      existingLeads?.map(l => l.company.toLowerCase()) || []
    );

    console.log(`[Lead Discovery] Found ${existingLeads?.length || 0} existing companies to exclude`);

    // Step 2: Filter out companies we already have
    const companies = POTENTIAL_LEADS.filter(
      company => !existingCompaniesSet.has(company.name.toLowerCase())
    ).slice(0, 10); // Take up to 10 new companies

    console.log(`[Lead Discovery] Found ${companies.length} new companies to add`);

    // Step 3: Generate email addresses and save to database
    const emailPatterns = ['contact', 'info', 'hello', 'team', 'support'];
    const results = [];

    for (const company of companies) {
      try {
        // Check if company already exists
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('company', company.name)
          .single();

        if (existing) {
          console.log(`[Lead Discovery] ${company.name} already exists, skipping`);
          continue;
        }

        // Generate likely contact emails
        const primaryEmail = `contact@${company.domain}`;
        const alternateEmails = emailPatterns.map(p => `${p}@${company.domain}`);

        // Create fingerprint for deduplication
        const fingerprint = `company:${company.domain}`;

        // Insert lead
        const { data: newLead, error } = await supabase
          .from('leads')
          .insert({
            source_type: 'curated_list',
            source_url: `https://${company.domain}`,
            company: company.name,
            email: primaryEmail,
            email_confidence: 0.6,
            email_source: 'pattern_guess',
            bio: `${company.industry} company (${company.size} employees) in the dating/matchmaking industry`,
            trigger_content: `Curated lead from ${company.industry} industry`,
            trigger_keywords: [company.industry, 'curated_list'],
            fit_score: 65,
            priority: 'medium',
            status: 'new',
            outreach_status: 'pending',
            enrichment_status: 'pending',
            fingerprint,
            tags: ['curated_list', company.industry],
            notes: `Email estimated using common patterns. Verify before outreach.\nAlternate emails: ${alternateEmails.join(', ')}`
          })
          .select()
          .single();

        if (error) {
          console.error(`[Lead Discovery] Failed to insert ${company.name}:`, error);
          continue;
        }

        results.push({
          company: company.name,
          email: primaryEmail,
          lead_id: newLead.id,
          confidence: 60
        });

        console.log(`[Lead Discovery] Added: ${company.name} (${primaryEmail})`);

      } catch (error) {
        console.error(`[Lead Discovery] Error processing ${company.name}:`, error);
      }
    }

    console.log(`[Lead Discovery] Successfully added ${results.length} new leads`);

    return NextResponse.json({
      success: true,
      discovered: companies.length,
      added: results.length,
      leads: results,
      note: 'Emails are estimated. Verify before outreach.'
    });

  } catch (error: any) {
    console.error('[Lead Discovery] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
