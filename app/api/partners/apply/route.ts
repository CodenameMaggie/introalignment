import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // TODO: Send notification email to admin
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
