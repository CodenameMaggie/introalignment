import { NextResponse } from 'next/server';

/**
 * Simple ping endpoint for Railway health checks
 * No database connection required - just confirms the container is alive
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
}
