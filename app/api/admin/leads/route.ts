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
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const minScore = searchParams.get('minScore');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source_type', source);
    }

    if (minScore) {
      query = query.gte('fit_score', parseFloat(minScore));
    }

    const { data: leads, error } = await query;

    if (error) throw error;

    return NextResponse.json({ leads });

  } catch (error: any) {
    console.error('Admin leads error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
