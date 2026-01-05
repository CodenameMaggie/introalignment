import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * GET /api/admin/dashboard-metrics
 * Get overview metrics for admin dashboard
 */
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Users with complete profiles (status = 'active')
    const { count: completeProfiles } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Subscriptions by plan
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('plan_id')
      .eq('status', 'active');

    const subCounts = {
      free: 0,
      seeker: 0,
      aligned: 0,
      founder: 0
    };

    subscriptions?.forEach((sub) => {
      if (sub.plan_id?.includes('seeker')) subCounts.seeker++;
      else if (sub.plan_id?.includes('aligned')) subCounts.aligned++;
      else if (sub.plan_id?.includes('founder')) subCounts.founder++;
      else subCounts.free++;
    });

    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', startOfMonth.toISOString());

    const revenueThisMonth = invoices?.reduce((sum, inv) => sum + (inv.amount / 100), 0) || 0;

    // Matches this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: matchesThisWeek } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Introductions this week (matches where status != 'pending')
    const { count: introductionsThisWeek } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'pending')
      .gte('introduced_at', weekAgo.toISOString());

    // Active red flags
    const { count: activeRedFlags } = await supabase
      .from('red_flags')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'reviewing']);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      usersWithCompleteProfiles: completeProfiles || 0,
      subscriptions: subCounts,
      revenueThisMonth: Math.round(revenueThisMonth),
      matchesThisWeek: matchesThisWeek || 0,
      introductionsThisWeek: introductionsThisWeek || 0,
      activeRedFlags: activeRedFlags || 0
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
