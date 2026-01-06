/**
 * Jordan (Legal Bot) - Compliance Tracker
 *
 * Tracks compliance requirements, regulatory filings, and deadlines.
 * Can receive data from MFS or be used directly by GMP.
 *
 * Called by: MFS /api/compliance-webhook -> syncComplianceToGMP()
 * Also used by: GMP internal compliance tracking
 */

const { createClient } = require('@supabase/supabase-js');

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // TODO: Re-enable MFS authentication after testing
    // const serviceKey = req.headers['x-service-api-key'];
    // if (!serviceKey || serviceKey !== process.env.MFS_SERVICE_API_KEY) {
    //   return res.status(401).json({ success: false, error: 'Unauthorized' });
    // }

    const { source, compliance } = req.body;

    // Validate required compliance data
    if (!compliance || !compliance.title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required compliance data'
      });
    }

    console.log(`[Jordan Compliance] Received compliance item from ${source || 'gmp'}:`, {
      title: compliance.title,
      document_type: compliance.document_type,
      regulatory_body: compliance.regulatory_body,
      filing_deadline: compliance.filing_deadline,
      document_number: compliance.document_number
    });

    const supabase = getSupabaseClient();

    // Check for duplicate compliance item (idempotency)
    if (compliance.document_number) {
      const { data: existing } = await supabase
        .from('legal_documents')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('document_category', 'compliance')
        .eq('document_number', compliance.document_number)
        .single();

      if (existing) {
        console.log('[Jordan Compliance] Duplicate compliance item detected, updating:', compliance.document_number);

        // Update existing compliance item
        const { data: updated, error: updateError } = await supabase
          .from('legal_documents')
          .update({
            status: compliance.status || 'pending_review',
            filing_date: compliance.filing_date,
            expiration_date: compliance.filing_deadline, // Use expiration_date for filing deadlines
            regulatory_filing_required: true,
            file_url: compliance.file_url,
            notes: compliance.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error('[Jordan Compliance] Update error:', updateError);
          return res.status(500).json({
            success: false,
            error: 'Failed to update compliance item',
            details: updateError.message
          });
        }

        return res.json({
          success: true,
          compliance_id: updated.id,
          updated: true
        });
      }
    }

    // Insert new compliance record
    const { data: complianceRecord, error: insertError } = await supabase
      .from('legal_documents')
      .insert({
        tenant_id: TENANT_ID,

        // Document classification
        document_type: compliance.document_type || 'other',
        document_category: 'compliance',

        // Document details
        title: compliance.title,
        description: compliance.description,
        document_number: compliance.document_number,

        // Compliance specifics (using actual schema fields)
        regulatory_body: compliance.regulatory_body,
        regulatory_filing_required: true,
        filing_date: compliance.filing_date,
        expiration_date: compliance.filing_deadline, // Use expiration_date for filing deadlines
        filing_confirmation: compliance.filing_confirmation,

        // Entity
        our_entity: compliance.our_entity || 'mfs',

        // Status
        status: compliance.status || 'pending_review',

        // Dates
        created_date: compliance.created_date || new Date().toISOString().split('T')[0],
        effective_date: compliance.effective_date,

        // File storage
        file_url: compliance.file_url,
        file_type: compliance.file_type || 'pdf',

        // Access control
        visibility: compliance.visibility || 'admin',

        // Metadata
        tags: compliance.tags || ['compliance', 'regulatory'],
        notes: compliance.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Jordan Compliance] Database error:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record compliance item',
        details: insertError.message
      });
    }

    // Create deadline reminder if filing has a deadline
    if (compliance.filing_deadline) {
      const reminderDays = compliance.reminder_days || 14; // Default 14 days before deadline
      const deadlineDate = new Date(compliance.filing_deadline);
      const reminderDate = new Date(deadlineDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);

      // Only create reminder if it's in the future
      if (reminderDate > new Date()) {
        await supabase.from('legal_document_reminders').insert({
          document_id: complianceRecord.id,
          reminder_type: 'compliance_deadline',
          reminder_date: reminderDate.toISOString().split('T')[0],
          days_before: reminderDays,
          notify_email: ['maggie@maggieforbesstrategies.com'],
          notify_ai_bot: ['jordan', 'henry'],
          status: 'pending',
          notes: `Compliance filing deadline: ${compliance.filing_deadline} (${compliance.document_number || 'no ref'})`
        });

        console.log(`[Jordan Compliance] Created deadline reminder ${reminderDays} days before filing deadline`);
      }
    }

    // Log to audit trail
    await supabase.from('legal_document_audit').insert({
      document_id: complianceRecord.id,
      action: 'created',
      new_values: complianceRecord,
      performed_by_email: source === 'mfs' ? 'mfs-system@maggieforbesstrategies.com' : 'gmp-system@growthmanagerpro.com',
      performed_by_name: source === 'mfs' ? 'MFS System' : 'GMP System',
      ai_assisted: false,
      timestamp: new Date().toISOString(),
      notes: `Compliance item synced from ${source || 'gmp'}`
    });

    console.log('[Jordan Compliance] Successfully recorded compliance item:', complianceRecord.id);

    return res.json({
      success: true,
      compliance_id: complianceRecord.id
    });

  } catch (error) {
    console.error('[Jordan Compliance] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
