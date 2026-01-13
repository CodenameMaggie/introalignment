import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// MFS Central Database (Read-only)
const MFS_URL = 'https://bixudsnkdeafczzqfvdq.supabase.co';
const MFS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHVkc25rZGVhZmN6enFmdmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUyOTQsImV4cCI6MjA3OTMzMTI5NH0.a3fXuai1t8CGM7XlthgcDwOS76G_KnQ4k2wWBOifVLU';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getMFSClient() {
  return createClient(MFS_URL, MFS_KEY);
}

// Estate planning keywords for filtering
const ESTATE_PLANNING_KEYWORDS = [
  'attorney', 'lawyer', 'legal', 'law firm', 'law office',
  'estate planning', 'trust', 'wealth', 'counsel',
  'esq', 'j.d.', 'barrister', 'solicitor',
  'probate', 'wills', 'asset protection'
];

const MFS_SYNC_ENABLED = process.env.MFS_SYNC_ENABLED !== 'false'; // Default enabled

/**
 * MFS Lead Sync Cron Job
 *
 * Runs every 6 hours (configured in vercel.json)
 *
 * RESPONSIBILITIES:
 * 1. Fetch IA leads from MFS Central Database
 * 2. Filter for estate planning attorneys
 * 3. Import new prospects into partners table
 * 4. Auto-score for podcast outreach eligibility
 *
 * SOURCES:
 * - IA_osm: IntroAlignment leads from OpenStreetMap
 * - IA_youtube: IntroAlignment leads from YouTube
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const mfsClient = getMFSClient();

  try {
    if (!MFS_SYNC_ENABLED) {
      return NextResponse.json({
        success: true,
        sync_status: 'DISABLED',
        message: 'MFS sync disabled. Set MFS_SYNC_ENABLED=true to activate.',
        imported: 0
      });
    }

    console.log('[MFS Sync] Fetching IA leads from MFS database...');

    // 1. Fetch IA leads from MFS
    const { data: mfsLeads, error: fetchError } = await mfsClient
      .from('leads')
      .select('*')
      .or('source.eq.IA_osm,source.eq.IA_youtube')
      .order('created_at', { ascending: false })
      .limit(500);

    if (fetchError) {
      throw new Error(`MFS fetch error: ${fetchError.message}`);
    }

    console.log(`[MFS Sync] Found ${mfsLeads?.length || 0} total IA leads`);

    if (!mfsLeads || mfsLeads.length === 0) {
      return NextResponse.json({
        success: true,
        sync_status: 'NO_LEADS',
        message: 'No IA leads found in MFS database',
        imported: 0,
        skipped: 0
      });
    }

    // 2. Filter for estate planning related
    const attorneyLeads = mfsLeads.filter(lead => {
      const searchText = [
        lead.name || '',
        lead.company || '',
        lead.email || '',
        lead.notes || '',
        lead.description || '',
        lead.title || ''
      ].join(' ').toLowerCase();

      return ESTATE_PLANNING_KEYWORDS.some(keyword =>
        searchText.includes(keyword.toLowerCase())
      );
    });

    console.log(`[MFS Sync] Estate planning leads: ${attorneyLeads.length}`);

    // 3. Check for existing partners
    const { data: existingPartners } = await supabase
      .from('partners')
      .select('email')
      .or('source.eq.IA_osm,source.eq.IA_youtube');

    const existingEmails = new Set(existingPartners?.map(p => p.email) || []);

    // 4. Map and filter new leads
    const newPartners = attorneyLeads
      .filter(lead => !lead.email || !existingEmails.has(lead.email))
      .map((lead, index) => {
        // Extract state from company field (e.g., "Texas - lawyer")
        const companyParts = (lead.company || '').split(' - ');
        const state = companyParts.length > 1 ? companyParts[0] : null;
        const profession = companyParts.length > 1 ? companyParts[1] : lead.company;

        // Generate unique placeholder email if missing
        const uniqueId = lead.id || `${index}-${Math.random().toString(36).substring(7)}`;
        const email = lead.email || `pending.${uniqueId}@introalignment.com`;

        return {
          full_name: lead.name || 'Unknown Attorney',
          email: email,
          phone: lead.phone || null,
          linkedin_url: lead.linkedin || null,
          website_url: lead.website || null,
          professional_title: profession || 'Estate Planning Attorney',
          firm_name: lead.company || null,
          licensed_states: state ? [state] : null,
          specializations: ['Estate Planning'], // Default, enriched later
          practice_areas: ['Estate Planning', 'Trusts'], // Default
          bio: lead.description || lead.notes || null,
          source: lead.source, // IA_osm or IA_youtube
          partner_type: 'prospect',
          status: 'pending',
          podcast_interest: false,
          podcast_status: 'not_contacted',
          initial_contact_date: lead.created_at ? new Date(lead.created_at).toISOString().split('T')[0] : null,
          internal_notes: `Imported from MFS ${lead.source} on ${new Date().toLocaleDateString()}`,

          // Initial scoring (will be refined by scoring cron)
          business_builder_score: 5, // Default score
          expertise_score: 5, // Default score
          fit_score: 10 // Default (below threshold for auto-enrollment)
        };
      });

    console.log(`[MFS Sync] New partners to import: ${newPartners.length}`);

    if (newPartners.length === 0) {
      return NextResponse.json({
        success: true,
        sync_status: 'UP_TO_DATE',
        message: 'All MFS leads already imported',
        imported: 0,
        skipped: attorneyLeads.length,
        total_ia_partners: existingPartners?.length || 0
      });
    }

    // 5. Import in batches
    const BATCH_SIZE = 50;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < newPartners.length; i += BATCH_SIZE) {
      const batch = newPartners.slice(i, i + BATCH_SIZE);

      const { error: insertError } = await supabase
        .from('partners')
        .insert(batch);

      if (insertError) {
        console.error(`[MFS Sync] Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, insertError);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`[MFS Sync] Batch ${Math.floor(i / BATCH_SIZE) + 1}: Imported ${batch.length} partners`);
      }
    }

    // 6. Get updated stats
    const { count: totalIAPartners } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .or('source.eq.IA_osm,source.eq.IA_youtube');

    console.log(`[MFS Sync] ✅ Complete: ${imported} imported, ${errors} errors`);
    console.log(`[MFS Sync] Total IA partners: ${totalIAPartners}`);

    return NextResponse.json({
      success: true,
      sync_status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      mfs_leads_found: mfsLeads.length,
      estate_planning_leads: attorneyLeads.length,
      imported: imported,
      skipped: attorneyLeads.length - newPartners.length,
      errors: errors,
      total_ia_partners: totalIAPartners || 0,
      message: `Imported ${imported} new estate planning attorneys from MFS`
    });

  } catch (error: any) {
    console.error('[MFS Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
