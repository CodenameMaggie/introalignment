import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { PartnerOutreachEngine } from '@/lib/outreach/partner-outreach-engine';

/**
 * CSV Import API for Podcast Guest Prospects
 *
 * Accepts CSV file with estate planning attorney prospects
 * Batch imports into partners table
 */

interface CSVRow {
  full_name: string;
  email: string;
  professional_title?: string;
  firm_name?: string;
  years_experience?: number;
  licensed_states?: string; // Semicolon-separated: "California;Nevada;Delaware"
  specializations?: string; // Semicolon-separated: "Dynasty Trusts;Asset Protection"
  practice_type?: string; // solo, small_firm_founder, boutique_partner, biglaw
  multi_state_practice?: boolean;
  practice_owner?: boolean;
  asset_protection_specialist?: boolean;
  dynasty_trust_specialist?: boolean;
  international_planning?: boolean;
  actec_fellow?: boolean;
  wealthcounsel_member?: boolean;
  content_creator?: boolean;
  conference_speaker?: boolean;
  cle_instructor?: boolean;
  estate_size_focus?: string;
  website_url?: string;
  linkedin_url?: string;
  source?: string;
}

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Read CSV file
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'CSV file is empty or invalid'
      }, { status: 400 });
    }

    console.log(`[Import] Processing ${rows.length} prospects from CSV`);

    // Prepare partner records
    const partners = rows.map((row: any) => {
      // Parse semicolon-separated arrays
      const licensed_states = row.licensed_states
        ? row.licensed_states.split(';').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const specializations = row.specializations
        ? row.specializations.split(';').map((s: string) => s.trim()).filter(Boolean)
        : [];

      // Calculate num_states_licensed
      const num_states_licensed = licensed_states.length;
      const multi_state_practice = num_states_licensed >= 2;

      return {
        full_name: row.full_name,
        email: row.email.toLowerCase(),
        professional_title: row.professional_title || 'Estate Planning Attorney',
        firm_name: row.firm_name || null,
        years_experience: parseInt(row.years_experience) || null,
        licensed_states,
        num_states_licensed,
        specializations,

        // Practice type
        practice_type: row.practice_type || 'unknown',
        estate_size_focus: row.estate_size_focus || null,

        // Boolean flags (convert string "true"/"false" to boolean)
        multi_state_practice: parseBool(row.multi_state_practice) || multi_state_practice,
        practice_owner: parseBool(row.practice_owner),
        asset_protection_specialist: parseBool(row.asset_protection_specialist),
        dynasty_trust_specialist: parseBool(row.dynasty_trust_specialist),
        international_planning: parseBool(row.international_planning),
        content_creator: parseBool(row.content_creator),
        conference_speaker: parseBool(row.conference_speaker),
        cle_instructor: parseBool(row.cle_instructor),

        // Credentials
        actec_fellow: parseBool(row.actec_fellow),
        wealthcounsel_member: parseBool(row.wealthcounsel_member),

        // URLs
        website_url: row.website_url || null,
        linkedin_url: row.linkedin_url || null,

        // Tracking
        partner_type: 'prospect',
        status: 'pending',
        podcast_status: 'not_contacted',
        podcast_interest: false,
        source: row.source || 'csv_import',
        initial_contact_date: new Date().toISOString().split('T')[0]
      };
    });

    // Check for duplicates by email
    const emails = partners.map(p => p.email);
    const { data: existingPartners } = await supabase
      .from('partners')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set(existingPartners?.map(p => p.email) || []);
    const newPartners = partners.filter(p => !existingEmails.has(p.email));
    const duplicateCount = partners.length - newPartners.length;

    if (newPartners.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'All prospects already exist in database',
        duplicates: duplicateCount,
        total: partners.length
      }, { status: 400 });
    }

    // Insert new partners
    const { data: insertedPartners, error } = await supabase
      .from('partners')
      .insert(newPartners)
      .select('id, full_name, email');

    if (error) {
      console.error('[Import] Error inserting partners:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log(`[Import] ✅ Imported ${insertedPartners?.length} new prospects (${duplicateCount} duplicates skipped)`);

    // Log activity for each imported partner
    if (insertedPartners && insertedPartners.length > 0) {
      const activities = insertedPartners.map(partner => ({
        partner_id: partner.id,
        activity_type: 'import',
        activity_title: 'Prospect Imported via CSV',
        activity_description: `Podcast guest prospect imported: ${partner.full_name}`,
        outcome: 'positive',
        next_steps: 'Auto-enrolled in podcast outreach sequence'
      }));

      await supabase.from('partner_activities').insert(activities);

      // AUTO-ENROLL in podcast outreach sequence (100% automated)
      const engine = new PartnerOutreachEngine();
      let enrolledCount = 0;

      for (const partner of insertedPartners) {
        try {
          await engine.enrollPartner(partner.id);
          enrolledCount++;
        } catch (error) {
          console.error(`[Import] Failed to enroll ${partner.email}:`, error);
        }
      }

      console.log(`[Import] ✅ Auto-enrolled ${enrolledCount}/${insertedPartners.length} prospects in podcast sequence`);
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${insertedPartners?.length} prospects and enrolled in outreach sequence`,
      imported: insertedPartners?.length || 0,
      duplicates: duplicateCount,
      total: partners.length,
      prospects: insertedPartners,
      auto_enrolled: insertedPartners?.length || 0
    });

  } catch (error: any) {
    console.error('[Import] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Simple CSV parser (handles quoted fields)
 */
function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse boolean from string
 */
function parseBool(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  return false;
}

/**
 * GET: Download CSV template
 */
export async function GET() {
  const template = `full_name,email,professional_title,firm_name,years_experience,licensed_states,specializations,practice_type,multi_state_practice,practice_owner,asset_protection_specialist,dynasty_trust_specialist,international_planning,actec_fellow,wealthcounsel_member,content_creator,conference_speaker,cle_instructor,estate_size_focus,website_url,linkedin_url,source
"John Smith","jsmith@lawfirm.com","Estate Planning Attorney","Smith Law Group",15,"California;Nevada;Delaware","Dynasty Trusts;Asset Protection;Tax Planning","small_firm_founder",true,true,true,true,false,false,true,true,true,false,"10M-50M","https://smithlaw.com","https://linkedin.com/in/johnsmith","actec_directory"
"Jane Doe","jdoe@estateplanning.com","Trust & Estate Attorney","Doe Estate Planning",12,"New York;New Jersey","Dynasty Trusts;Multi-State Planning;Legacy Planning","solo",true,true,false,true,false,true,false,false,true,false,"5M-10M","https://doestateplanning.com","https://linkedin.com/in/janedoe","wealthcounsel"`;

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="podcast_prospects_template.csv"'
    }
  });
}
