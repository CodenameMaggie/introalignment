import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { sendEmail } from '@/lib/email/forbes-command-center';

/**
 * Client Inquiry API
 *
 * Handles new client inquiries from the /signup page
 * Stores client information and triggers attorney matching workflow
 */

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.full_name || !data.email || !data.estate_size || !data.legal_needs || !data.primary_residence) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('client_inquiries')
      .select('id, email')
      .eq('email', data.email.toLowerCase())
      .single();

    if (existingClient) {
      return NextResponse.json({
        success: false,
        error: 'An inquiry from this email already exists. We will contact you soon.'
      }, { status: 400 });
    }

    // Prepare client inquiry data
    const clientData = {
      full_name: data.full_name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      estate_size: data.estate_size,
      primary_residence: data.primary_residence,
      legal_needs: data.legal_needs, // Array of strings
      urgency: data.urgency || 'next_3_months',
      additional_info: data.additional_info || null,
      source: data.how_found || 'website_signup',
      status: 'new', // new, contacted, matched, converted
      inquiry_date: new Date().toISOString().split('T')[0],
      match_status: 'pending' // pending, matched, no_match
    };

    // Insert into client_inquiries table
    const { data: client, error } = await supabase
      .from('client_inquiries')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      console.error('[Client Inquiry] Error inserting:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to submit inquiry. Please try again.'
      }, { status: 500 });
    }

    console.log(`[Client Inquiry] New inquiry from ${data.full_name} (${data.email}) - Estate: ${data.estate_size}`);

    // Send confirmation email to client
    try {
      await sendEmail({
        to: data.email,
        subject: 'IntroAlignment - Inquiry Received',
        html: `
          <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1A1A1A; font-size: 32px; margin: 0;">IntroAlignment</h1>
              <p style="color: #D4AF37; font-size: 14px; margin: 5px 0;">Elite Legal Network</p>
            </div>

            <div style="background: #F9F9F7; padding: 30px; border-radius: 8px; border-left: 4px solid #D4AF37;">
              <h2 style="color: #1A1A1A; margin-top: 0;">Thank You, ${data.full_name.split(' ')[0]}</h2>

              <p style="color: #4A4A4A; line-height: 1.6;">
                We've received your inquiry for estate planning services. Our team will review your needs and connect you with qualified attorneys in ${data.primary_residence} who specialize in:
              </p>

              <ul style="color: #4A4A4A; line-height: 1.8;">
                ${data.legal_needs.map((need: string) => `<li>${need}</li>`).join('')}
              </ul>

              <p style="color: #4A4A4A; line-height: 1.6;">
                <strong>What's Next:</strong>
              </p>
              <ol style="color: #4A4A4A; line-height: 1.8;">
                <li>We'll match you with attorneys specializing in your needs (1-2 business days)</li>
                <li>You'll receive attorney profiles and consultation options</li>
                <li>Schedule consultations with your preferred attorneys</li>
              </ol>

              <p style="color: #4A4A4A; line-height: 1.6; margin-top: 20px;">
                If you have urgent needs or questions, reply to this email anytime.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E5E5;">
              <p style="color: #8A8A8A; font-size: 12px; line-height: 1.6;">
                IntroAlignment is a professional networking platform connecting clients with licensed attorneys.<br>
                This email does not constitute legal advice.
              </p>
            </div>
          </div>
        `,
        text: `
IntroAlignment - Inquiry Received

Thank you, ${data.full_name.split(' ')[0]}!

We've received your inquiry for estate planning services in ${data.primary_residence}.

Your selected legal needs:
${data.legal_needs.map((need: string) => `- ${need}`).join('\n')}

What's Next:
1. We'll match you with specialized attorneys (1-2 business days)
2. You'll receive attorney profiles and consultation options
3. Schedule consultations with your preferred attorneys

If you have urgent needs, reply to this email anytime.

IntroAlignment - Elite Legal Network
        `,
        replyTo: 'hello@introalignment.com'
      });
    } catch (emailError) {
      console.error('[Client Inquiry] Error sending confirmation email:', emailError);
      // Don't fail the inquiry if email fails
    }

    // TODO: Trigger Dave bot to match with attorneys
    // TODO: Send notification to admin team

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully',
      client_id: client.id
    });

  } catch (error: any) {
    console.error('[Client Inquiry] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET: Retrieve client inquiries (admin only)
 */
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const urgency = searchParams.get('urgency');

  try {
    let query = supabase
      .from('client_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (urgency) {
      query = query.eq('urgency', urgency);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: inquiries?.length || 0,
      inquiries: inquiries || []
    });

  } catch (error: any) {
    console.error('[Client Inquiry] Error fetching inquiries:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
