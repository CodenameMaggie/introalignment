# SMTP Port 25 Setup Guide

SovereigntyIntroAlignment now uses **direct SMTP port 25** for email delivery.

## ⚠️ Important: Port 25 Requirements

**Port 25 is BLOCKED on most cloud platforms:**
- ❌ Railway
- ❌ Vercel
- ❌ Heroku
- ❌ AWS Lambda
- ❌ Google Cloud Run

**Port 25 WORKS on:**
- ✅ VPS (DigitalOcean, Linode, Vultr)
- ✅ Dedicated servers
- ✅ AWS EC2 (after requesting limit increase)
- ✅ Google Compute Engine
- ✅ Self-hosted servers

---

## Architecture Overview

```
┌──────────────────────────────────────────────┐
│         SovereigntyIntroAlignment Application           │
│              (Node.js/Next.js)               │
└─────────────────┬────────────────────────────┘
                  │
                  │ Port 25
                  ▼
┌──────────────────────────────────────────────┐
│           SMTP Mail Server                   │
│         (Postfix/Sendmail/Exim)             │
└─────────────────┬────────────────────────────┘
                  │
                  │ Port 25 (SMTP)
                  ▼
┌──────────────────────────────────────────────┐
│         Recipient Mail Servers               │
│    (Gmail, Outlook, Yahoo, etc.)            │
└──────────────────────────────────────────────┘
```

---

## Option 1: Local Development (MacOS/Linux)

### Install Postfix

**MacOS:**
```bash
# Postfix is pre-installed on MacOS
sudo postfix status

# Start Postfix
sudo postfix start

# Configure to listen on localhost:25
sudo vi /etc/postfix/main.cf
```

**Ubuntu/Debian:**
```bash
# Install Postfix
sudo apt-get update
sudo apt-get install postfix

# Choose "Internet Site" during installation
# Set system mail name to: introalignment.com
```

**Configuration (`/etc/postfix/main.cf`):**
```conf
# Basic settings
myhostname = localhost
mydomain = introalignment.com
myorigin = $mydomain

# Listen on localhost only (development)
inet_interfaces = localhost

# Allow relaying from localhost
mynetworks = 127.0.0.0/8

# Delivery settings
relayhost =
```

**Restart Postfix:**
```bash
sudo postfix reload
```

**Test:**
```bash
# Test SMTP connection
telnet localhost 25

# Should see:
# 220 localhost ESMTP Postfix
```

### Configure SovereigntyIntroAlignment

**Update .env.local:**
```bash
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_DOMAIN=introalignment.com
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

**Test email sending:**
```bash
# Start dev server
npm run dev

# In another terminal, test waitlist signup
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com"
  }'

# Check mail logs
tail -f /var/log/mail.log
```

---

## Option 2: Production VPS (Ubuntu 22.04)

### 1. Setup DNS Records

Before sending emails, configure DNS:

**A Record:**
```
mail.introalignment.com  →  YOUR_SERVER_IP
```

**MX Record:**
```
introalignment.com  →  10 mail.introalignment.com
```

**SPF Record (TXT):**
```
v=spf1 ip4:YOUR_SERVER_IP ~all
```

**DKIM Record (TXT):**
```
default._domainkey.introalignment.com  →  v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY
```

**DMARC Record (TXT):**
```
_dmarc.introalignment.com  →  v=DMARC1; p=quarantine; rua=mailto:postmaster@introalignment.com
```

### 2. Install and Configure Postfix

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Postfix and mail utils
sudo apt-get install -y postfix mailutils

# Install OpenDKIM for DKIM signing
sudo apt-get install -y opendkim opendkim-tools
```

### 3. Configure Postfix

**Edit `/etc/postfix/main.cf`:**
```conf
# Server settings
myhostname = mail.introalignment.com
mydomain = introalignment.com
myorigin = $mydomain

# Network settings
inet_interfaces = all
inet_protocols = ipv4

# Delivery settings
mydestination = $myhostname, localhost.$mydomain, localhost
relayhost =
mynetworks = 127.0.0.0/8, YOUR_APP_SERVER_IP/32

# TLS settings (optional but recommended)
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_tls_security_level = may

# DKIM
milter_default_action = accept
milter_protocol = 2
smtpd_milters = inet:localhost:8891
non_smtpd_milters = inet:localhost:8891
```

### 4. Configure OpenDKIM

**Generate DKIM keys:**
```bash
sudo mkdir -p /etc/opendkim/keys/introalignment.com
cd /etc/opendkim/keys/introalignment.com
sudo opendkim-genkey -s default -d introalignment.com
sudo chown opendkim:opendkim default.private
```

**Edit `/etc/opendkim.conf`:**
```conf
Domain                  introalignment.com
KeyFile                 /etc/opendkim/keys/introalignment.com/default.private
Selector                default
```

