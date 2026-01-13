import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/forbes-command-center';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const data = await request.json();

    // Parse array fields (comma-separated strings to arrays)
    const licensed_states = data.licensed_states
      ? data.licensed_states.split(',').map((s: string) => s.trim())
      : [];

    const specializations = data.specializations
      ? data.specializations.split(',').map((s: string) => s.trim())
      : [];

    const podcast_topics = data.podcast_interest && data.podcast_topics
      ? data.podcast_topics.split(',').map((s: string) => s.trim())
      : [];

    const publications = data.publications
      ? [data.publications]
      : [];

    // Prepare partner record
    const partnerData = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      linkedin_url: data.linkedin_url || null,
      website_url: data.website_url || null,
      professional_title: data.professional_title,
      firm_name: data.firm_name || null,
      bar_number: data.bar_number || null,
      licensed_states,
      years_experience: parseInt(data.years_experience) || 0,
      specializations,
      bio: data.bio,
      publications,
      podcast_interest: data.podcast_interest || false,
      podcast_topics: data.podcast_interest ? podcast_topics : [],
      podcast_status: data.podcast_interest ? 'interested' : 'not_interested',
      partner_type: 'prospect',
      partnership_tier: data.partnership_interest || 'consultant',
      status: 'pending',
      source: 'inbound_application',
      initial_contact_date: new Date().toISOString().split('T')[0],
      internal_notes: data.how_found ? `How found: ${data.how_found}` : null
    };

    // Insert into partners table
    const { data: partner, error } = await supabase
      .from('partners')
      .insert([partnerData])
      .select()
      .single();

    if (error) {
      console.error('Error inserting partner:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('partner_activities').insert([
      {
        partner_id: partner.id,
        activity_type: 'application',
        activity_title: 'Partner Application Submitted',
        activity_description: `New partner application from ${data.full_name} (${data.professional_title})`,
        outcome: 'positive',
        next_steps: 'Review application and schedule initial call'
      }
    ]);

    // Send notification to admin team
    try {
      await sendEmail({
        from: 'henry@introconnected.com',
        to: 'henry@introconnected.com',
        subject: `⚖️ New Partner Application: ${data.full_name} - ${data.professional_title}`,
        html: `
          <div style="font-family: 'Courier New', monospace; max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: #2c3e50; color: #B8935F; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">⚖️ NEW PARTNER APPLICATION</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.8;">IntroAlignment Attorney Network</p>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1a1a1a; margin-top: 0; border-bottom: 2px solid #B8935F; padding-bottom: 10px;">Attorney Details</h2>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 180px;"><strong>Full Name:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${data.full_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #B8935F;">${data.email}</a></td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${data.phone}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Professional Title:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a; font-weight: bold;">${data.professional_title}</td>
                </tr>
                ${data.firm_name ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Firm Name:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${data.firm_name}</td>
                </tr>
                ` : ''}
                ${data.bar_number ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Bar Number:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${data.bar_number}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Years Experience:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${data.years_experience} years</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Licensed States:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${licensed_states.join(', ')}</td>
                </tr>
                ${data.website_url ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Website:</strong></td>
                  <td style="padding: 8px 0;"><a href="${data.website_url}" style="color: #B8935F;">${data.website_url}</a></td>
                </tr>
                ` : ''}
                ${data.linkedin_url ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>LinkedIn:</strong></td>
                  <td style="padding: 8px 0;"><a href="${data.linkedin_url}" style="color: #B8935F;">${data.linkedin_url}</a></td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Partnership Tier:</strong></td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${data.partnership_interest || 'consultant'}</td>
                </tr>
              </table>

              <h3 style="color: #1a1a1a; margin-top: 20px; border-bottom: 2px solid #B8935F; padding-bottom: 10px;">Specializations</h3>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; color: #1a1a1a;">
                ${specializations.length > 0 ? specializations.join(', ') : 'Not specified'}
              </div>

              <h3 style="color: #1a1a1a; margin-top: 20px; border-bottom: 2px solid #B8935F; padding-bottom: 10px;">Bio</h3>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; color: #1a1a1a; line-height: 1.6;">
                ${data.bio || 'Not provided'}
              </div>

              ${data.podcast_interest ? `
              <div style="margin-top: 20px; padding: 20px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #2e7d32;">🎙️ Podcast Interest: YES</h3>
                ${podcast_topics.length > 0 ? `
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Topics:</strong> ${podcast_topics.join(', ')}</p>
                ` : ''}
              </div>
              ` : ''}

              ${data.how_found ? `
              <div style="margin-top: 20px; padding: 15px; background: #fff9e6; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #333;"><strong>How they found us:</strong> ${data.how_found}</p>
              </div>
              ` : ''}

              <div style="margin-top: 30px; padding: 20px; background: #f0f8ff; border-left: 4px solid #4a90e2; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #4a90e2;">Next Steps</h3>
                <ol style="margin: 10px 0; padding-left: 20px; color: #333;">
                  <li>Review attorney's credentials and specializations</li>
                  <li>Verify bar number and licensure status</li>
                  <li>Schedule initial vetting call</li>
                  ${data.podcast_interest ? '<li>Add to podcast outreach sequence</li>' : ''}
                  <li>Update status to "approved" or "rejected"</li>
                </ol>
              </div>

              <div style="margin-top: 20px; padding: 15px; background: #fffbf0; border: 1px solid #B8935F; border-radius: 4px; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 12px;">
                  <strong>Partner ID:</strong> ${partner.id}<br>
                  <strong>Application Date:</strong> ${new Date().toLocaleString()}<br>
                  <strong>Status:</strong> Pending Review
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
⚖️ NEW PARTNER APPLICATION - IntroAlignment

ATTORNEY DETAILS
================
Name: ${data.full_name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
Professional Title: ${data.professional_title}
${data.firm_name ? `Firm: ${data.firm_name}` : ''}
${data.bar_number ? `Bar Number: ${data.bar_number}` : ''}
Years Experience: ${data.years_experience}
Licensed States: ${licensed_states.join(', ')}
${data.website_url ? `Website: ${data.website_url}` : ''}
${data.linkedin_url ? `LinkedIn: ${data.linkedin_url}` : ''}
Partnership Tier: ${data.partnership_interest || 'consultant'}

SPECIALIZATIONS
===============
${specializations.length > 0 ? specializations.join(', ') : 'Not specified'}

BIO
===
${data.bio || 'Not provided'}

${data.podcast_interest ? `
PODCAST INTEREST: YES
${podcast_topics.length > 0 ? `Topics: ${podcast_topics.join(', ')}` : ''}
` : ''}

${data.how_found ? `How they found us: ${data.how_found}` : ''}

NEXT STEPS
==========
1. Review attorney's credentials and specializations
2. Verify bar number and licensure status
3. Schedule initial vetting call
${data.podcast_interest ? '4. Add to podcast outreach sequence' : ''}
5. Update status to "approved" or "rejected"

---
Partner ID: ${partner.id}
Application Date: ${new Date().toLocaleString()}
Status: Pending Review
        `
      });
      console.log(`[Partner Application] Admin notification sent to henry@introconnected.com`);
    } catch (emailError) {
      console.error('[Partner Application] Error sending admin notification:', emailError);
      // Don't fail the application if email fails
    }

    // TODO: Send confirmation email to applicant

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      partner_id: partner.id
    });

  } catch (error: any) {
    console.error('Error processing partner application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
