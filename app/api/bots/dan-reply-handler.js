/**
 * Dan's Reply Handler
 * AI classifies email replies and sends automated responses
 * Classifications: INTERESTED, NOT_INTERESTED, QUESTION, UNSUBSCRIBE, SPAM
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { sendEmail } = require('../lib/email-sender');
const { queryAtlas } = require('./atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

// Use Supabase service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  try {
    console.log('[Dan Reply Handler] Starting reply processing...');

    // =====================================================================
    // STEP 1: Find unprocessed email replies
    // =====================================================================

    const repliesResult = await supabase
      .from('email_inbound')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('processed', false)
      .eq('resend_event_type', 'email.received')
      .order('received_at', { ascending: true })
      .limit(20);

    const replies = repliesResult.data || [];

    if (replies.length === 0) {
      console.log('[Dan Reply Handler] No unprocessed replies');
      return res.json({
        success: true,
        data: { replies_processed: 0, message: 'No unprocessed replies' }
      });
    }

    console.log(`[Dan Reply Handler] Found ${replies.length} unprocessed replies`);

    // =====================================================================
    // STEP 2: Process each reply with AI classification
    // =====================================================================

    const processed = [];
    const errors = [];

    for (const reply of replies) {
      try {
        console.log(`[Dan Reply Handler] Processing reply from ${reply.from_email}`);

        // Classify reply using AI
        const classificationPrompt = `Analyze this email reply and classify it into ONE category:

Email Subject: ${reply.subject}
Email Body:
${reply.body_text || reply.body_html}

Categories:
1. INTERESTED - They want to learn more, book a call, or engage further
2. NOT_INTERESTED - Polite decline, not a good fit, not interested
3. QUESTION - They have questions or need clarification before deciding
4. UNSUBSCRIBE - They want to unsubscribe or stop receiving emails
5. OUT_OF_OFFICE - Automated out-of-office reply

Respond with ONLY a JSON object:
{
  "classification": "INTERESTED|NOT_INTERESTED|QUESTION|UNSUBSCRIBE|OUT_OF_OFFICE",
  "confidence": 85.5,
  "reason": "Brief explanation of why",
  "key_points": ["Point 1", "Point 2"],
  "suggested_response": "If INTERESTED or QUESTION, suggest what to say"
}`;

        const atlasResponse = await queryAtlas(
          classificationPrompt,
          'marketing',
          tenantId,
          {
            sources: ['claude'],
            save_to_memory: false,
            calledBy: 'dan_reply_handler'
          }
        );

        if (!atlasResponse.success) {
          throw new Error(`AI classification failed: ${atlasResponse.error}`);
        }

        // Parse AI response
        let classification;
        try {
          let jsonText = atlasResponse.answer;
          const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
          const objMatch = jsonText.match(/\{[\s\S]*\}/);
          if (objMatch) {
            jsonText = objMatch[0];
          }
          classification = JSON.parse(jsonText.trim());
        } catch (e) {
          console.error('[Dan Reply Handler] Failed to parse AI response:', e);
          classification = {
            classification: 'QUESTION',
            confidence: 50,
            reason: 'Could not parse AI response',
            key_points: [],
            suggested_response: ''
          };
        }

        console.log(`[Dan Reply Handler] Classification: ${classification.classification} (${classification.confidence}% confidence)`);

        // =====================================================================
        // STEP 3: Update email_inbound with classification
        // =====================================================================

        await supabase
          .from('email_inbound')
          .update({
            classification: classification.classification,
            classification_confidence: classification.confidence,
            classification_reason: classification.reason,
            processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', reply.id);

        // =====================================================================
        // STEP 4: Take action based on classification
        // =====================================================================

        const calendlyLink = process.env.CALENDLY_DISCOVERY_LINK || 'https://calendly.com/maggieforbes/discovery';

        let autoResponseSent = false;
        let actionTaken = 'classified_only';

        if (classification.classification === 'INTERESTED') {
          // Send Calendly link
          const subject = `Re: ${reply.subject}`;
          const htmlBody = `
            <p>Hi ${reply.from_name || 'there'},</p>

            <p>Thanks for your interest in Growth Manager Pro! I'd love to chat with you about how we can help grow your business.</p>

            <p><strong>Book a 15-minute discovery call:</strong><br/>
            <a href="${calendlyLink}" style="color: #0066cc;">${calendlyLink}</a></p>

            <p>In the meantime, feel free to reply with any questions!</p>

            <p>Best,<br/>
            Maggie Forbes<br/>
            Growth Manager Pro</p>
          `;

          await sendEmail({
            to: reply.from_email,
            subject: subject,
            htmlBody: htmlBody,
            fromEmail: 'support@growthmanagerpro.com'
          });

          autoResponseSent = true;
          actionTaken = 'sent_calendly_link';

          // Update contact
          if (reply.contact_id) {
            await supabase
              .from('contacts')
              .update({
                calendly_link_sent: true,
                calendly_link_sent_at: new Date().toISOString(),
                stage: 'qualified',
                updated_at: new Date().toISOString()
              })
              .eq('id', reply.contact_id);
          }

          console.log(`[Dan Reply Handler] Sent Calendly link to ${reply.from_email}`);
        }

        if (classification.classification === 'QUESTION') {
          // Send AI-generated answer + Calendly link
          const answerPrompt = `The prospect asked: "${reply.body_text}"

Generate a helpful, friendly response that:
1. Answers their question clearly and concisely
2. Highlights Growth Manager Pro benefits if relevant
3. Invites them to book a call to learn more

Keep it under 150 words. Write in Maggie Forbes' voice (friendly, professional, helpful).`;

          const answerResponse = await queryAtlas(
            answerPrompt,
            'marketing',
            tenantId,
            {
              sources: ['claude'],
              save_to_memory: false,
              calledBy: 'dan_reply_handler'
            }
          );

          const aiAnswer = answerResponse.success ? answerResponse.answer : classification.suggested_response;

          const subject = `Re: ${reply.subject}`;
          const htmlBody = `
            <p>Hi ${reply.from_name || 'there'},</p>

            ${aiAnswer.split('\n').map(p => `<p>${p}</p>`).join('\n')}

            <p><strong>Want to chat?</strong> Book a 15-minute discovery call:<br/>
            <a href="${calendlyLink}" style="color: #0066cc;">${calendlyLink}</a></p>

            <p>Best,<br/>
            Maggie Forbes<br/>
            Growth Manager Pro</p>
          `;

          await sendEmail({
            to: reply.from_email,
            subject: subject,
            htmlBody: htmlBody,
            fromEmail: 'support@growthmanagerpro.com'
          });

          autoResponseSent = true;
          actionTaken = 'sent_ai_answer';

          console.log(`[Dan Reply Handler] Sent AI answer to ${reply.from_email}`);
        }

        if (classification.classification === 'UNSUBSCRIBE') {
          // Mark contact as do_not_contact
          if (reply.contact_id) {
            await supabase
              .from('contacts')
              .update({
                do_not_contact: true,
                do_not_contact_reason: 'Unsubscribe request via email',
                updated_at: new Date().toISOString()
              })
              .eq('id', reply.contact_id);

            console.log(`[Dan Reply Handler] Marked ${reply.from_email} as do_not_contact`);
          }

          actionTaken = 'unsubscribed';
        }

        if (classification.classification === 'NOT_INTERESTED') {
          // Mark contact as not_interested, but don't send email
          if (reply.contact_id) {
            await supabase
              .from('contacts')
              .update({
                stage: 'not_interested',
                updated_at: new Date().toISOString()
              })
              .eq('id', reply.contact_id);
          }

          actionTaken = 'marked_not_interested';
          console.log(`[Dan Reply Handler] Marked ${reply.from_email} as not_interested`);
        }

        if (classification.classification === 'OUT_OF_OFFICE') {
          // Do nothing, just mark as processed
          actionTaken = 'ignored_ooo';
          console.log(`[Dan Reply Handler] Ignored out-of-office from ${reply.from_email}`);
        }

        // =====================================================================
        // STEP 5: Update email_inbound with auto-response status
        // =====================================================================

        if (autoResponseSent) {
          await supabase
            .from('email_inbound')
            .update({
              auto_response_sent: true,
              auto_response_at: new Date().toISOString()
            })
            .eq('id', reply.id);
        }

        // =====================================================================
        // STEP 6: Log bot action
        // =====================================================================

        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'dan',
            action_type: 'reply_processed',
            action_description: `Processed reply from ${reply.from_email}: ${classification.classification}`,
            status: 'completed',
            related_entity_type: 'email_inbound',
            related_entity_id: reply.id,
            triggered_by: req.query?.triggered_by || req.body?.triggered_by || 'automated',
            metadata: {
              from_email: reply.from_email,
              classification: classification.classification,
              confidence: classification.confidence,
              action_taken: actionTaken,
              auto_response_sent: autoResponseSent
            },
            created_at: new Date().toISOString()
          });

        processed.push({
          inbound_id: reply.id,
          from_email: reply.from_email,
          classification: classification.classification,
          confidence: classification.confidence,
          action_taken: actionTaken,
          auto_response_sent: autoResponseSent
        });

        console.log(`[Dan Reply Handler] ✓ Processed ${reply.from_email} - ${actionTaken}`);

        // Rate limit: 2 seconds between replies
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Dan Reply Handler] Error processing ${reply.from_email}:`, error);

        // Mark as processed with error so we don't retry infinitely
        await supabase
          .from('email_inbound')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            classification: 'ERROR',
            classification_reason: error.message
          })
          .eq('id', reply.id);

        errors.push({
          inbound_id: reply.id,
          from_email: reply.from_email,
          error: error.message
        });
      }
    }

    console.log(`[Dan Reply Handler] Processed ${processed.length} replies, ${errors.length} errors`);

    return res.json({
      success: true,
      data: {
        replies_processed: processed.length,
        replies: processed,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('[Dan Reply Handler] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
