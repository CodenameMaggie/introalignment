import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await request.json();

    // Get available credits (oldest first, not expired)
    const { data: credits } = await supabase
      .from('introduction_credits')
      .select('*')
      .eq('user_id', user.id)
      .gt('credits_remaining', 0)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(1);

    if (!credits?.length) {
      return NextResponse.json(
        { error: 'No introduction credits available', code: 'NO_CREDITS' },
        { status: 402 }
      );
    }

    const credit = credits[0];

    // Deduct credit
    await supabase
      .from('introduction_credits')
      .update({
        credits_used: credit.credits_used + 1,
        credits_remaining: credit.credits_remaining - 1
      })
      .eq('id', credit.id);

    // Update subscription counter
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('introductions_used, introductions_remaining')
      .eq('user_id', user.id)
      .single();

    if (sub) {
      await supabase
        .from('user_subscriptions')
        .update({
          introductions_used: (sub.introductions_used || 0) + 1,
          introductions_remaining: (sub.introductions_remaining || 0) - 1
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Use introduction error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
