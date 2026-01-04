import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      // Return free plan info
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('slug', 'free')
        .single();

      return NextResponse.json({
        plan: freePlan,
        status: 'active',
        introductions_remaining: 0
      });
    }

    return NextResponse.json(subscription);

  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
