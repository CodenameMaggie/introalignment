import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*');

    if (leadsError) {
      return NextResponse.json({ error: leadsError.message }, { status: 500 });
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    // Get completed conversations
    const { data: conversations, error: convoError } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_complete', true);

    // Get matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*');

    // Calculate stats
    const totalLeads = leads?.length || 0;
    const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
    const totalUsers = users?.length || 0;
    const completedOnboarding = conversations?.length || 0;
    const totalMatches = matches?.length || 0;
    const pendingMatches = matches?.filter(m => m.status === 'pending').length || 0;
    const approvedMatches = matches?.filter(m => m.status === 'approved').length || 0;

    // By source
    const bySource: Record<string, number> = {};
    leads?.forEach(lead => {
      bySource[lead.source_type] = (bySource[lead.source_type] || 0) + 1;
    });

    // By status
    const byStatus: Record<string, number> = {};
    leads?.forEach(lead => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    });

    // Recent leads
    const recentLeads = leads
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(l => ({
        id: l.id,
        source: l.source_type,
        status: l.status,
        fitScore: l.fit_score,
        email: l.email,
        createdAt: l.created_at
      }));

    return NextResponse.json({
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) + '%' : '0%',
        bySource,
        byStatus,
        recent: recentLeads
      },
      users: {
        total: totalUsers,
        completedOnboarding
      },
      matches: {
        total: totalMatches,
        pending: pendingMatches,
        approved: approvedMatches
      }
    });

  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
