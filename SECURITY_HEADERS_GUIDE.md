# Security Headers Implementation Guide

## 📋 Overview

Security headers are HTTP response headers that instruct browsers how to behave when handling your site's content. They protect against common web vulnerabilities.

---

## 🔒 Implemented Security Headers

### 1. **Strict-Transport-Security (HSTS)**

**What it does:**
- Tells browsers to only use HTTPS for your domain
- Prevents downgrade attacks (HTTPS → HTTP)
- Prevents accidental HTTP connections
- Applies to all subdomains (if `includeSubDomains` is set)

**Current Configuration:**
```
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

**Parameters:**
- `max-age=63072000` → 2 years (recommended production value)
- `includeSubDomains` → Apply to all subdomains
- `preload` → NOT YET (requires full compliance)

**Rollout Plan:**
```
Phase 1 (Current): max-age=63072000; includeSubDomains
  ✅ Testing phase
  ✅ Verify all subdomains use HTTPS
  ✅ Check for HTTP redirects
  ✅ Monitor for issues (1-3 months)

Phase 2 (After validation): Add preload
  ✅ Ensure HTTPS everywhere
  ✅ Verify no HTTP redirects
  ✅ Test thoroughly
  ✅ Add: max-age=63072000; includeSubDomains; preload
  ✅ Submit to HSTS preload list
```

**HSTS Preload Requirements:**
- ✅ HTTPS everywhere (all subdomains)
- ✅ Valid HSTS header with `includeSubDomains`
- ✅ `max-age` at least 18 weeks (10,886,400 seconds)
- ✅ No HTTP redirects on subdomains
- ✅ Serve header on root domain
- ✅ Redirect from HTTP to HTTPS on root

**Why 2 years?**
- Industry standard for production
- Balances security with flexibility
- Allows time for certificate renewal
- Reduces browser requests for HSTS validation

---

### 2. **X-Content-Type-Options**

**What it does:**
- Prevents MIME type sniffing attacks
- Forces browser to respect declared content type
- Protects against malicious file uploads

**Configuration:**
```
X-Content-Type-Options: nosniff
```

**Why `nosniff`:**
- `nosniff` → Don't guess content type, use declared type
- Prevents browser from executing scripts disguised as other types
- Essential for security

---

### 3. **X-Frame-Options**

**What it does:**
- Controls whether page can be embedded in frames/iframes
- Prevents clickjacking attacks
- Protects against malicious framing

**Configuration:**
```
X-Frame-Options: DENY
```

**Options:**
- `DENY` → Cannot be framed anywhere (most restrictive)
- `SAMEORIGIN` → Can be framed by same origin only
- `ALLOW-FROM uri` → Can be framed by specific origin (deprecated)

**Why `DENY`:**
- Prevents all framing (safest option)
- If you need iframes, use `SAMEORIGIN`

---

### 4. **X-XSS-Protection**

**What it does:**
- Enables browser's built-in XSS protection
- Instructs browser to block page if XSS detected
- Legacy header (CSP is preferred, but still useful)

**Configuration:**
```
X-XSS-Protection: 1; mode=block
```

**Parameters:**
- `1` → Enable XSS protection
- `mode=block` → Block page if XSS detected (don't sanitize)

---

### 5. **Referrer-Policy**

**What it does:**
- Controls how much referrer information is sent
- Protects user privacy
- Prevents sensitive URL leakage

**Configuration:**
```
Referrer-Policy: strict-origin-when-cross-origin
```

**Options:**
- `no-referrer` → Never send referrer (most private)
- `strict-origin-when-cross-origin` → Send origin only for cross-origin (recommended)
- `same-origin` → Send referrer only for same-origin
- `origin` → Always send origin

**Why `strict-origin-when-cross-origin`:**
- Balances privacy and functionality
- Sends full referrer for same-origin (needed for analytics)
- Sends only origin for cross-origin (privacy protection)
- Doesn't send referrer for HTTP→HTTPS downgrade

---

### 6. **Permissions-Policy** (formerly Feature-Policy)

**What it does:**
- Controls which browser features can be used
- Disables dangerous APIs (geolocation, camera, microphone, etc.)
- Prevents malicious scripts from accessing sensitive features

**Configuration:**
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

**Disabled Features:**
- `geolocation=()` → Disable geolocation API
- `microphone=()` → Disable microphone access
- `camera=()` → Disable camera access
- `payment=()` → Disable Payment Request API
- `usb=()` → Disable USB API
- `magnetometer=()` → Disable magnetometer sensor
- `gyroscope=()` → Disable gyroscope sensor
- `accelerometer=()` → Disable accelerometer sensor

**Why disable all?**
- You don't need these features for Track MCP
- Prevents malicious scripts from accessing them
- Reduces attack surface

---

### 7. **Content-Security-Policy-Report-Only** (CSP)

**What it does:**
- Defines which content sources are allowed
- Prevents inline scripts and unauthorized resources
- Currently in report-only mode (violations logged, not blocked)

**See:** `CSP_IMPLEMENTATION_GUIDE.md` for detailed CSP configuration

---

## 📊 Security Headers Checklist

### Current Implementation (✅ Complete):
- ✅ Strict-Transport-Security: 2 years + includeSubDomains
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: All dangerous APIs disabled
- ✅ Content-Security-Policy-Report-Only: Active (monitoring mode)

### Verification:
```bash
# Check headers (replace with your domain)
curl -I https://www.trackmcp.com

