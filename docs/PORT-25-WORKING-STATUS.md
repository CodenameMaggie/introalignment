# Port 25 SMTP Status - forbes-command

## ✅ Server Status (5.78.139.9)

**Port 25:** WORKING
**Postfix:** Configured with DKIM
**From Address:** henry@maggieforbesstrategies.com

## Configuration

### Environment Variables (.env.local)

```bash
SMTP_HOST=5.78.139.9
SMTP_PORT=25
SMTP_DOMAIN=maggieforbesstrategies.com
SMTP_FROM_EMAIL=henry@maggieforbesstrategies.com
SMTP_SECURE=false
```

### Verified Working Commands

**Command Line (from server):**
```bash
echo "Your message here" | mail -s "Subject" -r henry@maggieforbesstrategies.com recipient@example.com
```

**Node.js (from server):**
```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false }
});

await transporter.sendMail({
  from: 'henry@maggieforbesstrategies.com',
  to: 'recipient@example.com',
  subject: 'Subject',
  text: 'Message'
});
```

## IntroAlignment Integration

**Email Functions:**
- ✅ `lib/email/smtp.ts` - SMTP port 25 integration
- ✅ `app/api/waitlist/route.ts` - Welcome emails
- ✅ `lib/outreach/outreach-engine.ts` - Lead outreach
- ✅ `app/api/webhooks/stripe/route.ts` - Payment notifications

**All emails will be sent from:** henry@maggieforbesstrategies.com

## Deployment Notes

### For Production (Railway/Vercel):

Since IntroAlignment app is deployed separately from forbes-command:

**Option A: Allow External SMTP Connections**
- Ensure forbes-command port 25 accepts connections from app server IP
- Update firewall: `ufw allow from APP_SERVER_IP to any port 25`

**Option B: Deploy on Same Server**
- Deploy IntroAlignment on forbes-command
- Use `SMTP_HOST=localhost`

**Option C: SMTP Relay/Authentication**
- Configure Postfix to require authentication
- Add SMTP_USER and SMTP_PASS to .env.local

## Testing

**From IntroAlignment app:**
```bash
# Test SMTP connection
curl http://localhost:3000/api/check-smtp

# Test email sending
curl http://localhost:3000/api/test-email
```

**Check logs on forbes-command:**
```bash
tail -f /var/log/mail.log
```

## DNS Configuration

**Verified DKIM:** ✅
**Domain:** maggieforbesstrategies.com

**Required DNS Records:**
- MX: maggieforbesstrategies.com → mail.maggieforbesstrategies.com
- A: mail.maggieforbesstrategies.com → 5.78.139.9
- SPF: v=spf1 ip4:5.78.139.9 -all
- DKIM: (already configured)

## Current Status

- ✅ Port 25 working on forbes-command
- ✅ DKIM configured
- ✅ IntroAlignment code updated to use henry@maggieforbesstrategies.com
- ⏳ Need to verify external connectivity from app server
- ⏳ May need firewall rule for app server IP

## Next Steps

1. Deploy IntroAlignment or test from same network
2. Verify external SMTP connectivity
3. Test sending real email through the app
4. Monitor mail logs for delivery confirmations
