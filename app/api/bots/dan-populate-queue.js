/**
 * Populate Dan's Outreach Queue
 * API endpoint to add contacts from contacts table to dan_outreach_queue
 * Requires cron authentication
 */

const db = require('../server/db');
const { withCronAuth } = require('../lib/api-wrapper');

async function handler(req, res) {
  // CORS headers
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://growthmanagerpro.com',
    'https://www.growthmanagerpro.com',
    'http://localhost:3000'
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const tenantId = req.query.tenant_id || req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000001';

  console.log('[Dan Queue API] Populating outreach queue from contacts...');

  try {
    // Get all contacts NOT already in the outreach queue
    const { data: contacts, error: contactsError } = await db
      .from('contacts')
      .select('id, email, first_name, last_name, company, lead_score, source, created_at')
      .eq('tenant_id', tenantId)
      .not('email', 'is', null)
      .neq('email', '');

    if (contactsError) throw contactsError;

    console.log(`[Dan Queue API] Found ${contacts.length} total contacts`);

    // Get existing queue entries to avoid duplicates
    const { data: existingQueue, error: queueError } = await db
      .from('dan_outreach_queue')
      .select('contact_email')
      .eq('tenant_id', tenantId);

    if (queueError) throw queueError;

    const existingEmails = new Set(existingQueue.map(q => q.contact_email));
    console.log(`[Dan Queue API] Found ${existingEmails.size} contacts already in queue`);

    // Filter out contacts already in queue
    const newContacts = contacts.filter(c => !existingEmails.has(c.email));
    console.log(`[Dan Queue API] Adding ${newContacts.length} new contacts to queue`);

    if (newContacts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new contacts to add - queue already populated',
        stats: {
          total_contacts: contacts.length,
          already_in_queue: existingEmails.size,
          added: 0
        }
      });
    }

    // Prepare queue entries with prioritization
    const queueEntries = newContacts.map(contact => {
      const leadScore = contact.lead_score || 50;

      // Determine priority based on lead score
      let priority = 'medium';
      if (leadScore >= 85) priority = 'high';
      else if (leadScore < 70) priority = 'low';

      return {
        tenant_id: tenantId,
        contact_id: contact.id,
        contact_email: contact.email,
        contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.company || 'Contact',
        company: contact.company,
        lead_score: leadScore,
        priority: priority,
        status: 'pending',
        source: contact.source || 'hunter_discovery',
        scheduled_for: new Date().toISOString(), // Send ASAP
        created_at: new Date().toISOString()
      };
    });

    // Sort by priority (high first) then by lead score (highest first)
    queueEntries.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.lead_score - a.lead_score;
    });

    // Insert in batches of 500 to avoid timeout
    const batchSize = 500;
    let inserted = 0;
    const errors = [];

    for (let i = 0; i < queueEntries.length; i += batchSize) {
      const batch = queueEntries.slice(i, i + batchSize);

      const { error: insertError } = await db
        .from('dan_outreach_queue')
        .insert(batch);

      if (insertError) {
        console.error(`[Dan Queue API] Error inserting batch ${i / batchSize + 1}:`, insertError);
        errors.push({
          batch: i / batchSize + 1,
          error: insertError.message
        });
        continue;
      }

      inserted += batch.length;
      console.log(`[Dan Queue API] Inserted batch ${i / batchSize + 1}: ${batch.length} contacts (${inserted}/${queueEntries.length})`);
    }

    // Count by priority
    const stats = {
      total_contacts: contacts.length,
      already_in_queue: existingEmails.size,
      added: inserted,
      high_priority: queueEntries.filter(e => e.priority === 'high').length,
      medium_priority: queueEntries.filter(e => e.priority === 'medium').length,
      low_priority: queueEntries.filter(e => e.priority === 'low').length
    };

    console.log(`[Dan Queue API] ✅ Queue populated successfully!`);
    console.log(`[Dan Queue API] Priority breakdown:`);
    console.log(`  - High priority (score >= 85): ${stats.high_priority}`);
    console.log(`  - Medium priority (score 70-84): ${stats.medium_priority}`);
    console.log(`  - Low priority (score < 70): ${stats.low_priority}`);
    console.log(`[Dan Queue API] Total added: ${inserted}`);

    return res.status(200).json({
      success: true,
      message: `Added ${inserted} contacts to Dan's outreach queue`,
      stats: stats,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[Dan Queue API] Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to populate outreach queue'
    });
  }
}

// Export with cron authentication
module.exports = withCronAuth(handler);
