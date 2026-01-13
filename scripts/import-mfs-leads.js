#!/usr/bin/env node

// Import MFS IA leads into IntroAlignment partners table
// Note: fetch is built-in to Node.js 18+

// MFS Central Database
const MFS_URL = 'https://bixudsnkdeafczzqfvdq.supabase.co';
const MFS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeHVkc25rZGVhZmN6enFmdmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUyOTQsImV4cCI6MjA3OTMzMTI5NH0.a3fXuai1t8CGM7XlthgcDwOS76G_KnQ4k2wWBOifVLU';

// IntroAlignment Database
const IA_URL = 'https://cxiazrciueruvvsxaxcz.supabase.co';
const IA_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aWF6cmNpdWVydXZ2c3hheGN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0Mjg2NywiZXhwIjoyMDgzMTE4ODY3fQ.r3L64ZLdokiRU_bn_J_F1IuX8R11Q72bN5LYmSsjSn4';

// Keywords to identify estate planning attorneys
const ESTATE_PLANNING_KEYWORDS = [
  'attorney', 'lawyer', 'legal', 'law firm', 'law office',
  'estate planning', 'trust', 'wealth', 'counsel',
  'esq', 'j.d.', 'barrister', 'solicitor',
  'probate', 'wills', 'asset protection'
];

async function fetchMFSLeads() {
  console.log('🔍 Fetching IA leads from MFS database...\n');

  try {
    const response = await fetch(
      `${MFS_URL}/rest/v1/leads?or=(source.eq.IA_osm,source.eq.IA_youtube)&select=*&order=created_at.desc&limit=500`,
      {
        headers: {
          'apikey': MFS_KEY,
          'Authorization': `Bearer ${MFS_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`MFS API error: ${response.status} ${response.statusText}`);
    }

    const allLeads = await response.json();
    console.log(`✅ Found ${allLeads.length} total IA leads (IA_osm + IA_youtube)`);

    // Filter for estate planning related
    const attorneyLeads = allLeads.filter(lead => {
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

    console.log(`⚖️  Estate planning related leads: ${attorneyLeads.length}\n`);
    return attorneyLeads;

  } catch (error) {
    console.error('❌ Error fetching MFS leads:', error.message);
    return [];
  }
}

async function checkExistingPartners(emails) {
  console.log('🔍 Checking for existing partners...');

  try {
    const validEmails = emails.filter(e => e);
    if (validEmails.length === 0) return [];

    const response = await fetch(
      `${IA_URL}/rest/v1/partners?select=email&email=in.(${validEmails.join(',')})`,
      {
        headers: {
          'apikey': IA_SERVICE_KEY,
          'Authorization': `Bearer ${IA_SERVICE_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.warn(`Warning: Could not check existing partners (${response.status})`);
      return [];
    }

    const existing = await response.json();
    console.log(`📊 Found ${existing.length} existing partners\n`);
    return existing.map(p => p.email);

  } catch (error) {
    console.warn('Warning: Could not check existing partners:', error.message);
    return [];
  }
}

function mapLeadToPartner(lead, index) {
  // Extract state from company field if present (e.g., "Texas - lawyer")
  const companyParts = (lead.company || '').split(' - ');
  const state = companyParts.length > 1 ? companyParts[0] : null;
  const profession = companyParts.length > 1 ? companyParts[1] : lead.company;

  // Parse name into first/last if possible
  const fullName = lead.name || 'Unknown Attorney';

  // Generate unique placeholder email if missing
  // Use lead ID if available, otherwise use index + random component
  const uniqueId = lead.id || `${index}-${Math.random().toString(36).substring(7)}`;
  const email = lead.email || `pending.${uniqueId}@introalignment.com`;

  return {
    full_name: fullName,
    email: email,
    phone: lead.phone || null,
    linkedin_url: lead.linkedin || null,
    website_url: lead.website || null,
    professional_title: profession || 'Estate Planning Attorney',
    firm_name: lead.company || null,
    licensed_states: state ? [state] : null,
    specializations: ['Estate Planning'], // Default, can be enriched later
    practice_areas: ['Estate Planning', 'Trusts'], // Default
    bio: lead.description || lead.notes || null,
    source: lead.source, // Keep as IA_osm or IA_youtube
    partner_type: 'prospect',
    status: 'pending',
    podcast_interest: false,
    podcast_status: 'not_contacted',
    initial_contact_date: lead.created_at ? new Date(lead.created_at).toISOString().split('T')[0] : null,
    internal_notes: `Imported from MFS ${lead.source} on ${new Date().toLocaleDateString()}`
  };
}

async function importPartners(partners) {
  if (partners.length === 0) {
    console.log('⚠️  No partners to import\n');
    return { imported: 0, errors: 0 };
  }

  console.log(`📥 Importing ${partners.length} partners into IntroAlignment...\n`);

  let imported = 0;
  let errors = 0;

  // Import in batches of 10
  const batchSize = 10;
  for (let i = 0; i < partners.length; i += batchSize) {
    const batch = partners.slice(i, i + batchSize);

    try {
      const response = await fetch(
        `${IA_URL}/rest/v1/partners`,
        {
          method: 'POST',
          headers: {
            'apikey': IA_SERVICE_KEY,
            'Authorization': `Bearer ${IA_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(batch)
        }
      );

      if (response.ok) {
        imported += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} partners`);
      } else {
        errors += batch.length;
        const errorText = await response.text();
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, errorText);
      }

    } catch (error) {
      errors += batch.length;
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Successfully imported: ${imported}`);
  console.log(`   ❌ Errors: ${errors}`);

  return { imported, errors };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 MFS IA LEADS → INTROALIGNMENT PARTNERS IMPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Fetch MFS leads
  const mfsLeads = await fetchMFSLeads();

  if (mfsLeads.length === 0) {
    console.log('⚠️  No estate planning leads found. Exiting.');
    return;
  }

  // Step 2: Check for existing partners
  const emails = mfsLeads.map(lead => lead.email).filter(e => e);
  const existingEmails = await checkExistingPartners(emails);

  // Step 3: Filter out duplicates
  const newLeads = mfsLeads.filter(lead =>
    !lead.email || !existingEmails.includes(lead.email)
  );

  console.log(`🆕 New leads to import: ${newLeads.length}`);
  console.log(`⏭️  Skipping ${mfsLeads.length - newLeads.length} duplicates\n`);

  if (newLeads.length === 0) {
    console.log('✨ All leads already imported. Nothing to do!\n');
    return;
  }

  // Step 4: Map leads to partner format
  const partners = newLeads.map((lead, index) => mapLeadToPartner(lead, index));

  // Step 5: Import partners
  const result = await importPartners(partners);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✨ IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fetchMFSLeads, mapLeadToPartner, importPartners };
