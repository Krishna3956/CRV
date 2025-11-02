# Email DNS Setup Guide

## Overview
Configure SPF and DMARC records for email authentication and security.

**⚠️ Note**: Only needed if you're sending emails from your domain (e.g., newsletters, notifications).

---

## Do You Need This?

### ✅ You NEED email records if:
- Sending transactional emails (password resets, notifications)
- Sending marketing emails (newsletters)
- Using email services (SendGrid, Mailgun, etc.)
- Want to prevent email spoofing

### ❌ You DON'T NEED email records if:
- Not sending any emails from your domain
- Only using contact forms (emails go to your personal email)
- No email functionality on your site

**For Track MCP**: Likely **NOT NEEDED** unless you plan to send emails.

---

## SPF Record Setup

### What is SPF?
Sender Policy Framework - Tells email servers which servers can send email from your domain.

### How to Add SPF Record:

1. **Go to your DNS provider** (where you bought trackmcp.com)
2. **Add a TXT record**:

```
Type: TXT
Name: @ (or trackmcp.com)
Value: v=spf1 include:_spf.google.com ~all
```

### Common SPF Records:

**Google Workspace / Gmail:**
```
v=spf1 include:_spf.google.com ~all
```

**SendGrid:**
```
v=spf1 include:sendgrid.net ~all
```

**Mailgun:**
```
v=spf1 include:mailgun.org ~all
```

**Multiple Services:**
```
v=spf1 include:_spf.google.com include:sendgrid.net ~all
```

**No Email Service (Strict):**
```
v=spf1 -all
```
(This blocks ALL emails from your domain - use if not sending emails)

---

## DMARC Record Setup

### What is DMARC?
Domain-based Message Authentication, Reporting & Conformance - Tells email servers what to do with emails that fail SPF/DKIM checks.

### How to Add DMARC Record:

1. **Go to your DNS provider**
2. **Add a TXT record**:

```
Type: TXT
Name: _dmarc (or _dmarc.trackmcp.com)
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@trackmcp.com
```

### DMARC Policy Options:

**None (Monitoring only):**
```
v=DMARC1; p=none; rua=mailto:dmarc@trackmcp.com
```
- Monitors but doesn't block
- Good for testing

**Quarantine (Recommended):**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@trackmcp.com
```
- Suspicious emails go to spam
- Good balance

**Reject (Strict):**
```
v=DMARC1; p=reject; rua=mailto:dmarc@trackmcp.com
```
- Blocks all suspicious emails
- Most secure

---

## Complete DNS Setup Example

### If Using Google Workspace:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@trackmcp.com; pct=100
```

**DKIM Record:**
(Get from Google Workspace admin console)
```
Type: TXT
Name: google._domainkey
Value: [provided by Google]
```

---

## If NOT Sending Emails

### Strict Policy (Recommended):

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 -all
```
(Blocks all emails from your domain)

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=reject; rua=mailto:admin@trackmcp.com
```
(Rejects all emails claiming to be from your domain)

**Why?** Prevents spammers from spoofing your domain.

---

## Verification

### Check SPF Record:
```bash
dig trackmcp.com TXT | grep spf
```

Or use online tools:
- https://mxtoolbox.com/spf.aspx
- https://www.kitterman.com/spf/validate.html

### Check DMARC Record:
```bash
dig _dmarc.trackmcp.com TXT
```

Or use online tools:
- https://mxtoolbox.com/dmarc.aspx
- https://dmarcian.com/dmarc-inspector/

---

## Common Issues

### Issue: SPF record not found
**Solution**: 
- Check DNS propagation (can take 24-48 hours)
- Verify record name is `@` or root domain
- Check for typos in value

### Issue: Multiple SPF records
**Solution**: 
- Only ONE SPF record allowed per domain
- Combine multiple services in one record:
  ```
  v=spf1 include:service1.com include:service2.com ~all
  ```

### Issue: DMARC reports not received
**Solution**:
- Check email address in `rua=` is valid
- Check spam folder
- May take 24-48 hours to receive first report

---

## Recommended Setup for Track MCP

### Option 1: Not Sending Emails (Recommended)

**SPF:**
```
Type: TXT
Name: @
Value: v=spf1 -all
```

**DMARC:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=reject; rua=mailto:admin@trackmcp.com
```

**Why?** Protects your domain from spoofing.

### Option 2: Planning to Send Emails

Wait until you set up email service, then:
1. Get SPF record from email provider
2. Add SPF record
3. Add DMARC record (start with `p=none`)
4. Monitor for 2 weeks
5. Change to `p=quarantine`
6. Monitor for 2 weeks
7. Change to `p=reject`

---

## Priority

**For Track MCP: LOW PRIORITY**

Reasons:
- No email functionality currently
- Not sending transactional emails
- Not sending marketing emails
- Contact forms use external services

**When to implement:**
- When you start sending emails
- When you add user authentication with email
- When you add newsletter functionality
- When you want to prevent domain spoofing

---

## Resources

- [Google SPF Setup](https://support.google.com/a/answer/33786)
- [DMARC.org](https://dmarc.org/)
- [MXToolbox](https://mxtoolbox.com/)
- [DMARC Analyzer](https://www.dmarcanalyzer.com/)

---

**Conclusion**: Email DNS records are LOW PRIORITY for Track MCP unless you plan to send emails from your domain.
