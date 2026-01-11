import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { data: partners, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching partners:', error);
      return NextResponse.json(
        { error: 'Failed to fetch partners' },
        { status: 500 }
      );
    }

    // Get activity counts for each partner
    const partnersWithCounts = await Promise.all(
      (partners || []).map(async (partner) => {
        const { count: activityCount } = await supabase
          .from('partner_activities')
          .select('id', { count: 'exact', head: true })
          .eq('partner_id', partner.id);

        return {
          ...partner,
          activity_count: activityCount || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      partners: partnersWithCounts,
      total: partnersWithCounts.length
    });

  } catch (error: any) {
    console.error('Error in partners API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
