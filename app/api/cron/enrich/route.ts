import { NextRequest, NextResponse } from 'next/server';
import { LeadEnricher } from '@/lib/enrichment/lead-enricher';

/**
 * Cron job to enrich leads with email addresses using business logic
 * Runs regularly to enrich qualified leads (fit_score >= 40)
 */
export async function GET(request: NextRequest) {
  try {
    const enricher = new LeadEnricher();

    // Enrich up to 50 leads per run
    const enrichedCount = await enricher.enrichLeads(50);

    return NextResponse.json({
      success: true,
      enriched: enrichedCount,
      message: `Enriched ${enrichedCount} leads using business logic`
    });

  } catch (error: any) {
    console.error('Lead enrichment error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
