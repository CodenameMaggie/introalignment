import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * Email Reply Tracking API
 *
 * Logs email replies and responses from recipients
 * Can be called manually or via webhook from Forbes Command Center
 */

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const body = await request.json();
    const {
      recipient_email, // Who we sent the original email to
      from_email, // Who replied (should match recipient_email)
      subject,
      body_text,
      body_html,
      sentiment, // 'positive', 'neutral', 'negative'
      interest_level, // 'very_interested', 'interested', 'maybe', 'not_interested'
      action_required, // 'schedule_call', 'send_info', 'follow_up', 'no_action'
      received_at,
      message_id // Optional: Email message ID
    } = body;

    // Validate required fields
    if (!recipient_email || !from_email || !body_text) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: recipient_email, from_email, body_text'
      }, { status: 400 });
    }

    // Find the original outreach email
    const { data: originalEmail } = await supabase
      .from('outreach_email_log')
      .select('*')
      .eq('recipient_email', recipient_email)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (!originalEmail) {
      console.warn(`[Reply Tracking] No outreach email found for ${recipient_email}`);
      return NextResponse.json({
        success: false,
        error: 'No original email found for this recipient'
      }, { status: 404 });
    }

    // Log the reply using the database function
    const { data: replyId, error: replyError } = await supabase
      .rpc('log_email_reply', {
        p_outreach_email_id: originalEmail.id,
        p_from_email: from_email,
        p_to_email: 'hello@introalignment.com',
        p_subject: subject || 'Re: ' + (originalEmail.subject || ''),
        p_body_text: body_text,
        p_sentiment: sentiment,
        p_interest_level: interest_level
      });

    if (replyError) {
      console.error('[Reply Tracking] Error logging reply:', replyError);
      return NextResponse.json({
        success: false,
        error: replyError.message
      }, { status: 500 });
    }

    // If action_required specified, update the reply record
    if (action_required && replyId) {
      await supabase
        .from('email_replies')
        .update({
          action_required,
          body_html: body_html || null,
          in_reply_to_message_id: message_id || null,
          received_at: received_at || new Date().toISOString()
        })
        .eq('id', replyId);
    }

    // Update partner engagement status if highly interested
    if (interest_level === 'very_interested' || interest_level === 'interested') {
      if (originalEmail.recipient_type === 'partner' && originalEmail.recipient_id) {
        await supabase
          .from('partners')
          .update({
            partner_type: 'interested',
            status: originalEmail.campaign_type === 'podcast_invitation'
              ? 'approved'
              : originalEmail.partner_type
          })
          .eq('id', originalEmail.recipient_id);
      }
    }

    console.log(`[Reply Tracking] Reply logged for ${recipient_email} - ${interest_level || 'no sentiment'}`);

    return NextResponse.json({
      success: true,
      reply_id: replyId,
      message: 'Reply logged successfully',
      interest_level,
      action_required: action_required || 'no_action'
    });

  } catch (error: any) {
    console.error('[Reply Tracking] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET: Retrieve reply statistics
 */
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const email = searchParams.get('email');

  try {
    if (email) {
      // Get replies for specific email address
      const { data: replies } = await supabase
        .from('email_replies')
        .select(`
          *,
          outreach_email:outreach_email_log(*)
        `)
        .eq('from_email', email)
        .order('received_at', { ascending: false });

      return NextResponse.json({
        success: true,
        email,
        reply_count: replies?.length || 0,
        replies: replies || []
      });
    } else {
      // Get overall reply statistics
      const { data: stats } = await supabase
        .rpc('get_reply_stats', { p_days: days })
        .single();

      return NextResponse.json({
        success: true,
        days,
        stats: stats || {}
      });
    }
  } catch (error: any) {
    console.error('[Reply Tracking] Error fetching stats:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
