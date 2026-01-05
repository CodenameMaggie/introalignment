import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * GET /api/admin/red-flags
 * Get all red flags with filters
 */
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const severity = searchParams.get('severity');

  try {
    let query = supabase
      .from('red_flags')
      .select(`
        *,
        user:users!red_flags_user_id_fkey (
          id,
          full_name,
          email
        ),
        reviewer:users!red_flags_reviewed_by_fkey (
          id,
          full_name
        )
      `)
      .order('detected_at', { ascending: false });

    // Filter by status
    if (status === 'active') {
      query = query.in('status', ['new', 'reviewing']);
    } else if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by severity
    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    const { data: flags, error } = await query;

    if (error) throw error;

    // Transform data
    const transformedFlags = flags?.map(flag => ({
      id: flag.id,
      user_id: flag.user_id,
      user_name: flag.user?.full_name || 'Unknown',
      user_email: flag.user?.email || '',
      flag_type: flag.flag_type,
      severity: flag.severity,
      source: flag.source,
      evidence: flag.evidence,
      status: flag.status,
      detected_at: flag.detected_at,
      reviewed_by_name: flag.reviewer?.full_name,
      resolution_notes: flag.resolution_notes
    })) || [];

    return NextResponse.json({ flags: transformedFlags });
  } catch (error: any) {
    console.error('Error fetching red flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch red flags' },
      { status: 500 }
    );
  }
}
