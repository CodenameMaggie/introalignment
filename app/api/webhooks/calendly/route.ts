import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/forbes-command-center';

/**
 * Calendly Webhook Handler
 *
 * Receives booking notifications from Calendly and sends email alerts
 *
 * Webhook Events:
 * - invitee.created: When someone books a consultation
 * - invitee.canceled: When a booking is canceled
 *
 * Setup Instructions:
 * 1. Go to https://calendly.com/integrations/api_webhooks
 * 2. Create a new webhook subscription
 * 3. Set URL to: https://introalignment.com/api/webhooks/calendly
 * 4. Subscribe to: invitee.created, invitee.canceled
 */

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('[Calendly Webhook] Received event:', payload.event);

    // Extract event type and data
    const eventType = payload.event;
    const eventData = payload.payload;

    // Handle different event types
    if (eventType === 'invitee.created') {
      // Someone booked a consultation
      await handleBookingCreated(eventData);
    } else if (eventType === 'invitee.canceled') {
      // Booking was canceled
      await handleBookingCanceled(eventData);
    }

    return NextResponse.json({ success: true, received: true });

  } catch (error: any) {
    console.error('[Calendly Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function handleBookingCreated(eventData: any) {
  try {
    // Extract booking details
    const invitee = eventData.invitee;
    const event = eventData.event;

    const inviteeName = invitee?.name || 'Unknown';
    const inviteeEmail = invitee?.email || 'N/A';
    const eventName = event?.name || 'Consultation';
    const eventStartTime = event?.start_time ? new Date(event.start_time) : null;
    const eventEndTime = event?.end_time ? new Date(event.end_time) : null;
    const eventLocation = event?.location?.join_url || event?.location?.location || 'N/A';
    const timezone = invitee?.timezone || 'N/A';

    // Extract questions/answers if available
    const questions = invitee?.questions_and_answers || [];
    const questionsList = questions.map((qa: any) =>
      `<li><strong>${qa.question}:</strong> ${qa.answer}</li>`
    ).join('');

    console.log(`[Calendly Webhook] New booking: ${inviteeName} (${inviteeEmail}) - ${eventName}`);

    // Send email notification to admin
    await sendEmail({
      from: 'henry@introalignment.com',
      to: 'henry@introalignment.com',
      subject: `📅 New Calendly Booking: ${inviteeName} - ${eventName}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: #4a90e2; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📅 NEW CALENDLY BOOKING</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">IntroAlignment Consultation Scheduled</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1a1a1a; margin-top: 0; border-bottom: 2px solid #4a90e2; padding-bottom: 10px;">Booking Details</h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 180px;"><strong>Event:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: bold;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${inviteeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;"><a href="mailto:${inviteeEmail}" style="color: #4a90e2;">${inviteeEmail}</a></td>
              </tr>
              ${eventStartTime ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Start Time:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${eventStartTime.toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  timeZone: timezone
                })}</td>
              </tr>
              ` : ''}
              ${eventEndTime ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>End Time:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${eventEndTime.toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  timeZone: timezone
                })}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Timezone:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${timezone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${eventLocation}</td>
              </tr>
            </table>

            ${questions.length > 0 ? `
            <h3 style="color: #1a1a1a; margin-top: 20px; border-bottom: 2px solid #4a90e2; padding-bottom: 10px;">Pre-Call Questions</h3>
            <ul style="margin: 10px 0; padding-left: 20px; color: #1a1a1a; line-height: 1.8;">
              ${questionsList}
            </ul>
            ` : ''}

            <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #2e7d32;">✅ Next Steps</h3>
              <ol style="margin: 10px 0; padding-left: 20px; color: #333;">
                <li>Review client details and questions</li>
                <li>Prepare consultation materials</li>
                <li>Check calendar for confirmation</li>
                <li>Join call at scheduled time: ${eventLocation}</li>
              </ol>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #fffbf0; border: 1px solid #ffc107; border-radius: 4px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                <strong>Booking Time:</strong> ${new Date().toLocaleString()}<br>
                <strong>Invitee URI:</strong> ${invitee?.uri || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
📅 NEW CALENDLY BOOKING - IntroAlignment

BOOKING DETAILS
===============
Event: ${eventName}
Name: ${inviteeName}
Email: ${inviteeEmail}
${eventStartTime ? `Start Time: ${eventStartTime.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: timezone })}` : ''}
${eventEndTime ? `End Time: ${eventEndTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', timeZone: timezone })}` : ''}
Timezone: ${timezone}
Location: ${eventLocation}

${questions.length > 0 ? `
PRE-CALL QUESTIONS
==================
${questions.map((qa: any) => `${qa.question}: ${qa.answer}`).join('\n')}
` : ''}

NEXT STEPS
==========
1. Review client details and questions
2. Prepare consultation materials
3. Check calendar for confirmation
4. Join call at scheduled time

---
Booking Time: ${new Date().toLocaleString()}
Invitee URI: ${invitee?.uri || 'N/A'}
      `
    });

    console.log('[Calendly Webhook] Booking notification sent to henry@introalignment.com');

  } catch (error) {
    console.error('[Calendly Webhook] Error handling booking created:', error);
    throw error;
  }
}

async function handleBookingCanceled(eventData: any) {
  try {
    const invitee = eventData.invitee;
    const event = eventData.event;

    const inviteeName = invitee?.name || 'Unknown';
    const inviteeEmail = invitee?.email || 'N/A';
    const eventName = event?.name || 'Consultation';
    const cancelReason = invitee?.cancel_reason || 'No reason provided';

    console.log(`[Calendly Webhook] Booking canceled: ${inviteeName} (${inviteeEmail}) - ${eventName}`);

    // Send cancellation notification
    await sendEmail({
      from: 'henry@introalignment.com',
      to: 'henry@introalignment.com',
      subject: `❌ Calendly Booking Canceled: ${inviteeName} - ${eventName}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: #d32f2f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">❌ BOOKING CANCELED</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Calendly Consultation Canceled</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1a1a1a; margin-top: 0; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">Cancellation Details</h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 180px;"><strong>Event:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${inviteeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;"><a href="mailto:${inviteeEmail}" style="color: #d32f2f;">${inviteeEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Cancel Reason:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${cancelReason}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Canceled At:</strong></td>
                <td style="padding: 8px 0; color: #1a1a1a;">${new Date().toLocaleString()}</td>
              </tr>
            </table>

            <div style="margin-top: 20px; padding: 20px; background: #fff9e6; border-left: 4px solid #ffc107; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #f57c00;">Follow-up Recommended</h3>
              <p style="margin: 0; color: #333;">Consider reaching out to reschedule or understand their concerns.</p>
            </div>
          </div>
        </div>
      `,
      text: `
❌ BOOKING CANCELED - IntroAlignment

CANCELLATION DETAILS
====================
Event: ${eventName}
Name: ${inviteeName}
Email: ${inviteeEmail}
Cancel Reason: ${cancelReason}
Canceled At: ${new Date().toLocaleString()}

FOLLOW-UP RECOMMENDED
Consider reaching out to reschedule or understand their concerns.
      `
    });

    console.log('[Calendly Webhook] Cancellation notification sent to henry@introalignment.com');

  } catch (error) {
    console.error('[Calendly Webhook] Error handling booking canceled:', error);
    throw error;
  }
}

// Verify webhook signature (optional but recommended)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Calendly webhook endpoint is active',
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://introalignment.com'}/api/webhooks/calendly`
  });
}
