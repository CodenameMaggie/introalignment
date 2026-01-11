import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { partner_id, status, partner_type, podcast_status, notes } = await request.json();

    if (!partner_id) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (status) updates.status = status;
    if (partner_type) updates.partner_type = partner_type;
    if (podcast_status) updates.podcast_status = podcast_status;
    if (notes !== undefined) updates.internal_notes = notes;

    // Update partner
    const { data: partner, error } = await supabase
      .from('partners')
      .update(updates)
      .eq('id', partner_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating partner:', error);
      return NextResponse.json(
        { error: 'Failed to update partner' },
        { status: 500 }
      );
    }

    // Log activity
    const activityDescriptions: Record<string, string> = {
      'pending': 'Status changed to Pending Review',
      'approved': 'Partner application APPROVED',
      'rejected': 'Partner application rejected',
      'on_hold': 'Partner application placed on hold'
    };

    if (status) {
      await supabase.from('partner_activities').insert([
        {
          partner_id,
          activity_type: 'status_change',
          activity_title: 'Status Updated',
          activity_description: activityDescriptions[status] || `Status changed to ${status}`,
          outcome: status === 'approved' ? 'positive' : status === 'rejected' ? 'negative' : 'neutral'
        }
      ]);
    }

    return NextResponse.json({
      success: true,
      partner
    });

  } catch (error: any) {
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
