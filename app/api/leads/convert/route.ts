import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/leads/convert
 *
 * Convert a lead to a user when they sign up from outreach
 * Called when someone clicks email link and completes signup
 */
export async function POST(req: NextRequest) {
  try {
    const { leadId, userId, email } = await req.json();

    if (!userId || (!leadId && !email)) {
      return NextResponse.json(
        { error: 'userId and (leadId or email) required' },
        { status: 400 }
      );
    }

    // Find the lead by ID or email
    let leadQuery = supabase.from('leads').select('*');

    if (leadId) {
      leadQuery = leadQuery.eq('id', leadId);
    } else if (email) {
      leadQuery = leadQuery.eq('email', email.toLowerCase());
    }

    const { data: lead, error: leadError } = await leadQuery.single();

    if (leadError || !lead) {
      // No lead found - this is fine, they might be organic signup
      return NextResponse.json({
        success: true,
        message: 'No lead found - organic signup',
        leadFound: false
      });
    }

    // Update lead record to mark conversion
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        converted_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    // Update source stats
    if (lead.source_id) {
      await supabase.rpc('increment_lead_source_conversion', {
        source_id_param: lead.source_id
      });
    }

    // Update sequence stats if they were in a sequence
    if (lead.current_sequence_id) {
      await supabase.rpc('increment_sequence_conversion', {
        sequence_id_param: lead.current_sequence_id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead converted successfully',
      leadFound: true,
      leadData: {
        source: lead.source_type,
        fitScore: lead.fit_score,
        emailsSent: lead.emails_sent
      }
    });

  } catch (error: any) {
    console.error('Lead conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