**Get public key for DNS:**
```bash
sudo cat /etc/opendkim/keys/introalignment.com/default.txt
# Add this to your DNS as DKIM record
```

### 5. Start Services

```bash
# Restart Postfix
sudo systemctl restart postfix

# Restart OpenDKIM
sudo systemctl restart opendkim

# Enable on boot
sudo systemctl enable postfix
sudo systemctl enable opendkim

# Check status
sudo systemctl status postfix
sudo systemctl status opendkim
```

### 6. Configure Firewall

```bash
# Allow SMTP port 25
sudo ufw allow 25/tcp

# Allow SSH (if not already)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### 7. Test Email Delivery

```bash
# Send test email via command line
echo "Test email body" | mail -s "Test Subject" test@gmail.com

# Check mail logs
sudo tail -f /var/log/mail.log

# Test from your app
curl -X POST https://introalignment.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Production",
    "lastName": "Test",
    "email": "your-email@gmail.com"
  }'
```

---

## Option 3: Dedicated SMTP Server + Application Server

### Architecture

```
┌──────────────────────────────┐
│   Application Server         │
│   (Railway/Vercel/VPS)      │
│   - SovereigntyIntroAlignment app      │
└──────────┬───────────────────┘
           │
           │ SMTP Port 25
           ▼
┌──────────────────────────────┐
│   Dedicated Mail Server      │
│   (VPS with Postfix)        │
│   - Only handles email      │
└──────────┬───────────────────┘
           │
           │ Port 25
           ▼
     Internet/Recipients
```

### Mail Server Setup (Separate VPS)

**1. Create VPS for mail:**
- DigitalOcean Droplet ($6/month)
- 1GB RAM, 25GB SSD
- Ubuntu 22.04

**2. Follow "Option 2" setup above**

**3. Configure to accept from app server:**

Edit `/etc/postfix/main.cf`:
```conf
# Allow relay from app server
mynetworks = 127.0.0.0/8, YOUR_APP_SERVER_IP/32

# Listen on all interfaces
inet_interfaces = all
```

### Application Server Configuration

**Update .env.local or Railway environment variables:**
```bash
SMTP_HOST=YOUR_MAIL_SERVER_IP
SMTP_PORT=25
SMTP_DOMAIN=introalignment.com
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

**Security: Allow only app server to connect**

On mail server:
```bash
# Configure firewall
sudo ufw allow from YOUR_APP_SERVER_IP to any port 25
sudo ufw deny 25/tcp  # Block all others
sudo ufw allow 22/tcp  # SSH access
sudo ufw enable
```

---

## Environment Variables

### Required Variables

```bash
# SMTP Server
SMTP_HOST=localhost              # or mail.introalignment.com
SMTP_PORT=25
SMTP_DOMAIN=introalignment.com

# Security
SMTP_SECURE=false                # true for port 465 only

# Optional: Authentication (usually not needed for port 25)
SMTP_USER=                       # Leave empty for no auth
SMTP_PASS=                       # Leave empty for no auth
```

### Development vs Production

**Development (.env.local):**
```bash
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_DOMAIN=introalignment.com
SMTP_SECURE=false
```

**Production (Railway/VPS env vars):**
```bash
SMTP_HOST=mail.introalignment.com
SMTP_PORT=25
SMTP_DOMAIN=introalignment.com
SMTP_SECURE=false
```

---

## Testing & Verification

### 1. Test SMTP Connection

```bash
# Test from command line
telnet YOUR_SMTP_HOST 25

# Expected output:
220 mail.introalignment.com ESMTP Postfix
```

### 2. Test via Application

**Create test endpoint:**
```typescript
// app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { sendEmail, verifyConnection } from '@/lib/email/smtp';

export async function GET() {
  // Test connection
  const connectionTest = await verifyConnection();

  if (!connectionTest.success) {
    return NextResponse.json({
      error: 'SMTP connection failed',
      details: connectionTest.error
    }, { status: 500 });
  }

  // Send test email
  const result = await sendEmail({
    to: 'test@example.com',
    subject: 'SovereigntyIntroAlignment SMTP Test',
    html: '<p>This is a test email from SovereigntyIntroAlignment.</p>',
    text: 'This is a test email from SovereigntyIntroAlignment.'
  });

  return NextResponse.json({
    connection: 'verified',
    emailSent: result.success,
    messageId: result.messageId,
    error: result.error
  });
}
```

**Test it:**
```bash
curl http://localhost:3000/api/test-email
```

### 3. Check Email Deliverability

Use these tools to test:
- **Mail Tester**: https://www.mail-tester.com
- **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
- **Google Postmaster**: https://postmaster.google.com

Send test email and check:
- ✅ SPF pass
- ✅ DKIM pass
- ✅ DMARC pass
- ✅ Not marked as spam

---

## Troubleshooting

