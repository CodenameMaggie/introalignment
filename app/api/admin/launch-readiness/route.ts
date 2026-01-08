import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Launch Readiness Report
 * Shows if we have enough quality leads to launch outreach campaign
 */
export async function GET() {
  try {
    // Total leads collected
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });

    // Scored leads
    const { count: scoredLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .not('fit_score', 'is', null);

    // High quality (70+)
    const { count: premiumLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('fit_score', 70);

    // Good quality (60-69)
    const { count: goodLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('fit_score', 60)
      .lt('fit_score', 70);

    // Total qualified (60+)
    const qualifiedLeads = (premiumLeads || 0) + (goodLeads || 0);

    // Enriched and ready
    const { count: enrichedReady } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('enrichment_status', 'enriched')
      .gte('fit_score', 60)
      .gte('email_confidence', 0.4)
      .not('email', 'is', null)
      .not('trigger_content', 'is', null);

    // Calculate days of data collection
    const { data: oldestLead } = await supabase
      .from('leads')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const daysCollecting = oldestLead
      ? Math.floor((Date.now() - new Date(oldestLead.created_at).getTime()) / 86400000)
      : 0;

    // Outreach status
    const outreachEnabled = process.env.OUTREACH_ENABLED === 'true';

    // Launch criteria
    const criteria = {
      minimumLeads: 50000,
      minimumQualified: 10000,
      minimumEnriched: 5000,
      recommendedDays: 3
    };

    const readyChecks = {
      hasEnoughLeads: (totalLeads || 0) >= criteria.minimumLeads,
      hasEnoughQualified: qualifiedLeads >= criteria.minimumQualified,
      hasEnoughEnriched: (enrichedReady || 0) >= criteria.minimumEnriched,
      hasCollectedLongEnough: daysCollecting >= criteria.recommendedDays
    };

    const isReady = Object.values(readyChecks).every(check => check);

    // Projected email volume
    const projectedEmails = {
      day1: enrichedReady || 0,
      day2: Math.round((enrichedReady || 0) * 0.35), // 35% get 2nd email
      day3: Math.round((enrichedReady || 0) * 0.25), // 25% get 3rd email
      total: Math.round((enrichedReady || 0) * 1.6)
    };

    // Expected conversions
    const expectedConversions = {
      opens: Math.round(projectedEmails.total * 0.35),
      clicks: Math.round(projectedEmails.total * 0.05),
      replies: Math.round(projectedEmails.total * 0.02),
      newUsers: Math.round(projectedEmails.total * 0.01)
    };

    return NextResponse.json({
      overview: {
        totalLeads: totalLeads || 0,
        scoredLeads: scoredLeads || 0,
        qualifiedLeads: qualifiedLeads,
        enrichedReady: enrichedReady || 0,
        daysCollecting: daysCollecting
      },
      qualityBreakdown: {
        premium: {
          count: premiumLeads || 0,
          label: '70-100 (Premium)',
          percentage: scoredLeads ? Math.round((premiumLeads || 0) / scoredLeads * 100) : 0
        },
        good: {
          count: goodLeads || 0,
          label: '60-69 (Good)',
          percentage: scoredLeads ? Math.round((goodLeads || 0) / scoredLeads * 100) : 0
        },
        totalQualified: {
          count: qualifiedLeads,
          percentage: scoredLeads ? Math.round(qualifiedLeads / scoredLeads * 100) : 0
        }
      },
      launchCriteria: {
        checks: readyChecks,
        targets: criteria,
        isReadyToLaunch: isReady
      },
      outreach: {
        status: outreachEnabled ? 'ACTIVE' : 'PAUSED',
        enabled: outreachEnabled,
        instruction: outreachEnabled
          ? 'Outreach is ACTIVE - emails being sent'
          : 'Set OUTREACH_ENABLED=true in .env.local to activate'
      },
      projections: {
        emailVolume: projectedEmails,
        expectedResults: expectedConversions
      },
      recommendations: isReady
        ? [
            '✅ You have enough quality leads to launch!',
            `✅ ${enrichedReady} leads ready to contact`,
            '✅ Projected: ' + expectedConversions.newUsers + ' new users',
            '🚀 Enable outreach: OUTREACH_ENABLED=true in .env.local'
          ]
        : [
            `⏳ Collecting data... (Day ${daysCollecting} of 3)`,
            `📊 ${totalLeads}/${criteria.minimumLeads} total leads`,
            `🎯 ${qualifiedLeads}/${criteria.minimumQualified} qualified leads`,
            `📧 ${enrichedReady}/${criteria.minimumEnriched} enriched & ready`,
            '⏰ Continue collecting - you\'ll be ready soon!'
          ]
    });

  } catch (error: any) {
    console.error('Launch readiness error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
