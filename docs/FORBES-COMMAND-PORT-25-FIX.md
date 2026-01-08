# Fix Port 25 on forbes-command (5.78.139.9)

## Problem
Port 25 is not accessible from external connections (connection timeout).

## Solution
Run these commands on **forbes-command server** as root:

### 1. Check Current Postfix Status
```bash
# Check if Postfix is running
systemctl status postfix

# Check what interfaces Postfix is listening on
netstat -tlnp | grep :25
# or
ss -tlnp | grep :25
```

### 2. Configure Postfix for External Access

**If you see `127.0.0.1:25`, Postfix is only listening locally. Fix it:**

```bash
# Edit Postfix configuration
nano /etc/postfix/main.cf

# Find this line:
#   inet_interfaces = localhost
# Change it to:
#   inet_interfaces = all

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart Postfix
systemctl restart postfix

# Verify it's now listening on all interfaces
netstat -tlnp | grep :25
# Should show: 0.0.0.0:25 or :::25
```

### 3. Open Firewall for Port 25

```bash
# Check current firewall rules
ufw status
# or
iptables -L -n | grep 25

# Open port 25
ufw allow 25/tcp

# Or with iptables:
iptables -A INPUT -p tcp --dport 25 -j ACCEPT
iptables-save > /etc/iptables/rules.v4
```

### 4. Configure DNS for Email Delivery

**Add these DNS records for introalignment.com:**

**MX Record:**
```
introalignment.com.  MX  10  mail.introalignment.com.
```

**A Record:**
```
mail.introalignment.com.  A  5.78.139.9
```

**SPF Record (TXT):**
```
introalignment.com.  TXT  "v=spf1 ip4:5.78.139.9 -all"
```

**Reverse DNS (PTR) - Contact your hosting provider:**
```
5.78.139.9 → mail.introalignment.com
```

### 5. Test from Server

```bash
# Test Postfix responds
telnet localhost 25

# Should see:
# 220 forbes-command ESMTP Postfix

# Type: quit
# Then press Enter to exit

# Test external connectivity (from another server or use online tools)
telnet 5.78.139.9 25
```

### 6. Verify Configuration

```bash
# Check Postfix configuration
postconf -n | grep inet_interfaces
# Should show: inet_interfaces = all

# Check mail queue
mailq

# Check logs
tail -f /var/log/mail.log
```

## After Configuration

Once port 25 is open, IntroAlignment will automatically connect:

**Already configured in .env.local:**
```bash
SMTP_HOST=5.78.139.9
SMTP_PORT=25
SMTP_DOMAIN=introalignment.com
```

**Test the connection:**
```bash
curl http://localhost:3000/api/check-smtp
```

## Quick Commands Summary

**Copy/paste these on forbes-command:**

```bash
# 1. Configure Postfix
sed -i 's/inet_interfaces = localhost/inet_interfaces = all/' /etc/postfix/main.cf
systemctl restart postfix

# 2. Open firewall
ufw allow 25/tcp

# 3. Test
netstat -tlnp | grep :25
telnet localhost 25
```

That's it! Port 25 should now be accessible.
