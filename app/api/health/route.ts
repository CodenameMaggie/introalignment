import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check endpoint for Railway
 * Tests database connectivity and bot system status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Test database connection
    const { data: healthCheck, error } = await supabase
      .from('ai_bot_health')
      .select('bot_name, status')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error.message
        },
        { status: 503 }
      );
    }

    // Get bot system status
    const { data: bots } = await supabase
      .from('ai_bot_health')
      .select('*')
      .in('bot_name', ['atlas', 'annie', 'henry', 'dave', 'dan', 'jordan']);

    const activeBots = bots?.filter(b => b.status === 'healthy').length || 0;
    const totalBots = 6;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      bots: {
        active: activeBots,
        total: totalBots,
        health: bots || []
      },
      environment: process.env.NODE_ENV || 'development',
      deployment: 'railway'
    });

  } catch (error: any) {
    console.error('[Health Check] Error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: error.message || 'Unknown error'
      },
      { status: 503 }
    );
  }
}
