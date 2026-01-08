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

    // Check if this signup came from a lead (outreach campaign)
    const { data: lead } = await supabase
      .from('leads')
      .select('id, source_type, fit_score, current_sequence_id')
      .eq('email', email.toLowerCase())
      .single();

    if (lead) {
      // Mark lead as converted
      await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          converted_user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      console.log(`Lead ${lead.id} converted to user ${user.id} from ${lead.source_type}`);
    }

    // Send welcome email via Forbes Command Center
    const { sendWaitlistWelcome } = await import('@/lib/email/forbes-command-center');
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
      message: 'Successfully joined the waitlist!',
      leadConverted: !!lead
    });

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
