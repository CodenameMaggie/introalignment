const { withAuth } = require('../lib/api-wrapper');
/**
 * Calendly Webhook Endpoint
 * Receives webhook events from Calendly when bookings are created/cancelled
 * Production URL: https://growthmanagerpro.com/api/calendly-webhook
 *
 * Handles:
 * - invitee.created: Someone booked a call
 * - invitee.canceled: Someone cancelled their booking
 */

const crypto = require('crypto');
const db = require('../server/db');
const { sendEmail } = require('../lib/email-sender');

// Your tenant ID (Maggie Forbes Strategies)
const MAGGIE_TENANT_ID = process.env.MAGGIE_TENANT_ID || '00000000-0000-0000-0000-000000000001';

// Validate tenant ID is configured
if (!process.env.MAGGIE_TENANT_ID) {
  console.warn('[Calendly Webhook] MAGGIE_TENANT_ID not configured in environment - using default');
}

// Calendly webhook signing key (optional but recommended)
const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET;

async function handler(req, res) {
  // CORS headers - restrict to known origins
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Calendly sends webhooks as POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature if secret is configured
    if (CALENDLY_WEBHOOK_SECRET) {
      const signature = req.headers['calendly-webhook-signature'];

      if (!signature) {
        console.log('[Calendly Webhook] ⚠️ No signature provided');
        return res.status(403).json({ error: 'No signature provided' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', CALENDLY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (signature !== expectedSignature) {
        console.log('[Calendly Webhook] ⚠️ Invalid signature');
        return res.status(403).json({ error: 'Invalid signature' });
      }

      console.log('[Calendly Webhook] ✅ Signature verified');
    }

    // Calendly v2 webhook format
    const { event, payload } = req.body;

    console.log('[Calendly Webhook] Received event:', event);

    // =========================================
    // INVITEE CREATED (Someone booked a call)
    // =========================================
    if (event === 'invitee.created') {
      const invitee = payload;

      const name = invitee.name || '';
      const email = invitee.email?.toLowerCase();
      const scheduledTime = invitee.scheduled_event?.start_time;
      const eventName = invitee.scheduled_event?.name || '';
      const meetingUrl = invitee.scheduled_event?.location?.join_url || '';
      const calendlyEventUri = invitee.scheduled_event?.uri || '';

      
      if (!email) {
        console.error('[Calendly Webhook] No email in payload');
        return res.status(400).json({ error: 'Email required' });
      }

      // Determine event type and stage based on Calendly event name
      const eventNameLower = eventName.toLowerCase();
      let stage = 'discovery_scheduled';
      let callType = 'discovery';
      let isConsultation = false;
      let clientType = 'gmp_user';
      let source = 'calendly';

      if (eventNameLower.includes('consultation')) {
        // New MFS lead from Maggie Forbes page
        stage = 'consultation_scheduled';
        callType = 'consultation';
        isConsultation = true;
        clientType = 'mfs_client';
        source = 'consultation';
      } else if (eventNameLower.includes('strategy')) {
        stage = 'strategy_scheduled';
        callType = 'strategy';
      } else if (eventNameLower.includes('podcast')) {
        stage = 'podcast_scheduled';
        callType = 'podcast';
      } else if (eventNameLower.includes('discovery')) {
        stage = 'discovery_scheduled';
        callType = 'discovery';
      } else if (eventNameLower.includes('pre-qual') || eventNameLower.includes('prequal')) {
        stage = 'prequal_scheduled';
        callType = 'prequal';
      }

      // Check if contact already exists
      const { data: existingContact } = await db
        .from('contacts')
        .select('id, stage, source, client_type, tenant_id')
        .eq('email', email)
        .single();

      let contactId;
      let tenantId = MAGGIE_TENANT_ID;

      if (existingContact) {
        // =========================================
        // EXISTING CONTACT - Update their status
        // =========================================
        console.log('[Calendly Webhook] Updating existing contact:', existingContact.id);

        tenantId = existingContact.tenant_id;

        const updateData = {
          stage: stage,
          booking_response_status: 'booked',
          updated_at: new Date().toISOString()
        };

        // Only update client_type if it's a consultation and they weren't already MFS
        if (isConsultation && existingContact.client_type !== 'mfs_client') {
          updateData.client_type = 'both'; // They're now both
        }

        const { error: updateError } = await db
          .from('contacts')
          .update(updateData)
          .eq('id', existingContact.id);

        if (updateError) {
          console.error('[Calendly Webhook] Update error:', updateError);
        }

        contactId = existingContact.id;

      } else {
        // =========================================
        // NEW CONTACT - Create them
        // =========================================
        
        // Parse name into first/last
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newContact, error: insertError } = await db
          .from('contacts')
          .insert({
            tenant_id: tenantId,
            full_name: name,
            first_name: firstName,
            last_name: lastName,
            email: email,
            stage: stage,
            lead_source: source,
            client_type: clientType,
            booking_response_status: 'booked',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Calendly Webhook] Insert error:', insertError);
          return res.status(500).json({ error: 'Failed to create contact' });
        }

        contactId = newContact.id;
      }

      // =========================================
      // CREATE CALL RECORD
      // =========================================
      if (scheduledTime && contactId) {
        const callTables = {
          'consultation': 'pre_qualification_calls', // Using prequal table for consultations
          'discovery': 'discovery_calls',
          'strategy': 'strategy_calls',
          'podcast': 'podcast_interviews',
          'prequal': 'pre_qualification_calls'
        };

        const callTable = callTables[callType];

        if (callTable) {
          // Check if record already exists for this contact
          const { data: existingCall } = await db
            .from(callTable)
            .select('id')
            .eq('contact_id', contactId)
            .eq('tenant_id', tenantId)
            .single();

          if (existingCall) {
            // Update existing call record
            // Using scheduled_at and zoom_meeting_url to match schema
            const { error: callUpdateError } = await db
              .from(callTable)
              .update({
                scheduled_at: scheduledTime,
                zoom_meeting_url: meetingUrl,
                status: 'scheduled',
                notes: existingCall.notes ? existingCall.notes + `\nCalendly Event: ${calendlyEventUri}` : `Calendly Event: ${calendlyEventUri}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingCall.id);

            if (callUpdateError) {
              console.error('[Calendly Webhook] Call update error:', callUpdateError);
            }
          } else {
            // Create new call record
            // Using scheduled_at and zoom_meeting_url to match schema
            const { error: callError } = await db
              .from(callTable)
              .insert({
                tenant_id: tenantId,
                contact_id: contactId,
                scheduled_at: scheduledTime,
                zoom_meeting_url: meetingUrl,
                status: 'scheduled',
                notes: `Booked via Calendly\nEvent: ${calendlyEventUri}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (callError) {
              console.error('[Calendly Webhook] Call record error:', callError);
            }
          }
        }
      }

      // =========================================
      // CREATE DEAL AUTOMATICALLY
      // =========================================
      // For discovery and strategy calls, create a deal if one doesn't exist
      if ((callType === 'discovery' || callType === 'strategy') && contactId) {
        try {
          // Check if deal already exists for this contact
          const { data: existingDeal } = await db
            .from('deals')
            .select('id, stage')
            .eq('contact_id', contactId)
            .eq('tenant_id', tenantId)
            .single();

          let dealId;

          if (existingDeal) {
            dealId = existingDeal.id;
            // Update deal stage if moving forward
            const newStage = callType === 'strategy' ? 'strategy_call_scheduled' : 'discovery_call_scheduled';
            if (existingDeal.stage !== newStage) {
              await db
                .from('deals')
                .update({
                  stage: newStage,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingDeal.id);

              console.log('[Calendly Webhook] Updated deal stage to:', newStage);
            }
          } else {
            // Create new deal
            const dealStage = callType === 'strategy' ? 'strategy_call_scheduled' : 'discovery_call_scheduled';
            const dealValue = callType === 'strategy' ? 5000 : 2500; // Estimated deal values

            const { data: newDeal, error: dealError } = await db
              .from('deals')
              .insert({
                tenant_id: tenantId,
                contact_id: contactId,
                title: `${eventName} - ${name}`,
                value: dealValue,
                stage: dealStage,
                status: 'active',
                probability: 25,
                source: 'calendly_booking',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (dealError) {
              console.error('[Calendly Webhook] Deal creation error:', dealError);
            } else {
              dealId = newDeal.id;
              console.log('[Calendly Webhook] ✅ Created deal:', dealId);
            }
          }

          // Log bot action for this automated deal creation
          if (dealId) {
            await db
              .from('bot_actions_log')
              .insert({
                tenant_id: tenantId,
                bot_name: 'dan',
                action_type: 'deal_creation',
                action_description: `Auto-created deal from ${callType} call booking: ${name}`,
                status: 'completed',
                related_entity_type: 'deal',
                related_entity_id: dealId,
                triggered_by: 'calendly_webhook',
                metadata: {
                  contact_id: contactId,
                  call_type: callType,
                  event_name: eventName,
                  scheduled_time: scheduledTime,
                  source: 'automated'
                }
              });
          }
        } catch (dealCreationError) {
          console.error('[Calendly Webhook] Error in deal creation:', dealCreationError);
          // Don't fail the webhook - continue with activity logging
        }
      }

      // =========================================
      // SEND CONFIRMATION EMAIL
      // =========================================
      try {
        const confirmationSubject = `Confirmed: ${eventName} - ${new Date(scheduledTime).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })}`;

        const confirmationBody = `Hi ${name.split(' ')[0]},

Great news! Your ${callType} call has been confirmed.

📅 When: ${new Date(scheduledTime).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })}

${meetingUrl ? `🔗 Join Meeting: ${meetingUrl}\n\n` : ''}We're looking forward to speaking with you!

Best regards,
Maggie Forbes
Maggie Forbes Strategies`;

        await sendEmail({
          to: email,
          subject: confirmationSubject,
          htmlBody: confirmationBody.replace(/\n/g, '<br>'),
          fromEmail: 'support@growthmanagerpro.com'
        });

        console.log('[Calendly Webhook] ✅ Sent confirmation email to:', email);
      } catch (emailError) {
        console.error('[Calendly Webhook] Email send error:', emailError);
        // Don't fail webhook if email fails
      }

      // =========================================
      // LOG ACTIVITY
      // =========================================
      await db
        .from('contact_activities')
        .insert({
          tenant_id: tenantId,
          contact_id: contactId,
          type: 'calendly_booking',
          description: `Booked ${eventName} via Calendly for ${new Date(scheduledTime).toLocaleString()}`,
          metadata: {
            event_name: eventName,
            scheduled_at: scheduledTime,
            call_type: callType,
            is_consultation: isConsultation,
            source: 'calendly_webhook'
          },
          created_at: new Date().toISOString()
        });

      console.log('[Calendly Webhook] ✅ Processed:', {
        contactId,
        stage,
        callType,
        isNewContact: !existingContact
      });

      return res.status(200).json({
        success: true,
        contact_id: contactId,
        stage: stage,
        call_type: callType,
        is_new_contact: !existingContact
      });
    }

    // =========================================
    // INVITEE CANCELED
    // =========================================
    if (event === 'invitee.canceled') {
      const email = payload.email?.toLowerCase();
      const eventName = payload.scheduled_event?.name || '';

      
      if (email) {
        // Find the contact
        const { data: contact } = await db
          .from('contacts')
          .select('id, tenant_id, stage')
          .eq('email', email)
          .single();

        if (contact) {
          // Update contact status
          const previousStage = contact.stage?.replace('_scheduled', '') || 'discovery';

          await db
            .from('contacts')
            .update({
              booking_response_status: 'cancelled',
              stage: previousStage, // Revert to invited stage
              updated_at: new Date().toISOString()
            })
            .eq('id', contact.id);

          // Log activity
          await db
            .from('contact_activities')
            .insert({
              tenant_id: contact.tenant_id,
              contact_id: contact.id,
              type: 'calendly_cancellation',
              description: `Cancelled ${eventName} booking via Calendly`,
              metadata: {
                event_name: eventName,
                previous_stage: contact.stage
              },
              created_at: new Date().toISOString()
            });

          console.log('[Calendly Webhook] ✅ Cancellation processed for contact:', contact.id);
        }
      }

      return res.status(200).json({ success: true, action: 'cancelled' });
    }

    // =========================================
    // INVITEE NO SHOW (if Calendly sends this)
    // =========================================
    if (event === 'invitee.no_show') {
      const email = payload.email?.toLowerCase();

      if (email) {
        const { data: contact } = await db
          .from('contacts')
          .select('id, tenant_id')
          .eq('email', email)
          .single();

        if (contact) {
          await db
            .from('contacts')
            .update({
              booking_response_status: 'no_show',
              updated_at: new Date().toISOString()
            })
            .eq('id', contact.id);

          await db
            .from('contact_activities')
            .insert({
              tenant_id: contact.tenant_id,
              contact_id: contact.id,
              type: 'no_show',
              description: 'Did not attend scheduled Calendly meeting',
              created_at: new Date().toISOString()
            });
        }
      }

      return res.status(200).json({ success: true, action: 'no_show_recorded' });
    }

    // Unknown event type - acknowledge receipt
    console.log('[Calendly Webhook] Unhandled event type:', event);
    return res.status(200).json({ success: true, message: 'Event received' });

  } catch (error) {
    console.error('[Calendly Webhook] Error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message
    });
  }
}

// Export with authentication wrapper
module.exports = withAuth(handler, { publicEndpoint: true });