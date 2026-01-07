import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

/**
 * FREE Lead Discovery using Claude
 * Finds real companies and guesses their contact emails
 * No paid APIs required beyond Claude (which you're already using)
 */
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
      .limit(50);

    const existingCompanies = existingLeads?.map(l => l.company).join(', ') || 'None yet';

    console.log(`[Lead Discovery] Found ${existingLeads?.length || 0} existing companies to exclude`);

    // Step 2: Use Claude to discover new companies
    const prompt = `Search your knowledge and suggest 10 real companies that would be ideal customers for a matchmaking/dating service like IntroAlignment.

CRITICAL: Find DIFFERENT companies than these we already have:
${existingCompanies}

For each company, provide:
- Company name (must be DIFFERENT from the list above)
- Website domain (e.g., acme.com)
- Industry
- Estimated size (employees)
- Why they'd be a good fit

Return ONLY a JSON array, no other text:
[
  {
    "name": "Company Name",
    "domain": "domain.com",
    "industry": "industry",
    "size": "10-50",
    "reason": "Why they're a good fit"
  }
]

Focus on:
- Dating coaches/matchmakers
- Relationship counselors
- Wedding planners
- Event companies
- HR consulting firms
- Companies that already serve singles/couples`;

    console.log('[Lead Discovery] Querying Claude for new companies...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Extract JSON from response
    let companies = [];
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
                        responseText.match(/(\[[\s\S]*\])/);

      if (jsonMatch) {
        companies = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not extract JSON from Claude response');
      }

      console.log(`[Lead Discovery] Claude found ${companies.length} companies`);
    } catch (error: any) {
      console.error('[Lead Discovery] Failed to parse Claude response:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response',
        raw: responseText
      }, { status: 500 });
    }

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
            source_type: 'ai_discovery',
            source_url: `https://${company.domain}`,
            company: company.name,
            email: primaryEmail,
            email_confidence: 0.6,
            email_source: 'pattern_guess',
            bio: `${company.industry} company with ${company.size} employees. ${company.reason}`,
            trigger_content: `AI-discovered company: ${company.reason}`,
            trigger_keywords: [company.industry, 'ai_discovery'],
            fit_score: 65,
            priority: 'medium',
            status: 'new',
            outreach_status: 'pending',
            enrichment_status: 'pending',
            fingerprint,
            tags: ['ai_discovery', company.industry],
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
