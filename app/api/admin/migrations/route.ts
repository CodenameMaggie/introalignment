import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/admin/migrations
 * List all SQL migration files with their contents
 */
export async function GET(request: NextRequest) {
  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

    // Read all files in the migrations directory
    const files = await fs.readdir(migrationsDir);

    // Filter for .sql files and sort them
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Read content of each file
    const migrations = await Promise.all(
      sqlFiles.map(async (filename) => {
        const filePath = path.join(migrationsDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);

        return {
          filename,
          content,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      })
    );

    return NextResponse.json({ migrations });
  } catch (error: any) {
    console.error('Error reading migration files:', error);
    return NextResponse.json(
      { error: 'Failed to read migration files' },
      { status: 500 }
    );
  }
}
