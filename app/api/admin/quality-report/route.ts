import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Lead Quality Report
 * Monitor lead quality metrics to ensure high standards
 */
export async function GET() {
  try {
    // Total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });

    // Scored leads
    const { count: scoredLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .not('fit_score', 'is', null);

    // Quality thresholds
    const { count: highQuality } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('fit_score', 70);

    const { count: goodQuality } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('fit_score', 60)
      .lt('fit_score', 70);

    const { count: mediumQuality } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('fit_score', 40)
      .lt('fit_score', 60);

    const { count: lowQuality } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .lt('fit_score', 40);

    // Enrichment status
    const { count: enriched } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('enrichment_status', 'enriched');

    // Email confidence distribution
    const { data: emailConfidence } = await supabase
      .from('leads')
      .select('email_confidence')
      .not('email_confidence', 'is', null);

    const highConfEmails = emailConfidence?.filter(l => (l.email_confidence || 0) >= 0.6).length || 0;
    const medConfEmails = emailConfidence?.filter(l => (l.email_confidence || 0) >= 0.4 && (l.email_confidence || 0) < 0.6).length || 0;
    const lowConfEmails = emailConfidence?.filter(l => (l.email_confidence || 0) < 0.4).length || 0;

    // Enrolled in outreach
    const { count: enrolled } = await supabase
      .from('sequence_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Emails sent
    const { count: emailsSent } = await supabase
      .from('email_sends')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent');

    // Recent activity (last 24h)
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

    const { count: leadsLast24h } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    const { count: emailsLast24h } = await supabase
      .from('email_sends')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', oneDayAgo);

    // Quality metrics
    const qualificationRate = scoredLeads ? Math.round((goodQuality! + highQuality!) / scoredLeads * 100) : 0;
    const enrichmentRate = totalLeads ? Math.round(enriched! / totalLeads! * 100) : 0;
    const enrollmentRate = enriched ? Math.round(enrolled! / enriched! * 100) : 0;

    return NextResponse.json({
      overview: {
        totalLeads: totalLeads || 0,
        scoredLeads: scoredLeads || 0,
        enriched: enriched || 0,
        enrolled: enrolled || 0,
        emailsSent: emailsSent || 0
      },
      qualityDistribution: {
        high: {
          count: highQuality || 0,
          percentage: scoredLeads ? Math.round(highQuality! / scoredLeads * 100) : 0,
          label: '70-100 (Premium)',
          willContact: true
        },
        good: {
          count: goodQuality || 0,
          percentage: scoredLeads ? Math.round(goodQuality! / scoredLeads * 100) : 0,
          label: '60-69 (Good)',
          willContact: true
        },
        medium: {
          count: mediumQuality || 0,
          percentage: scoredLeads ? Math.round(mediumQuality! / scoredLeads * 100) : 0,
          label: '40-59 (Medium)',
          willContact: false
        },
        low: {
          count: lowQuality || 0,
          percentage: scoredLeads ? Math.round(lowQuality! / scoredLeads * 100) : 0,
          label: '0-39 (Low)',
          willContact: false
        }
      },
      emailQuality: {
        highConfidence: {
          count: highConfEmails,
          label: '0.6-1.0 (High)',
          percentage: emailConfidence?.length ? Math.round(highConfEmails / emailConfidence.length * 100) : 0
        },
        mediumConfidence: {
          count: medConfEmails,
          label: '0.4-0.6 (Medium)',
          percentage: emailConfidence?.length ? Math.round(medConfEmails / emailConfidence.length * 100) : 0
        },
        lowConfidence: {
          count: lowConfEmails,
          label: '<0.4 (Low)',
          percentage: emailConfidence?.length ? Math.round(lowConfEmails / emailConfidence.length * 100) : 0
        }
      },
      recent24h: {
        newLeads: leadsLast24h || 0,
        emailsSent: emailsLast24h || 0,
        leadsPerHour: Math.round((leadsLast24h || 0) / 24),
        emailsPerHour: Math.round((emailsLast24h || 0) / 24)
      },
      pipelineMetrics: {
        qualificationRate: `${qualificationRate}%`,
        enrichmentRate: `${enrichmentRate}%`,
        enrollmentRate: `${enrollmentRate}%`
      },
      qualityGates: {
        minimumFitScore: 60,
        minimumEmailConfidence: 0.4,
        contactingLeads: (goodQuality || 0) + (highQuality || 0),
        notContacting: (mediumQuality || 0) + (lowQuality || 0)
      }
    });

  } catch (error: any) {
    console.error('Quality report error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
