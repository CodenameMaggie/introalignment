/**
 * Admin Authentication & Authorization
 * Checks if a user has admin access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

export async function checkAdminAccess(userId: string): Promise<boolean> {
  const supabase = getAdminClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return false;
  }

  // Check if user has admin role OR is Maggie's email
  return user.role === 'admin' || user.email === 'maggie@maggieforbesstrategies.com';
}

/**
 * Verify admin access from a Next.js API request
 * Returns the user ID if authorized, or null if not
 */
export async function verifyAdminRequest(request: NextRequest): Promise<{
  isAuthorized: boolean;
  userId?: string;
  error?: NextResponse;
}> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isAuthorized: false,
      error: NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    };
  }

  const sessionData = authHeader.replace('Bearer ', '');
  let userId: string;

  try {
    const session = JSON.parse(sessionData);
    userId = session.user?.id;

    if (!userId) {
      return {
        isAuthorized: false,
        error: NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        )
      };
    }
  } catch {
    return {
      isAuthorized: false,
      error: NextResponse.json(
        { error: 'Invalid session format' },
        { status: 401 }
      )
    };
  }

  // Check admin access
  const isAdmin = await checkAdminAccess(userId);

  if (!isAdmin) {
    return {
      isAuthorized: false,
      error: NextResponse.json(
        { error: 'Forbidden - Admin privileges required' },
        { status: 403 }
      )
    };
  }

  return {
    isAuthorized: true,
    userId
  };
}

export async function logAdminAction(params: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const supabase = getAdminClient();

  await supabase.from('admin_audit_log').insert({
    admin_user_id: params.adminUserId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    details: params.details,
    ip_address: params.ipAddress,
    user_agent: params.userAgent
  });
}
