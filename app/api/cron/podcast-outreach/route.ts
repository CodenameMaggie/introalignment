import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PartnerOutreachEngine } from '@/lib/outreach/partner-outreach-engine';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Enable/disable podcast outreach
const PODCAST_OUTREACH_ENABLED = process.env.PODCAST_OUTREACH_ENABLED !== 'false'; // Default enabled

/**
 * Podcast Guest Outreach Cron Job
 *
 * Runs every 10 minutes (configured in vercel.json)
 *
 * RESPONSIBILITIES:
 * 1. Process pending podcast invitations (emails scheduled to send)
 * 2. Auto-enroll high-quality prospects in podcast sequence
 *
 * QUALITY THRESHOLDS:
 * - Minimum fit_score: 12 (business_builder + expertise)
 * - Must have valid email
 * - Must not be unsubscribed
 * - podcast_status = 'not_contacted' OR null
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const engine = new PartnerOutreachEngine();

    // Check if podcast outreach is enabled
    if (!PODCAST_OUTREACH_ENABLED) {
      // Count prospects ready for podcast invitations
      const { count: readyProspects } = await supabase
        .from('partners')
        .select('id', { count: 'exact', head: true })
        .in('podcast_status', ['not_contacted', null])
        .eq('status', 'approved')
        .not('email', 'is', null)
        .eq('email_unsubscribed', false);

      return NextResponse.json({
        success: true,
        outreach_status: 'PAUSED',
        message: 'Podcast outreach paused. Set PODCAST_OUTREACH_ENABLED=true to activate.',
        ready_to_contact: readyProspects || 0,
        emails_sent: 0,
        partners_enrolled: 0,
        instruction: 'Set PODCAST_OUTREACH_ENABLED=true in environment variables'
      });
    }

    // 1. Process pending emails (scheduled invitations)
    const sentCount = await engine.processPendingEmails();

    // 2. Auto-enroll high-quality prospects
    // Query prospects using the podcast_prospects_high_priority view
    const { data: prospects } = await supabase
      .from('podcast_prospects_high_priority')
      .select('*')
      .in('podcast_status', ['not_contacted', null])
      .limit(50); // Process 50 at a time

    let enrolledCount = 0;

    for (const prospect of prospects || []) {
      try {
        // Calculate total fit score
        const fitScore = (prospect.business_builder_score || 0) + (prospect.expertise_score || 0);

        // Only enroll if fit_score >= 12 (high quality)
        if (fitScore >= 12) {
          await engine.enrollPartner(prospect.id);
          enrolledCount++;
        }
      } catch (error) {
        console.error(`Error enrolling partner ${prospect.id}:`, error);
      }
    }

    // 3. Get stats for response
    const { count: totalProspects } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .in('partner_type', ['prospect', 'interested']);

    const { count: contacted } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('podcast_status', 'contacted');

    const { count: interested } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('podcast_status', 'interested');

    const { count: scheduled } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('podcast_status', 'scheduled');

    return NextResponse.json({
      success: true,
      outreach_status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      emails_sent: sentCount,
      partners_enrolled: enrolledCount,
      stats: {
        total_prospects: totalProspects || 0,
        contacted: contacted || 0,
        interested: interested || 0,
        scheduled: scheduled || 0,
        conversion_rate: totalProspects ? `${((interested || 0) / totalProspects * 100).toFixed(1)}%` : '0%'
      }
    });

  } catch (error: any) {
    console.error('[Podcast Outreach Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
