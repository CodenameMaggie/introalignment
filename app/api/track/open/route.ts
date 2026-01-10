import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get('eid');

  if (enrollmentId) {
    try {
      // Find most recent email for this enrollment
      const { data: emailSend } = await supabase
        .from('email_sends')
        .select('id, lead_id, open_count')
        .eq('enrollment_id', enrollmentId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (emailSend) {
        // Update email send
        await supabase
          .from('email_sends')
          .update({
            status: 'opened',
            opened_at: new Date().toISOString(),
            open_count: emailSend.open_count + 1
          })
          .eq('id', emailSend.id);

        // Update enrollment
        await supabase.rpc('increment_lead_opens', {
          enrollment_id: enrollmentId
        });

        // Update lead - fetch current count first
        const { data: lead } = await supabase
          .from('leads')
          .select('emails_opened')
          .eq('id', emailSend.lead_id)
          .single();

        if (lead) {
          await supabase
            .from('leads')
            .update({
              emails_opened: (lead.emails_opened || 0) + 1
            })
            .eq('id', emailSend.lead_id);
        }
      }
    } catch (error) {
      console.error('Tracking error:', error);
    }
  }

  return new NextResponse(TRACKING_PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}
