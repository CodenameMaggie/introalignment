import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OutreachEngine } from '@/lib/outreach/outreach-engine';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// OUTREACH PAUSED - Collecting data for 3 days before launch
const OUTREACH_ENABLED = process.env.OUTREACH_ENABLED === 'true';

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const engine = new OutreachEngine();

    // Check if outreach is enabled
    if (!OUTREACH_ENABLED) {
      // Count qualified leads ready for outreach
      const { count: readyLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('outreach_status', 'pending')
        .eq('enrichment_status', 'enriched')
        .gte('fit_score', 60)
        .gte('email_confidence', 0.4)
        .not('email', 'is', null)
        .not('trigger_content', 'is', null);

      return NextResponse.json({
        success: true,
        outreach_status: 'PAUSED',
        message: 'Collecting data for 3 days before launching outreach',
        ready_to_contact: readyLeads || 0,
        emails_sent: 0,
        leads_enrolled: 0,
        instruction: 'Set OUTREACH_ENABLED=true in .env.local to activate outreach'
      });
    }

    // Process pending emails (only if enabled)
    const sentCount = await engine.processPendingEmails();

    // Auto-enroll ONLY HIGH-QUALITY leads (increased threshold for quality)
    const { data: leads } = await supabase
      .from('leads')
      .select('id, fit_score, email_confidence, trigger_content')
      .eq('outreach_status', 'pending')
      .eq('enrichment_status', 'enriched')
      .gte('fit_score', 60)  // INCREASED from 40 to 60 for quality
      .gte('email_confidence', 0.4)  // Only emails with decent confidence
      .not('email', 'is', null)
      .not('trigger_content', 'is', null)  // Must have actual content
      .limit(100);  // Increased batch size for efficiency

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
      outreach_status: 'ACTIVE',
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
