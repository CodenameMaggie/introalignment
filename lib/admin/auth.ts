/**
 * Admin Authentication & Authorization
 * Checks if a user has admin access
 */

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