# Should see:
# Strict-Transport-Security: max-age=63072000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: geolocation=(), ...
# Content-Security-Policy-Report-Only: ...
```

---

## 🚀 HSTS Preload Rollout Plan

### Phase 1: Current (Testing - 1-3 months)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains
```
- ✅ Verify all subdomains use HTTPS
- ✅ Check for HTTP redirects
- ✅ Monitor browser behavior
- ✅ Test with real users

### Phase 2: Validation (After Phase 1)
**Checklist before adding preload:**
- [ ] All subdomains serve HTTPS
- [ ] No HTTP redirects on subdomains
- [ ] Root domain redirects HTTP → HTTPS
- [ ] HSTS header served on root domain
- [ ] No certificate issues for 1+ month
- [ ] No user complaints about HTTPS issues

### Phase 3: Preload (After Phase 2)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- ✅ Add `preload` directive
- ✅ Submit to HSTS preload list: https://hstspreload.org/
- ✅ Wait for inclusion (1-2 months)
- ✅ Verify in Chrome preload list

### Phase 4: Maintenance (Ongoing)
- ✅ Monitor HSTS preload status
- ✅ Keep HTTPS certificate valid
- ✅ Maintain all subdomains on HTTPS
- ✅ Monitor for any HSTS issues

---

## 🔍 Testing & Verification

### Online Tools:
1. **Mozilla Observatory**: https://observatory.mozilla.org/
   - Scan your domain
   - Get security score
   - See recommendations

2. **Security Headers**: https://securityheaders.com/
   - Check all security headers
   - Get grade (A-F)
   - See missing headers

3. **HSTS Preload**: https://hstspreload.org/
   - Check preload status
   - Submit domain
   - View requirements

### Manual Testing:
```bash
# Check HSTS header
curl -I https://www.trackmcp.com | grep Strict-Transport-Security

# Check all security headers
curl -I https://www.trackmcp.com | grep -E "Strict-Transport|X-Content|X-Frame|X-XSS|Referrer|Permissions|Content-Security"

# Test HSTS preload eligibility
# Visit: https://hstspreload.org/ and enter your domain
```

---

## 📝 Implementation Timeline

### Week 1: Deploy
- ✅ Deploy middleware.ts with security headers
- ✅ Deploy CSP report endpoint
- ✅ Verify headers are being sent

### Week 2-4: Monitor
- ✅ Check Mozilla Observatory score
- ✅ Monitor CSP violations
- ✅ Verify HTTPS on all subdomains
- ✅ Check for user issues

### Month 2: Optimize
- ✅ Adjust CSP rules based on violations
- ✅ Remove report-only mode if stable
- ✅ Enforce CSP if no critical violations

### Month 3+: Preload
- ✅ Verify all requirements met
- ✅ Add preload directive
- ✅ Submit to HSTS preload list
- ✅ Monitor preload status

---

## ⚠️ Important Notes

### HSTS Considerations:
- **Irreversible**: Once set, browsers enforce HSTS for max-age duration
- **All subdomains**: `includeSubDomains` applies to ALL subdomains
- **Certificate renewal**: Ensure certificates are renewed before expiry
- **Preload is permanent**: Once in preload list, very difficult to remove

### CSP Considerations:
- **Report-only first**: Always test with report-only before enforcing
- **Monitor violations**: Check /api/csp-report endpoint regularly
- **Gradual enforcement**: Add sources incrementally
- **User impact**: Broken features if CSP too restrictive

### General Best Practices:
- ✅ Test in staging first
- ✅ Monitor for user issues
- ✅ Keep security headers updated
- ✅ Review quarterly
- ✅ Document all changes

---

## 🎯 Next Steps

1. **Deploy middleware.ts** to production
2. **Verify headers** using online tools
3. **Monitor for 1-3 months** (Phase 1)
4. **Plan Phase 2** validation
5. **Submit to HSTS preload** (Phase 3)
6. **Maintain ongoing** (Phase 4)

