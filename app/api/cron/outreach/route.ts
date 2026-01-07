import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OutreachEngine } from '@/lib/outreach/outreach-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const engine = new OutreachEngine();

    // Process pending emails
    const sentCount = await engine.processPendingEmails();

    // Auto-enroll qualified leads not in sequence
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('outreach_status', 'pending')
      .eq('enrichment_status', 'enriched')
      .gte('fit_score', 40)
      .not('email', 'is', null)
      .limit(20);

    let enrolledCount = 0;

    for (const lead of leads || []) {
      try {
        await engine.enrollLead(lead.id);
        enrolledCount++;
      } catch (error) {
        console.error(`Error enrolling lead ${lead.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      emails_sent: sentCount,
      leads_enrolled: enrolledCount
    });

  } catch (error: any) {
    console.error('Outreach cron error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
