import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { logAdminAction } from '@/lib/admin/auth';

/**
 * POST /api/admin/red-flags/update
 * Update a red flag status
 */
export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const { flagId, status, resolutionNotes, adminUserId } = body;

    if (!flagId || !status) {
      return NextResponse.json(
        { error: 'flagId and status are required' },
        { status: 400 }
      );
    }

    // Get current flag data for audit log
    const { data: currentFlag } = await supabase
      .from('red_flags')
      .select('*')
      .eq('id', flagId)
      .single();

    // Update flag
    const updates: any = {
      status,
      reviewed_at: new Date().toISOString()
    };

    if (resolutionNotes) {
      updates.resolution_notes = resolutionNotes;
    }

    if (adminUserId) {
      updates.reviewed_by = adminUserId;
    }

    const { data, error } = await supabase
      .from('red_flags')
      .update(updates)
      .eq('id', flagId)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    if (adminUserId) {
      await logAdminAction({
        adminUserId,
        action: `red_flag_${status}`,
        targetType: 'red_flag',
        targetId: flagId,
        details: {
          before: currentFlag,
          after: data,
          notes: resolutionNotes
        }
      });
    }

    return NextResponse.json({ success: true, flag: data });
  } catch (error: any) {
    console.error('Error updating red flag:', error);
    return NextResponse.json(
      { error: 'Failed to update flag' },
      { status: 500 }
    );
  }
}
