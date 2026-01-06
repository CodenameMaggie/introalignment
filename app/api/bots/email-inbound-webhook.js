/**
 * Email Inbound Webhook
 * Receives email replies from Resend webhooks
 * Stores in email_inbound table for processing by dan-reply-handler
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Use Supabase service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('[Email Inbound] Webhook received');

    // =====================================================================
    // STEP 1: Verify webhook signature from Resend
    // =====================================================================

    const signature = req.headers['resend-signature'];
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Email Inbound] RESEND_WEBHOOK_SECRET not configured');
      // Still process the webhook for now, just log warning
    }

    if (signature && webhookSecret) {
      const body = JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(body);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        console.error('[Email Inbound] Invalid webhook signature');
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }
    }

    // =====================================================================
    // STEP 2: Extract email data from webhook
    // =====================================================================

    const { type, data } = req.body;

    console.log(`[Email Inbound] Event type: ${type}`);

    // Handle different event types
    let eventType = type;
    let emailData = data;

    // Different event types from Resend
    if (type === 'email.received') {
      // Inbound email (reply from prospect)
      eventType = 'email.received';
    } else if (type === 'email.bounced') {
      // Email bounced
      eventType = 'email.bounced';
    } else if (type === 'email.complained') {
      // Spam complaint
      eventType = 'email.complained';
    } else {
      console.log(`[Email Inbound] Ignoring event type: ${type}`);
      return res.json({ success: true, message: 'Event type ignored' });
    }

    const fromEmail = emailData.from || emailData.email;
    const toEmail = emailData.to || 'support@growthmanagerpro.com';
    const subject = emailData.subject || '(no subject)';
    const bodyText = emailData.text || emailData.body || '';
    const bodyHtml = emailData.html || '';

    console.log(`[Email Inbound] From: ${fromEmail}, To: ${toEmail}, Subject: ${subject}`);

    // =====================================================================
    // STEP 3: Find associated contact by email
    // =====================================================================

    const tenantId = '00000000-0000-0000-0000-000000000001'; // Default tenant

    let contactId = null;
    const contactResult = await supabase
      .from('contacts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', fromEmail)
      .limit(1)
      .single();

    if (contactResult.data) {
      contactId = contactResult.data.id;
      console.log(`[Email Inbound] Found contact: ${contactId}`);

      // Update contact's last_contact_date
      await supabase
        .from('contacts')
        .update({
          last_contact_date: new Date().toISOString(),
          last_email_reply_at: new Date().toISOString(),
          total_replies_received: supabase.sql`COALESCE(total_replies_received, 0) + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      console.log(`[Email Inbound] Updated contact last_contact_date`);
    } else {
      console.log(`[Email Inbound] No contact found for ${fromEmail}`);
    }

    // =====================================================================
    // STEP 4: Store inbound email in database
    // =====================================================================

    const inboundResult = await supabase
      .from('email_inbound')
      .insert({
        tenant_id: tenantId,
        from_email: fromEmail,
        from_name: emailData.from_name || null,
        to_email: toEmail,
        subject: subject,
        body_text: bodyText,
        body_html: bodyHtml,
        resend_message_id: emailData.message_id || emailData.id,
        resend_event_type: eventType,
        contact_id: contactId,
        processed: false,
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (inboundResult.error) {
      console.error('[Email Inbound] Failed to insert:', inboundResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to store inbound email'
      });
    }

    console.log(`[Email Inbound] Stored in email_inbound: ${inboundResult.data.id}`);

    // =====================================================================
    // STEP 5: Handle special cases (bounces, spam complaints)
    // =====================================================================

    if (eventType === 'email.bounced') {
      console.log(`[Email Inbound] Email bounced from ${fromEmail}`);

      if (contactId) {
        // Mark contact's email as bounced
        await supabase
          .from('contacts')
          .update({
            email_bounced: true,
            do_not_contact: true,
            do_not_contact_reason: 'Email bounced',
            updated_at: new Date().toISOString()
          })
          .eq('id', contactId);

        console.log(`[Email Inbound] Marked contact as bounced, do_not_contact=true`);
      }

      // Auto-classify as BOUNCE
      await supabase
        .from('email_inbound')
        .update({
          classification: 'BOUNCE',
          classification_confidence: 100.00,
          classification_reason: 'Email bounced - invalid address',
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', inboundResult.data.id);
    }

    if (eventType === 'email.complained') {
      console.log(`[Email Inbound] Spam complaint from ${fromEmail}`);

      if (contactId) {
        // Mark contact as do_not_contact
        await supabase
          .from('contacts')
          .update({
            do_not_contact: true,
            do_not_contact_reason: 'Spam complaint',
            updated_at: new Date().toISOString()
          })
          .eq('id', contactId);

        console.log(`[Email Inbound] Marked contact do_not_contact=true (spam complaint)`);
      }

      // Auto-classify as SPAM
      await supabase
        .from('email_inbound')
        .update({
          classification: 'SPAM',
          classification_confidence: 100.00,
          classification_reason: 'User marked as spam',
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', inboundResult.data.id);
    }

    // =====================================================================
    // SUCCESS
    // =====================================================================

    console.log(`[Email Inbound] ✅ Webhook processed successfully`);

    return res.json({
      success: true,
      data: {
        inbound_id: inboundResult.data.id,
        event_type: eventType,
        from_email: fromEmail,
        contact_id: contactId,
        will_process: eventType === 'email.received'
      }
    });

  } catch (error) {
    console.error('[Email Inbound] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = handler;
