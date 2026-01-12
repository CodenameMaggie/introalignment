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
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  try {
    let partnerId: string | null = null;

    // Method 1: Token-based unsubscribe (most secure)
    if (token) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('unsubscribe_tokens')
        .select('partner_id, expires_at, used_at')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.redirect(new URL('/unsubscribe?status=invalid', request.url));
      }

      // Check if token expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.redirect(new URL('/unsubscribe?status=expired', request.url));
      }

      // Check if already used
      if (tokenData.used_at) {
        return NextResponse.redirect(new URL('/unsubscribe?status=already', request.url));
      }

      partnerId = tokenData.partner_id;

      // Mark token as used
      await supabase
        .from('unsubscribe_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);
    }
    // Method 2: Email-based unsubscribe (backup)
    else if (email) {
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('email', email)
        .single();

      if (!partner) {
        return NextResponse.redirect(new URL('/unsubscribe?status=notfound', request.url));
      }

      partnerId = partner.id;
    } else {
      return NextResponse.redirect(new URL('/unsubscribe?status=invalid', request.url));
    }

    // Unsubscribe the partner
    if (partnerId) {
      await supabase
        .from('partners')
        .update({
          email_unsubscribed: true,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      // Log activity
      await supabase.from('partner_activities').insert([
        {
          partner_id: partnerId,
          activity_type: 'unsubscribe',
          activity_title: 'Email Unsubscribed',
          activity_description: 'Partner unsubscribed from email communications',
          outcome: 'neutral'
        }
      ]);
    }

    return NextResponse.redirect(new URL('/unsubscribe?status=success', request.url));

  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(new URL('/unsubscribe?status=error', request.url));
  }
}
