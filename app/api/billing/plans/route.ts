import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  try {
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Plans fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
