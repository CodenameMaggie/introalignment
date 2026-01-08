import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check endpoint for Railway
 * Tests database connectivity and bot system status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Add timeout wrapper - Railway health checks should be fast
    const dbCheckPromise = (async () => {
      // Test database connection
      const { data: healthCheck, error } = await supabase
        .from('ai_bot_health')
        .select('bot_name, status')
        .limit(1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Get bot system status
      const { data: bots } = await supabase
        .from('ai_bot_health')
        .select('*')
        .in('bot_name', ['atlas', 'annie', 'henry', 'dave', 'dan', 'jordan']);

      return { healthCheck, bots };
    })();

    // Race the database check against an 8-second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 8000)
    );

    const { bots } = await Promise.race([dbCheckPromise, timeoutPromise]) as { healthCheck: any; bots: any };

    const activeBots = bots?.filter((b: any) => b.status === 'healthy').length || 0;
    const totalBots = 6;
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      bots: {
        active: activeBots,
        total: totalBots,
        health: bots || []
      },
      environment: process.env.NODE_ENV || 'development',
      deployment: 'railway',
      note: 'Use /api/ping for faster health checks without database'
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('[Health Check] Error:', error);
    console.error('[Health Check] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.error('[Health Check] NODE_ENV:', process.env.NODE_ENV);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'error',
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
        error: error.message || 'Unknown error',
        environment: process.env.NODE_ENV,
        note: 'Container is running but database connection failed. Use /api/ping to confirm container health.'
      },
      { status: 503 }
    );
  }
}
