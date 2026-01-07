import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * GET /api/profile - Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
          { error: 'Invalid session' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid session format' },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get conversation status
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('status, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate profile completeness
    let completeness = 0;
    if (profile) {
      const fields = [
        profile.first_name,
        profile.last_name,
        profile.age,
        profile.gender,
        profile.location_city,
        profile.education,
        profile.occupation,
        profile.wants_children,
        profile.core_values,
        profile.life_vision_summary
      ];
      completeness = Math.round((fields.filter(f => f != null).length / fields.length) * 100);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        created_at: user.created_at
      },
      profile: profile || null,
      conversation: conversation || null,
      completeness
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
          { error: 'Invalid session' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid session format' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    const supabase = getAdminClient();

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
