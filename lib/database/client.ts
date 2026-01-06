/**
 * Database Client - Unified interface for Supabase and Railway PostgreSQL
 *
 * This module provides a single interface that works with both:
 * - Supabase (for auth, storage, real-time features)
 * - Railway PostgreSQL (for production database)
 *
 * Usage:
 * - Development: Uses Supabase
 * - Production (Railway): Uses Railway PostgreSQL + Supabase Auth
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/server';

export type DatabaseClient = Awaited<ReturnType<typeof createSupabaseClient>>;

/**
 * Get the appropriate database client based on environment
 */
export async function getDatabaseClient(): Promise<DatabaseClient> {
  // For now, always use Supabase
  // Railway PostgreSQL connection can be added here when needed
  return await createSupabaseClient();
}

/**
 * Get Railway PostgreSQL connection string (if configured)
 */
export function getRailwayDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

/**
 * Check if Railway PostgreSQL is configured
 */
export function isRailwayPostgresConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Get current database provider
 */
export function getDatabaseProvider(): 'supabase' | 'railway' | 'mixed' {
  const hasRailway = isRailwayPostgresConfigured();
  const hasSupabase = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (hasRailway && hasSupabase) return 'mixed';
  if (hasRailway) return 'railway';
  return 'supabase';
}

/**
 * Log database configuration (for debugging)
 */
export function logDatabaseConfig() {
  const provider = getDatabaseProvider();
  const config = {
    provider,
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    railway: {
      configured: isRailwayPostgresConfigured(),
      url: process.env.DATABASE_URL ? 'postgresql://...' : undefined
    },
    environment: process.env.NODE_ENV
  };

  console.log('[Database Config]', JSON.stringify(config, null, 2));
  return config;
}
