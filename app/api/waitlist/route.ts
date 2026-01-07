import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

// POST /api/waitlist - Add someone to the waitlist
export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, location } = await request.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: 'You\'re already on the waitlist!' },
        { status: 200 }
      );
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: `${firstName} ${lastName}`,
        status: 'waitlist'
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    // Create profile record with location
    if (location) {
      await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          location_city: location
        });
    }

    // Send welcome email
    const { sendWaitlistWelcome } = await import('@/lib/email/resend');
    const emailResult = await sendWaitlistWelcome({
      email: email.toLowerCase(),
      firstName,
      lastName
    });

    if (!emailResult.success) {
      console.warn('Failed to send welcome email:', emailResult.error);
      // Don't fail the request if email fails - user is still on waitlist
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!'
    });

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
