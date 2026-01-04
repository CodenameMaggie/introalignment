import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get('eid');
  const targetUrl = searchParams.get('url');

  if (enrollmentId && targetUrl) {
    try {
      // Find most recent email for this enrollment
      const { data: emailSend } = await supabase
        .from('email_sends')
        .select('id, lead_id, click_count, clicked_links')
        .eq('enrollment_id', enrollmentId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (emailSend) {
        // Update email send
        const clickedLinks = emailSend.clicked_links || [];
        clickedLinks.push(targetUrl);

        await supabase
          .from('email_sends')
          .update({
            status: 'clicked',
            clicked_at: new Date().toISOString(),
            click_count: emailSend.click_count + 1,
            clicked_links: clickedLinks
          })
          .eq('id', emailSend.id);

        // Update enrollment
        await supabase.rpc('increment_lead_clicks', {
          enrollment_id: enrollmentId
        });

        // Update lead
        await supabase
          .from('leads')
          .update({
            emails_clicked: supabase.sql`emails_clicked + 1`
          })
          .eq('id', emailSend.lead_id);
      }
    } catch (error) {
      console.error('Click tracking error:', error);
    }
  }

  // Redirect to actual URL
  return NextResponse.redirect(targetUrl || 'https://introalignment.com');
}
