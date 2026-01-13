# Calendly Webhook Setup Instructions

## Overview
IntroAlignment is now configured to receive email notifications whenever someone books a Calendly consultation.

## Webhook Endpoint
**URL**: `https://introalignment.com/api/webhooks/calendly`

## Email Notifications
All bookings will send email alerts to: **henry@introalignment.com**

---

## Setup Instructions

### Step 1: Access Calendly Webhook Settings
1. Go to https://calendly.com/integrations/api_webhooks
2. Sign in with your Calendly account
3. Click on **"Create Webhook"** or **"Webhook Subscriptions"**

### Step 2: Create Webhook Subscription
1. **Webhook URL**: Enter `https://introalignment.com/api/webhooks/calendly`
2. **Webhook Name**: `IntroAlignment Booking Notifications` (or any name you prefer)
3. **Events to Subscribe**: Select the following events:
   - ✅ `invitee.created` - When someone books a consultation
   - ✅ `invitee.canceled` - When a booking is canceled (optional but recommended)

### Step 3: Scope Selection
- **Organization Scope**: If you want all event types across your organization
- **User Scope**: If you only want your personal event types

Select the appropriate scope based on your needs.

### Step 4: Save and Activate
1. Click **"Create Webhook"** or **"Save"**
2. Verify the webhook is marked as **Active**

---

## What Happens When Someone Books?

### Email Notification to henry@introalignment.com

You'll receive an email with:

**Subject**: `📅 New Calendly Booking: [Name] - [Event Type]`

**Details Included:**
- ✅ Event name (e.g., "IntroAlignment Consultation")
- ✅ Client name
- ✅ Client email
- ✅ Scheduled date and time
- ✅ Timezone
- ✅ Meeting location (Zoom link, phone, etc.)
- ✅ Pre-call questions and answers (if configured in Calendly)
- ✅ Next steps checklist

### Example Email:
```
📅 NEW CALENDLY BOOKING

BOOKING DETAILS
===============
Event: IntroAlignment Consultation - 30 Min
Name: John Smith
Email: john.smith@example.com
Start Time: Monday, January 13, 2026, 2:00 PM PST
End Time: 2:30 PM PST
Timezone: America/Los_Angeles
Location: Zoom (https://zoom.us/j/123456789)

PRE-CALL QUESTIONS
==================
What is your estate size?: $5M - $10M
What legal services do you need?: Dynasty Trusts, Asset Protection
Where do you live?: California

NEXT STEPS
==========
1. Review client details and questions
2. Prepare consultation materials
3. Check calendar for confirmation
4. Join call at scheduled time
```

---

## Testing the Webhook

### Option 1: Book a Test Consultation
1. Go to your Calendly booking page
2. Schedule a test consultation
3. Check henry@introalignment.com for the email notification
4. Cancel the booking to test cancellation notifications

### Option 2: Use Calendly's Test Feature
Some Calendly plans allow you to send test webhook payloads:
1. Go to webhook settings
2. Look for "Test Webhook" or "Send Test Event"
3. Click to send a test `invitee.created` event
4. Check henry@introalignment.com for the email

---

## Webhook Security

The webhook endpoint is publicly accessible but validates incoming requests to ensure they're from Calendly.

For additional security, you can:
1. Enable webhook signature verification (requires Calendly Enterprise plan)
2. Monitor webhook logs in Railway dashboard
3. Set up IP whitelisting (Calendly webhook IPs)

---

## Webhook Events Reference

### `invitee.created`
Triggered when someone books a consultation.

**Payload includes:**
- Invitee details (name, email, timezone)
- Event details (name, start time, end time, location)
- Questions and answers (if configured)
- Cancellation policy
- Reschedule URL

### `invitee.canceled`
Triggered when a booking is canceled.

**Payload includes:**
- Invitee details
- Event details
- Cancellation reason (if provided)
- Canceled timestamp

---

## Troubleshooting

### Not Receiving Emails?

1. **Check Webhook Status**
   - Go to Calendly webhook settings
   - Verify webhook is **Active**
   - Check webhook delivery logs for errors

2. **Verify Webhook URL**
   - Ensure URL is exactly: `https://introalignment.com/api/webhooks/calendly`
   - No trailing slashes
   - Uses HTTPS (not HTTP)

3. **Check Railway Logs**
   ```bash
   railway logs --deployment | grep Calendly
   ```
   - Look for webhook receive confirmations
   - Check for any errors

4. **Test Email System**
   - Verify Forbes Command Center is running
   - Test with a direct inquiry at https://introalignment.com

### Webhook Not Triggering?

1. **Event Type Subscriptions**
   - Verify you selected `invitee.created` in Calendly webhook settings
   - Check that the event type you're booking is included in the webhook scope

2. **Webhook Scope**
   - If using **Organization Scope**: All event types should trigger
   - If using **User Scope**: Only your personal event types will trigger

3. **Calendly Plan Limitations**
   - Webhooks require Calendly Pro plan or higher
   - Some features require Enterprise plan

---

## Monitoring Webhook Activity

### Check Webhook Logs in Railway
```bash
railway logs --deployment | grep "Calendly Webhook"
```

Look for log entries like:
```
[Calendly Webhook] Received event: invitee.created
[Calendly Webhook] New booking: John Smith (john@example.com) - Consultation
[Calendly Webhook] Booking notification sent to henry@introalignment.com
```

### Check Email Delivery
Emails are sent via Forbes Command Center at `http://5.78.139.9:3000/api/email-api`

If emails aren't arriving:
1. Check spam folder
2. Verify Forbes Command Center is running
3. Check email logs in Railway

---

## Support Resources

- **Calendly Webhooks Documentation**: https://developer.calendly.com/api-docs/webhooks
- **Calendly API Reference**: https://developer.calendly.com/api-docs
- **IntroAlignment Support**: henry@introalignment.com

---

## Next Steps

After setting up the webhook:

1. ✅ Book a test consultation to verify emails work
2. ✅ Check spam folder if you don't receive the email
3. ✅ Monitor webhook logs for the first few bookings
4. ✅ Update Calendly event type questions if needed (answers will appear in emails)

---

## Advanced Configuration (Optional)

### Add Custom Fields to Calendly Event Types
To collect more information from clients:

1. Go to Calendly event type settings
2. Add custom questions:
   - "What is your estate size?"
   - "What legal services do you need?"
   - "What is your primary concern?"
   - "Where do you live (state)?"
   - "How did you hear about us?"

These answers will automatically appear in the email notifications!

### Multiple Event Types
If you have multiple Calendly event types:
- Create separate event types for different consultation lengths
- Add specific questions per event type
- All will trigger the webhook and send emails

### Cancellation Policies
Configure cancellation policies in Calendly:
- Minimum notice periods
- Rescheduling limits
- All cancellations will trigger email notifications

---

## Summary

✅ Webhook endpoint deployed and live
✅ Email notifications configured to henry@introalignment.com
✅ Supports new bookings and cancellations
✅ Includes all booking details and pre-call questions
✅ Ready to activate in Calendly dashboard

**Action Required**: Set up webhook subscription in Calendly at https://calendly.com/integrations/api_webhooks
