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
    // Get all sources
    const { data: allSources, error: allError } = await supabase
      .from('lead_sources')
      .select('*');

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }

    // Get active sources
    const { data: activeSources, error: activeError } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('is_active', true);

    // Get active Reddit sources (what scraper looks for)
    const { data: activeReddit, error: redditError } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('is_active', true)
      .eq('source_type', 'reddit');

    return NextResponse.json({
      total: allSources?.length || 0,
      active: activeSources?.length || 0,
      activeReddit: activeReddit?.length || 0,
      sources: allSources?.map(s => ({
        name: s.source_name,
        type: s.source_type,
        isActive: s.is_active,
        frequency: s.scrape_frequency
      })) || []
    });

  } catch (error: any) {
    console.error('Debug sources error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
