/**
 * Dan's FREE Lead Scraper
 * Uses AI web search + email pattern guessing (no paid APIs)
 * Budget: $0/month (completely free)
 */

const axios = require('axios');
const db = require('../server/db');
const { withCronAuth } = require('../lib/api-wrapper');
const { queryAtlas } = require('./atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

// CRITICAL: Use Supabase client with service role key to bypass RLS
// Railway's DATABASE_URL pool connection is subject to RLS and blocks INSERTs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Dan Free Scraper] Starting free lead discovery...');

  try {
    // =====================================================================
    // STEP 1: Get existing companies to avoid duplicates
    // =====================================================================

    console.log('[Dan Free Scraper] Fetching existing companies to avoid duplicates...');
    const existingCompaniesResult = await supabase
      .from('contacts')
      .select('company')
      .eq('tenant_id', tenantId)
      .not('company', 'is', null)
      .neq('company', '')
      .order('created_at', { ascending: false })
      .limit(100);

    const existingCompanies = (existingCompaniesResult.data || []).map(row => row.company).join(', ');
    console.log(`[Dan Free Scraper] Found ${existingCompaniesResult.data?.length || 0} existing companies to exclude`);

    // =====================================================================
    // STEP 2: Use AI to discover NEW companies (not in our database)
    // =====================================================================

    const searchPrompt = `Search the web and find 10 real consulting firms, marketing agencies, or SaaS companies that would be ideal customers for a CRM tool.

CRITICAL: Find DIFFERENT companies than the ones we've already contacted. Here are companies to AVOID (we already have them):
${existingCompanies || 'None yet'}

IMPORTANT: Return REAL companies that exist, with their actual domains. DO NOT include any of the companies listed above.

For each company, provide:
- Company name (must be DIFFERENT from the list above)
- Website domain (e.g., acme.com)
- Industry (consulting, marketing, saas, etc.)
- Size estimate (small, medium, large)
- Why they're a good fit

Return JSON array:
[
  {
    "name": "Company Name",
    "domain": "domain.com",
    "industry": "consulting",
    "size": "medium",
    "reason": "Why they're a good fit"
  }
]

Focus on companies that:
- Have 10-500 employees
- Need client management tools
- Are actively growing
- Value automation and AI
- Are NOT in the exclusion list above`;

    console.log('[Dan Free Scraper] Searching for NEW companies via AI (excluding existing ones)...');

    const atlasResponse = await queryAtlas(
      searchPrompt,
      'marketing',
      tenantId,
      {
        sources: ['claude'], // Use Claude (always available)
        save_to_memory: true,
        calledBy: 'dan_free_scraper'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(`Atlas search failed: ${atlasResponse.error}`);
    }

    let companies = [];
    try {
      let jsonText = atlasResponse.answer;

      // Extract JSON from markdown code blocks if present
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      // Also try to find JSON array if not in code block
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch && !jsonMatch) {
        jsonText = arrayMatch[0];
      }

      companies = JSON.parse(jsonText.trim());

      console.log(`[Dan Free Scraper] Successfully parsed ${companies.length} companies from AI response`);
    } catch (e) {
      console.error('[Dan Free Scraper] Failed to parse AI response:', e);
      console.error('[Dan Free Scraper] Raw response:', atlasResponse.answer);
      return res.status(500).json({
        success: false,
        error: 'AI returned invalid company data'
      });
    }

    console.log(`[Dan Free Scraper] Found ${companies.length} companies from AI search`);

    // =====================================================================
    // STEP 2: Generate likely email addresses using common patterns
    // =====================================================================

    const discoveredLeads = [];
    const emailPatterns = [
      'contact', 'info', 'hello', 'sales', 'business',
      'admin', 'support', 'team', 'partnerships'
    ];

    for (const company of companies) {
      try {
        // Check if company already exists - Use Supabase to bypass RLS
        const existingCompany = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('company', company.name)
          .limit(1);

        if (existingCompany.data && existingCompany.data.length > 0) {
          console.log(`[Dan Free Scraper] ${company.name} already exists, skipping`);
          continue;
        }

        // Generate likely contact emails
        const potentialEmails = emailPatterns.map(pattern =>
          `${pattern}@${company.domain}`
        );

        // Pick the most professional email (contact@ or info@)
        const primaryEmail = `contact@${company.domain}`;

        discoveredLeads.push({
          name: company.name,
          company: company.name,
          domain: company.domain,
          email: primaryEmail,
          alternateEmails: potentialEmails,
          industry: company.industry,
          size: company.size,
          title: 'Business Contact',
          confidence: 60, // Lower confidence since we're guessing emails
          source: 'ai_web_search',
          verified: false,
          discoveryReason: company.reason
        });

      } catch (error) {
        console.error(`[Dan Free Scraper] Error processing ${company.name}:`, error);
      }
    }

    console.log(`[Dan Free Scraper] Generated ${discoveredLeads.length} leads with estimated emails`);

    // =====================================================================
    // STEP 3: Add discovered leads to database
    // =====================================================================

    const addedLeads = [];

    for (const lead of discoveredLeads) {
      try {
        // Double-check email doesn't exist - Use Supabase to bypass RLS
        const existingEmail = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('email', lead.email)
          .limit(1);

        if (existingEmail.data && existingEmail.data.length > 0) {
          console.log(`[Dan Free Scraper] Email ${lead.email} already exists, skipping`);
          continue;
        }

        // Insert contact - Use Supabase client to bypass RLS
        const contactResult = await supabase
          .from('contacts')
          .insert({
            tenant_id: tenantId,
            full_name: lead.name,
            company: lead.company,
            email: lead.email,
            title: lead.title,
            stage: 'lead',
            lead_source: 'ai_web_search',
            notes: `Discovered via AI web search (${lead.confidence}% confidence)

Industry: ${lead.industry}
Company Size: ${lead.size}
Domain: ${lead.domain}
Discovery Reason: ${lead.discoveryReason}

⚠️ Email is estimated using common patterns - verify before outreach
Alternate emails to try: ${lead.alternateEmails.join(', ')}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        console.log(`[Dan Free Scraper] Contact INSERT result for ${lead.email}:`, {
          hasError: !!contactResult.error,
          error: contactResult.error,
          hasData: !!contactResult.data,
          data: contactResult.data
        });

        if (contactResult.error || !contactResult.data) {
          console.error(`[Dan Free Scraper] ❌ Failed to insert ${lead.email}:`, contactResult.error || 'No data returned');
          continue;
        }

        const contactId = contactResult.data.id;

        // Log activity - Use Supabase client to bypass RLS
        const activityResult = await supabase
          .from('contact_activities')
          .insert({
            tenant_id: tenantId,
            contact_id: contactId,
            activity_type: 'lead_discovered',
            description: `Lead discovered via free AI web search: ${lead.company}

Discovery Method: ai_web_search
Confidence: ${lead.confidence}%
Domain: ${lead.domain}
Industry: ${lead.industry}
Verified: false`,
            created_at: new Date().toISOString()
          });

        if (activityResult.error) {
          console.error(`[Dan Free Scraper] ❌ Failed to log contact activity:`, activityResult.error);
        } else {
          console.log(`[Dan Free Scraper] ✓ Contact activity logged for ${lead.email}`);
        }

        // Log bot action - Use Supabase client to bypass RLS
        const botLogResult = await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'dan',
            action_type: 'lead_discovery',
            action_description: `Discovered new company via free AI search: ${lead.company}`,
            status: 'completed',
            related_entity_type: 'contact',
            related_entity_id: contactId,
            triggered_by: req.body?.triggered_by || 'automated',
            metadata: {
              company: lead.company,
              industry: lead.industry,
              source: 'ai_web_search',
              confidence: lead.confidence,
              verified: false,
              cost: 0
            }
          });

        if (botLogResult.error) {
          console.error(`[Dan Free Scraper] ❌ Failed to log bot action:`, botLogResult.error);
        } else {
          console.log(`[Dan Free Scraper] ✓ Bot action logged for ${lead.email}`);
        }

        // Add to outreach queue for automated email outreach
        const queueResult = await supabase
          .from('dan_outreach_queue')
          .insert({
            tenant_id: tenantId,
            contact_email: lead.email,
            contact_name: lead.name,
            company_name: lead.company,
            priority: lead.confidence >= 70 ? 'high' : 'medium',
            status: 'pending',
            subject: `Quick question about ${lead.company}`,
            created_at: new Date().toISOString()
          });

        if (queueResult.error) {
          console.error(`[Dan Free Scraper] ❌ Failed to queue ${lead.email}:`, queueResult.error);
        } else {
          console.log(`[Dan Free Scraper] ✓ Added ${lead.email} to outreach queue`);
        }

        addedLeads.push({
          contact_id: contactId,
          company: lead.company,
          email: lead.email,
          confidence: lead.confidence,
          verified: false,
          queued_for_outreach: !queueResult.error
        });

        console.log(`[Dan Free Scraper] Added lead: ${lead.company} (${lead.email})`);

      } catch (error) {
        console.error(`[Dan Free Scraper] Error adding lead ${lead.email}:`, error);
      }
    }

    console.log(`[Dan Free Scraper] Added ${addedLeads.length} new leads (100% free)`);

    return res.json({
      success: true,
      version: '3.0-unique-companies-with-logging',  // Version check to verify deployment
      data: {
        companies_discovered: companies.length,
        leads_generated: discoveredLeads.length,
        leads_added: addedLeads.length,
        leads: addedLeads,
        cost: {
          total: 0,
          per_lead: 0,
          currency: 'USD',
          method: 'Free AI web search + email pattern guessing'
        },
        note: 'Emails are estimated using common patterns. Verify before sending outreach.',
        next_steps: [
          '1. Review leads in CRM',
          '2. Verify emails manually if needed',
          '3. Leads will be contacted by auto-outreach within 4 hours',
          '4. System runs every 5 minutes to find fresh companies'
        ]
      }
    });

  } catch (error) {
    console.error('[Dan Free Scraper] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
