import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LeadScorer } from '@/lib/scoring/lead-scorer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get leads needing scoring (no score yet)
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .is('fit_score', null)
      .limit(100);

    if (!leads?.length) {
      return NextResponse.json({ message: 'No leads to score', scored: 0 });
    }

    const scorer = new LeadScorer();
    let scoredCount = 0;

    for (const lead of leads) {
      try {
        await scorer.scoreLead(lead.id);
        scoredCount++;
      } catch (error) {
        console.error(`Error scoring lead ${lead.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      scored: scoredCount,
      total: leads.length
    });

  } catch (error: any) {
    console.error('Score cron error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
