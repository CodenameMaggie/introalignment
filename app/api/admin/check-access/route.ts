import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { checkAdminAccess } from '@/lib/admin/auth';

/**
 * Check if the current user has admin access
 * GET /api/admin/check-access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();

    // Get user from session
    // First try to get from localStorage (passed as header in the request)
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', isAdmin: false },
        { status: 401 }
      );
    }

    const sessionData = authHeader.replace('Bearer ', '');
    let userId: string;

    try {
      const session = JSON.parse(sessionData);
      userId = session.user?.id;

      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid session', isAdmin: false },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid session format', isAdmin: false },
        { status: 401 }
      );
    }

    // Check if user has admin access
    const isAdmin = await checkAdminAccess(userId);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', isAdmin: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      userId
    });
  } catch (error) {
    console.error('Admin access check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', isAdmin: false },
      { status: 500 }
    );
  }
}