### Issue: Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:25
```

**Solutions:**
1. Check if Postfix is running:
   ```bash
   sudo postfix status
   sudo systemctl status postfix
   ```

2. Start Postfix:
   ```bash
   sudo postfix start
   ```

3. Check if port 25 is listening:
   ```bash
   sudo netstat -tlnp | grep :25
   ```

### Issue: Emails Going to Spam

**Solutions:**

1. **Configure SPF record:**
   ```
   v=spf1 ip4:YOUR_IP ~all
   ```

2. **Set up DKIM signing** (see OpenDKIM setup above)

3. **Add DMARC policy:**
   ```
   v=DMARC1; p=quarantine; rua=mailto:postmaster@introalignment.com
   ```

4. **Set reverse DNS (PTR record):**
   - Contact your VPS provider
   - Set PTR record: `YOUR_IP → mail.introalignment.com`

5. **Warm up your IP:**
   - Start with low volume (10-20 emails/day)
   - Gradually increase over 2-4 weeks

### Issue: Port 25 Blocked by ISP

**Symptoms:**
```
Error: Connection timeout
```

**Solutions:**

1. **Check if port 25 is blocked:**
   ```bash
   telnet smtp.gmail.com 25
   ```

2. **Use VPS provider that allows port 25:**
   - DigitalOcean ✅
   - Linode ✅
   - Vultr ✅
   - AWS EC2 (request limit increase) ⚠️

3. **Alternative: Use port 587 submission port**
   - Edit .env.local: `SMTP_PORT=587`
   - Edit Postfix to listen on 587

---

## Monitoring & Logs

### View Email Logs

**Ubuntu/Debian:**
```bash
sudo tail -f /var/log/mail.log
```

**MacOS:**
```bash
log stream --predicate '(process == "smtpd")' --info
```

### Monitor Queue

```bash
# View mail queue
mailq

# View specific message
postcat -vq MESSAGE_ID

# Flush queue (retry sends)
sudo postfix flush
```

### Application Logs

Check Next.js logs for SMTP output:
```bash
# Development
npm run dev

# Look for:
[SMTP] Initializing mail server: localhost:25
[SMTP] Email sent: { messageId: '...', to: '...', subject: '...' }
```

---

## Security Best Practices

### 1. Restrict Relay Access

Only allow your application to relay:
```conf
# /etc/postfix/main.cf
mynetworks = 127.0.0.0/8, YOUR_APP_IP/32
```

### 2. Enable TLS

```conf
# /etc/postfix/main.cf
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.introalignment.com/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.introalignment.com/privkey.pem
smtpd_tls_security_level = may
```

### 3. Rate Limiting

Prevent abuse:
```conf
# /etc/postfix/main.cf
smtpd_client_connection_rate_limit = 10
smtpd_client_message_rate_limit = 20
```

### 4. Firewall Rules

```bash
# Only allow from app server
sudo ufw allow from YOUR_APP_IP to any port 25
sudo ufw deny 25/tcp
```

---

## Migration Checklist

- [ ] DNS records configured (A, MX, SPF, DKIM, DMARC)
- [ ] Postfix installed and running
- [ ] OpenDKIM configured
- [ ] Port 25 accessible
- [ ] Firewall rules set
- [ ] Environment variables updated
- [ ] Test email sent successfully
- [ ] Deliverability tested (not spam)
- [ ] Monitoring/logging configured
- [ ] Old Resend integration removed

---

## Cost Comparison

| Solution | Cost | Deliverability | Maintenance |
|----------|------|----------------|-------------|
| **Port 25 (VPS)** | $6-12/month | ⭐⭐⭐ (with proper DNS) | High |
| **Resend API** | $0-20/month | ⭐⭐⭐⭐⭐ | Low |
| **SendGrid** | $0-15/month | ⭐⭐⭐⭐ | Low |

**Recommendation for Port 25:**
- Use dedicated mail server VPS ($6/month)
- Properly configure DNS (SPF, DKIM, DMARC)
- Monitor deliverability closely
- Budget time for maintenance

---

## Summary

SovereigntyIntroAlignment now uses **direct SMTP port 25** for email delivery:

✅ **Code updated:**
- `lib/email/smtp.ts` - SMTP email service
- `app/api/waitlist/route.ts` - Uses SMTP
- `lib/outreach/outreach-engine.ts` - Uses SMTP

✅ **Configuration:**
- Environment variables for SMTP settings
- Nodemailer for SMTP transport
- Connection verification built-in

⚠️ **Deployment requirements:**
- VPS or dedicated server with port 25 access
- Proper DNS configuration (SPF, DKIM, DMARC)
- Postfix or equivalent mail server

📧 **Next steps:**
1. Choose deployment option (local, VPS, or dedicated mail server)
2. Configure DNS records
3. Install and configure Postfix
4. Test email delivery
5. Monitor logs and deliverability
