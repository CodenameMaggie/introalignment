import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * Geographic Analytics API
 *
 * Provides state-by-state and regional analytics for:
 * - Attorney distribution
 * - Market gaps (high-value markets with few attorneys)
 * - Client geographic distribution
 * - Regional podcast outreach targeting
 */

export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'summary';

  try {
    switch (view) {
      case 'summary':
        return await getGeographicSummary(supabase);

      case 'by_state':
        return await getAttorneysByState(supabase);

      case 'by_region':
        return await getAttorneysByRegion(supabase);

      case 'market_gaps':
        return await getMarketGaps(supabase);

      case 'high_value_markets':
        return await getHighValueMarkets(supabase);

      case 'state_detail':
        const stateCode = searchParams.get('state');
        if (!stateCode) {
          return NextResponse.json({ error: 'State code required' }, { status: 400 });
        }
        return await getStateDetail(supabase, stateCode);

      case 'region_detail':
        const region = searchParams.get('region');
        if (!region) {
          return NextResponse.json({ error: 'Region required' }, { status: 400 });
        }
        return await getRegionDetail(supabase, region);

      default:
        return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Geographic Analytics] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function getGeographicSummary(supabase: any) {
  // Get total attorneys
  const { count: totalAttorneys } = await supabase
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved');

  // Get attorneys by region
  const { data: byRegion } = await supabase
    .from('partners_by_region')
    .select('*')
    .order('attorney_count', { ascending: false });

  // Get top 10 states
  const { data: topStates } = await supabase
    .from('partners_by_state')
    .select('*')
    .order('attorney_count', { ascending: false })
    .limit(10);

  // Get market gaps
  const { data: marketGaps, error: gapsError } = await supabase
    .rpc('get_market_gaps');

  // Get high-value markets
  const { data: highValueMarkets } = await supabase
    .from('high_value_markets')
    .select('*')
    .eq('market_priority', 'HIGH_OPPORTUNITY')
    .limit(10);

  return NextResponse.json({
    success: true,
    summary: {
      total_attorneys: totalAttorneys || 0,
      regions_covered: byRegion?.length || 0,
      states_covered: topStates?.length || 0,
      market_gaps: marketGaps?.length || 0
    },
    by_region: byRegion || [],
    top_states: topStates || [],
    market_gaps: marketGaps || [],
    high_value_markets: highValueMarkets || []
  });
}

async function getAttorneysByState(supabase: any) {
  const { data } = await supabase
    .from('partners_by_state')
    .select('*')
    .order('attorney_count', { ascending: false });

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getAttorneysByRegion(supabase: any) {
  const { data } = await supabase
    .from('partners_by_region')
    .select('*')
    .order('attorney_count', { ascending: false });

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getMarketGaps(supabase: any) {
  const { data, error } = await supabase.rpc('get_market_gaps');

  if (error) {
    throw error;
  }

  return NextResponse.json({
    success: true,
    message: 'High-value markets with insufficient attorney coverage',
    data: data || []
  });
}

async function getHighValueMarkets(supabase: any) {
  const { data } = await supabase
    .from('high_value_markets')
    .select('*')
    .in('market_priority', ['HIGH_OPPORTUNITY', 'MEDIUM_OPPORTUNITY'])
    .order('market_priority', { ascending: true });

  return NextResponse.json({
    success: true,
    data: data || []
  });
}

async function getStateDetail(supabase: any, stateCode: string) {
  // Get state info
  const { data: stateInfo } = await supabase
    .from('us_states')
    .select('*')
    .eq('state_code', stateCode)
    .single();

  if (!stateInfo) {
    return NextResponse.json({ error: 'State not found' }, { status: 404 });
  }

  // Get attorneys in state
  const { data: attorneys } = await supabase
    .rpc('get_attorneys_by_state', { p_state_code: stateCode });

  // Get state stats from partners_by_state view
  const { data: stats } = await supabase
    .from('partners_by_state')
    .select('*')
    .or(`state.eq.${stateCode},state.eq.${stateInfo.state_name}`)
    .single();

  return NextResponse.json({
    success: true,
    state_info: stateInfo,
    stats: stats || {
      attorney_count: attorneys?.length || 0,
      podcast_engaged: 0,
      practice_owners: 0,
      multi_state_attorneys: 0,
      avg_years_experience: 0
    },
    attorneys: attorneys || []
  });
}

async function getRegionDetail(supabase: any, region: string) {
  // Get region stats
  const { data: stats } = await supabase
    .from('partners_by_region')
    .select('*')
    .eq('region', region)
    .single();

  // Get attorneys in region
  const { data: attorneys } = await supabase
    .rpc('get_attorneys_by_region', { p_region: region });

  // Get states in region
  const { data: states } = await supabase
    .from('us_states')
    .select('*')
    .eq('region', region)
    .order('state_name');

  return NextResponse.json({
    success: true,
    region,
    stats: stats || {},
    states: states || [],
    attorneys: attorneys || []
  });
}
