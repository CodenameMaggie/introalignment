# Forbes Command Center Integration

SovereigntyIntroAlignment now uses the **Forbes Command Center** API for all email sending via Port 25.

## Overview

Forbes Command Center is a centralized email service that handles Port 25 SMTP sending for all businesses.

**Server:** 5.78.139.9
**API Endpoint:** http://5.78.139.9:3000/api/email-api
**API Key:** forbes-command-2026

## Configuration

### Environment Variables (.env.local)

```bash
# Forbes Command Center - Centralized Email API
FORBES_COMMAND_API_URL=http://5.78.139.9:3000/api/email-api
FORBES_COMMAND_API_KEY=forbes-command-2026
SMTP_FROM_EMAIL=henry@maggieforbesstrategies.com
SMTP_DOMAIN=maggieforbesstrategies.com
```

## Integration Points

### 1. Waitlist Welcome Emails
**File:** `app/api/waitlist/route.ts`
**Function:** Sends welcome email when user joins waitlist
**From:** henry@maggieforbesstrategies.com

### 2. Lead Outreach Sequences
**File:** `lib/outreach/outreach-engine.ts`
**Function:** Sends personalized outreach emails to leads
**Provider:** forbes-command-center

### 3. Payment Failed Notifications
**File:** `app/api/webhooks/stripe/route.ts`
**Function:** Notifies users of failed payments
**From:** henry@maggieforbesstrategies.com

### 4. Email Library
**File:** `lib/email/forbes-command-center.ts`
**Functions:**
- `sendEmail()` - Send any email via Forbes Command Center
- `sendWaitlistWelcome()` - Welcome email template
- `sendPaymentFailedNotification()` - Payment failure template
- `verifyConnection()` - Test API connectivity

## API Request Format

```json
POST http://5.78.139.9:3000/api/email-api
Content-Type: application/json

{
  "action": "send",
  "api_key": "forbes-command-2026",
  "business": "IA",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>HTML content</p>",
  "from": "henry@maggieforbesstrategies.com",
  "replyTo": "reply@example.com"
}
```

**Business Codes:**
- **MFS** - Maggie Forbes Strategies
- **GMP** - Growth Manager Pro
- **IC** - IntroConnected
- **IA** - SovereigntyIntroAlignment ✅
- **FF** - Frequency and Form

## API Response Format

**Success:**
```json
{
  "success": true,
  "messageId": "abc123..."
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Testing

### Test API Status
```bash
curl -X POST http://5.78.139.9:3000/api/email-api \
  -H "Content-Type: application/json" \
  -d '{"action":"status","api_key":"forbes-command-2026"}'
```

**Response:**
```json
{
  "service": "Forbes Command Email API",
  "server": "5.78.139.9",
  "port": 25,
  "businesses": ["MFS", "GMP", "IC", "IA", "FF"],
  "status": "ready"
}
```

### Test Email Sending via SovereigntyIntroAlignment
```bash
curl http://localhost:3000/api/test-email
```

**Expected Response:**
```json
{
  "status": "success",
  "connection": "verified",
  "emailSent": true,
  "messageId": "...",
  "recipient": "henry@introalignment.com"
}
```

## Current Status

✅ **Integration Complete**
- All email functions updated to use Forbes Command Center
- Configuration added to .env.local
- Test endpoint created

⚠️ **API Key Verification Needed**
- Connection successful to http://5.78.139.9:3000/api/email-api
- Receiving "Invalid API key" response
- API key may need to be configured on Forbes Command Center server

## Next Steps

1. **Verify API Key** - Ensure `forbes-command-2026` is configured on server
2. **Test Email Sending** - Send test email after API key is verified
3. **Monitor Logs** - Check Forbes Command Center logs for requests

## Migration from Direct SMTP

**Before (Direct SMTP):**
```typescript
import { sendEmail } from '@/lib/email/smtp';
// Direct connection to port 25
```

**After (Forbes Command Center):**
```typescript
import { sendEmail } from '@/lib/email/forbes-command-center';
// API call to centralized email service
```

## Benefits

✅ **Centralized Management** - All businesses use same email infrastructure
✅ **Better Reliability** - Managed by Forbes Command Center
✅ **DKIM Support** - Email authentication handled centrally
✅ **No Direct Port 25 Access Required** - Works from any server
✅ **API-based** - Standard HTTP requests instead of SMTP protocol

## Troubleshooting

### Error: "Invalid API key"

**Solution:** Verify API key is configured on Forbes Command Center server:
```bash
# On forbes-command server (5.78.139.9)
# Check if API key is configured
# Add/update API key: forbes-command-2026
```

### Error: "Connection refused"

**Solution:** Ensure Forbes Command Center API is running on port 3000:
```bash
# On forbes-command server
netstat -tlnp | grep :3000
# Should show process listening on port 3000
```

### Error: "Timeout"

**Solution:** Check firewall allows connections to port 3000:
```bash
# On forbes-command server
ufw allow 3000/tcp
```

## Email Delivery Flow

```
SovereigntyIntroAlignment App
    ↓
    ↓ HTTP POST /api/email-api
    ↓ API Key: forbes-command-2026
    ↓
Forbes Command Center (5.78.139.9:3000)
    ↓
    ↓ Port 25 SMTP
    ↓ From: henry@maggieforbesstrategies.com
    ↓ DKIM Signed
    ↓
Recipient Mail Server (Gmail, etc.)
```

## Support

For issues with Forbes Command Center integration:
- Check API endpoint: http://5.78.139.9:3000/api/email-api
- Verify API key: forbes-command-2026
- Review server logs on forbes-command (5.78.139.9)
