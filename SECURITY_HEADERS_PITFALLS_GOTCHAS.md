# Security Headers: Pitfalls & Gotchas

## ⚠️ Common Mistakes & How to Avoid Them

---

## 1. CSP Breaking Scripts & Styles

### The Problem:
CSP blocks inline scripts and styles by default. If your site relies on inline code, CSP will break it.

### Common Culprits:

#### Inline Scripts:
```html
<!-- ❌ BLOCKED by CSP -->
<script>
  const apiUrl = 'https://api.trackmcp.com'
  console.log('Page loaded')
</script>
```

#### Inline Styles:
```html
<!-- ❌ BLOCKED by CSP -->
<div style="color: red; font-size: 16px;">Text</div>
```

#### Event Handlers:
```html
<!-- ❌ BLOCKED by CSP -->
<button onclick="handleClick()">Click me</button>
```

#### Third-Party Widgets:
```html
<!-- ❌ BLOCKED by CSP (if not in allowed hosts) -->
<script src="https://widget.example.com/embed.js"></script>
```

#### Analytics Scripts:
```html
<!-- ❌ BLOCKED by CSP (if not in allowed hosts) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

#### Font Providers:
```html
<!-- ❌ BLOCKED by CSP (if not in allowed hosts) -->
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">
```

### Solutions:

#### Solution 1: Move Inline Scripts to External Files
```javascript
// ❌ BEFORE (inline)
<script>
  const apiUrl = 'https://api.trackmcp.com'
</script>

// ✅ AFTER (external file)
// config.js
window.config = { apiUrl: 'https://api.trackmcp.com' }

// In HTML
<script src="/config.js"></script>
```

#### Solution 2: Move Inline Styles to CSS Files
```css
/* ❌ BEFORE (inline) */
<div style="color: red; font-size: 16px;">Text</div>

/* ✅ AFTER (CSS file) */
/* styles.css */
.text-red {
  color: red;
  font-size: 16px;
}

/* In HTML */
<div class="text-red">Text</div>
```

#### Solution 3: Use Event Listeners Instead of Handlers
```javascript
// ❌ BEFORE (inline handler)
<button onclick="handleClick()">Click me</button>

// ✅ AFTER (event listener)
// script.js
document.querySelector('button').addEventListener('click', handleClick)

// In HTML
<button id="my-button">Click me</button>
```

#### Solution 4: Add Third-Party Hosts to CSP
```typescript
// middleware.ts
const cspHeader = `
  script-src 'self' 
    https://widget.example.com
    https://www.googletagmanager.com
    https://www.google-analytics.com;
  style-src 'self' 
    https://fonts.googleapis.com;
  font-src 'self' 
    https://fonts.gstatic.com;
`
```

#### Solution 5: Use Nonces for Necessary Inline Scripts
```typescript
// middleware.ts - Generate nonce
import crypto from 'crypto'

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('hex')
  
  const cspHeader = `
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
  `
  
  // Pass nonce to template
  response.headers.append('X-Nonce', nonce)
  response.headers.append('Content-Security-Policy', cspHeader)
}
```

```html
<!-- In HTML template -->
<script nonce="<%= nonce %>">
  const apiUrl = 'https://api.trackmcp.com'
</script>

<style nonce="<%= nonce %>">
  body { color: red; }
</style>
```

### Prevention Checklist:
- [ ] Audit all inline scripts
- [ ] Audit all inline styles
- [ ] Audit all event handlers
- [ ] Audit all third-party widgets
- [ ] Audit all analytics scripts
- [ ] Audit all font providers
- [ ] Move inline code to external files
- [ ] Add third-party hosts to CSP
- [ ] Use nonces for necessary inline code
- [ ] Test thoroughly

---

## 2. HSTS with includeSubDomains Breaking Subdomains

### The Problem:
When you set `includeSubDomains`, ALL subdomains are forced to HTTPS. If any subdomain is HTTP-only, it will break.

### Example Scenario:
```
Your domain: www.trackmcp.com (HTTPS ✅)
Subdomains:
  - api.trackmcp.com (HTTPS ✅)
  - app.trackmcp.com (HTTPS ✅)
  - dev.trackmcp.com (HTTP ❌) ← PROBLEM!
  - mail.trackmcp.com (HTTP ❌) ← PROBLEM!

HSTS header:
  Strict-Transport-Security: max-age=63072000; includeSubDomains

Result:
  - Browser forces dev.trackmcp.com to HTTPS
  - Connection fails (no HTTPS certificate)
  - Subdomain breaks ❌
```

### How to Check:

#### 1. Audit All Subdomains:
```bash
# List all subdomains
nslookup -type=ANY trackmcp.com

# Check each subdomain
curl -I https://api.trackmcp.com
curl -I https://app.trackmcp.com
curl -I https://dev.trackmcp.com
curl -I https://mail.trackmcp.com

# All should return HTTPS (no redirects)
```

#### 2. Check for HTTP Redirects:
```bash
# Should NOT redirect
curl -I http://api.trackmcp.com
# Should return 301/302 to HTTPS (or error)

# Should NOT have HTTP version
curl -I http://dev.trackmcp.com
# Should fail or redirect to HTTPS
```

#### 3. Verify SSL Certificates:
```bash
# Check certificate for each subdomain
openssl s_client -connect api.trackmcp.com:443
openssl s_client -connect dev.trackmcp.com:443

# All should have valid certificates
```

### Solutions:

#### Solution 1: Migrate All Subdomains to HTTPS
```bash
# For each subdomain:
1. Get SSL certificate (Let's Encrypt is free)
2. Configure HTTPS
3. Redirect HTTP → HTTPS
4. Test thoroughly
5. Verify in browser
```

#### Solution 2: Use HSTS Without includeSubDomains (Temporary)
```typescript
// middleware.ts - Temporary (while migrating)
response.headers.append(
  'Strict-Transport-Security',
  'max-age=63072000'  // No includeSubDomains
)

// After all subdomains are HTTPS:
response.headers.append(
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains'  // Add includeSubDomains
)
```

#### Solution 3: Use HSTS Preload List
```typescript
// Only after ALL requirements met:
response.headers.append(
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains; preload'
)
```

### HSTS Preload Requirements:
- ✅ HTTPS on root domain
- ✅ HTTPS on ALL subdomains
- ✅ Valid HSTS header with includeSubDomains
- ✅ max-age at least 18 weeks (10,886,400 seconds)
- ✅ No HTTP redirects on subdomains
- ✅ Root domain redirects HTTP → HTTPS
- ✅ Serve header on root domain

### Prevention Checklist:
- [ ] Audit all subdomains
- [ ] Verify HTTPS on all subdomains
- [ ] Check for HTTP redirects
- [ ] Verify SSL certificates
- [ ] Test with curl
- [ ] Test in browser
- [ ] Only add includeSubDomains when ready
- [ ] Monitor for issues
- [ ] Plan HSTS preload submission

---

## 3. X-Frame-Options vs CSP frame-ancestors Conflicts

### The Problem:
If you set both X-Frame-Options and CSP frame-ancestors, they must agree. Conflicting values cause confusion.

### Example Conflict:
```
X-Frame-Options: DENY
CSP: frame-ancestors 'self'

Result:
- X-Frame-Options says: Block all framing
- CSP says: Allow same-origin framing
- Browsers: Confused, may apply most restrictive
```

### Browser Behavior:
```
Most browsers apply the most restrictive:
- X-Frame-Options: DENY (most restrictive)
- CSP: frame-ancestors 'self' (less restrictive)
→ Result: DENY wins (no framing allowed)
```

### Solutions:

#### Solution 1: Use CSP frame-ancestors (Preferred)
```typescript
// middleware.ts - Use CSP only
const cspHeader = `
  frame-ancestors 'none'  // Equivalent to X-Frame-Options: DENY
`

// Remove X-Frame-Options
// response.headers.append('X-Frame-Options', 'DENY')  // ← Remove this
```

#### Solution 2: Keep Both but Ensure Agreement
```typescript
// middleware.ts - Both headers agree
response.headers.append('X-Frame-Options', 'DENY')
response.headers.append('Content-Security-Policy', `frame-ancestors 'none'`)

// Both say: No framing allowed ✅
```

#### Solution 3: Allow Same-Origin Framing
```typescript
// middleware.ts - Both headers agree
response.headers.append('X-Frame-Options', 'SAMEORIGIN')
response.headers.append('Content-Security-Policy', `frame-ancestors 'self'`)

// Both say: Same-origin framing allowed ✅
```

### Comparison:

| Scenario | X-Frame-Options | CSP frame-ancestors | Result |
|----------|-----------------|-------------------|--------|
| Block all | DENY | 'none' | ✅ Agree |
| Allow same-origin | SAMEORIGIN | 'self' | ✅ Agree |
| Allow specific | (not possible) | 'self' "https://trusted.com" | ⚠️ X-Frame-Options can't do this |
| Conflict | DENY | 'self' | ❌ Disagree |

### Recommendation:
```
Use CSP frame-ancestors (modern standard)
Remove X-Frame-Options (legacy)

If you need to support old browsers:
  Keep both but ensure they agree
```

### Prevention Checklist:
- [ ] Decide: CSP only or both?
- [ ] If both, ensure they match
- [ ] Test in multiple browsers
- [ ] Document the decision
- [ ] Monitor for issues

---

## 4. Permissions-Policy Format Variations

### The Problem:
Permissions-Policy syntax varies across browsers. Some browsers use older Feature-Policy syntax.

### Format Variations:

#### Modern Format (Preferred):
```
Permissions-Policy: geolocation=(), camera=()
```

#### Legacy Format (Feature-Policy):
```
Feature-Policy: geolocation 'none'; camera 'none'
```

#### Syntax Differences:
```
Modern:
  directive=()              # Deny all
  directive=(self)          # Allow same-origin
  directive=*               # Allow all

Legacy:
  directive 'none'          # Deny all
  directive 'self'          # Allow same-origin
  directive *               # Allow all
```

### Browser Support:

| Browser | Permissions-Policy | Feature-Policy |
|---------|-------------------|-----------------|
| Chrome | ✅ Yes | ✅ Yes (legacy) |
| Firefox | ✅ Yes | ❌ No |
| Safari | ✅ Yes | ❌ No |
| Edge | ✅ Yes | ✅ Yes (legacy) |
| IE 11 | ❌ No | ❌ No |

### Solutions:

#### Solution 1: Use Modern Format Only
```typescript
// middleware.ts
response.headers.append(
  'Permissions-Policy',
  'geolocation=(), camera=(), microphone=()'
)
```

#### Solution 2: Send Both Headers (Maximum Compatibility)
```typescript
// middleware.ts
response.headers.append(
  'Permissions-Policy',
  'geolocation=(), camera=(), microphone=()'
)
response.headers.append(
  'Feature-Policy',
  "geolocation 'none'; camera 'none'; microphone 'none'"
)
```

#### Solution 3: Test in Multiple Browsers
```bash
# Test in Chrome
curl -I https://www.trackmcp.com | grep -i permissions-policy

# Test in Firefox
curl -I https://www.trackmcp.com | grep -i feature-policy

# Test in Safari
curl -I https://www.trackmcp.com | grep -i permissions-policy
```

### Prevention Checklist:
- [ ] Use modern Permissions-Policy format
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Verify headers in DevTools
- [ ] Check for console warnings
- [ ] Consider sending both headers for compatibility
- [ ] Document format choice

---

## 5. Expect-CT is Rarely Necessary

### What is Expect-CT?
```
Expect-CT: max-age=86400; enforce; report-uri="https://example.com/report"
```

Expect-CT tells browsers to enforce Certificate Transparency (CT) logging.

### Why It's Rarely Needed:

#### 1. Modern Browsers Enforce CT by Default
```
Chrome:     ✅ Enforces CT by default
Firefox:    ✅ Enforces CT by default
Safari:     ✅ Enforces CT by default
Edge:       ✅ Enforces CT by default
```

#### 2. CAs Already Log Certificates
```
All major Certificate Authorities:
✅ Log certificates to CT logs
✅ Provide CT proofs
✅ Comply with CT requirements
```

#### 3. HSTS is More Important
```
HSTS:       Enforces HTTPS
Expect-CT:  Enforces CT logging

HSTS is more critical for security
```

### When You Might Need It:
```
Scenarios where Expect-CT is useful:
1. Testing CT enforcement
2. Monitoring for misissued certificates
3. Compliance requirements
4. Enterprise security policies

For most sites: Not necessary
```

### Recommendation:
```
Skip Expect-CT unless you have specific requirements

Focus on:
✅ HSTS (enforce HTTPS)
✅ CSP (prevent XSS)
✅ Other security headers
```

### If You Want to Add It:
```typescript
// middleware.ts (optional)
response.headers.append(
  'Expect-CT',
  'max-age=86400; enforce'
)
```

---

## 6. Additional Gotchas

### Gotcha 1: CSP Report-Only Not Enforcing
```
Problem: CSP violations not blocked
Cause: Using Content-Security-Policy-Report-Only
Solution: Switch to Content-Security-Policy when ready
```

### Gotcha 2: HSTS Preload Permanent
```
Problem: Can't remove HSTS preload
Cause: Once in preload list, very hard to remove
Solution: Test thoroughly before submitting
Timeline: Removal takes 6+ months
```

### Gotcha 3: Subdomains Inherit HSTS
```
Problem: Subdomain breaks after HSTS
Cause: includeSubDomains applies to all subdomains
Solution: Verify all subdomains are HTTPS first
```

### Gotcha 4: CSP Breaks Analytics
```
Problem: Analytics not working
Cause: Analytics script blocked by CSP
Solution: Add analytics host to CSP
```

### Gotcha 5: Permissions-Policy Typos
```
Problem: API still accessible
Cause: Typo in directive name
Solution: Double-check spelling
Example: geolocation=() vs geolocation ()
```

### Gotcha 6: X-Frame-Options Blocks Legitimate Iframes
```
Problem: Embedded content not loading
Cause: X-Frame-Options: DENY
Solution: Use SAMEORIGIN or CSP frame-ancestors 'self'
```

### Gotcha 7: CSP Nonce Changes Per Request
```
Problem: Nonce mismatch
Cause: Nonce not updated for each request
Solution: Generate new nonce per request
```

---

## 🧪 Testing Checklist

### Before Deploying:
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile
- [ ] Check console for errors
- [ ] Check console for warnings
- [ ] Run Lighthouse
- [ ] Run Security Headers scan
- [ ] Run Mozilla Observatory scan

### After Deploying:
- [ ] Monitor error logs
- [ ] Monitor CSP violations
- [ ] Check user reports
- [ ] Verify analytics working
- [ ] Verify third-party services working
- [ ] Verify all subdomains working
- [ ] Verify all APIs working
- [ ] Monitor for 24 hours

### Common Test Cases:
```javascript
// Test CSP blocking inline script
<script>alert('XSS')</script>

// Test CSP blocking inline style
<div style="color: red;">Text</div>

// Test Permissions-Policy blocking geolocation
navigator.geolocation.getCurrentPosition(...)

// Test X-Frame-Options blocking iframe
<iframe src="https://www.trackmcp.com"></iframe>

// Test HSTS forcing HTTPS
http://www.trackmcp.com (should redirect to HTTPS)
```

---

## 📋 Prevention Checklist

### General:
- [ ] Read all security header documentation
- [ ] Understand each header's purpose
- [ ] Test in staging first
- [ ] Have rollback plan
- [ ] Monitor after deployment
- [ ] Document all changes

### CSP:
- [ ] Audit inline scripts
- [ ] Audit inline styles
- [ ] Audit third-party services
- [ ] Test Report-Only mode
- [ ] Fix all violations
- [ ] Switch to enforcement

### HSTS:
- [ ] Verify HTTPS on all subdomains
- [ ] Check for HTTP redirects
- [ ] Verify SSL certificates
- [ ] Test with curl
- [ ] Only add includeSubDomains when ready
- [ ] Plan HSTS preload submission

### X-Frame-Options vs CSP:
- [ ] Decide: CSP only or both?
- [ ] Ensure headers agree
- [ ] Test in multiple browsers
- [ ] Document decision

### Permissions-Policy:
- [ ] Use modern format
- [ ] Test in multiple browsers
- [ ] Verify in DevTools
- [ ] Check for console warnings

### General Testing:
- [ ] Test in all browsers
- [ ] Test on mobile
- [ ] Run Lighthouse
- [ ] Run online security scanners
- [ ] Monitor after deployment

---

## 🚀 Key Takeaways

1. **CSP Breaking Code**
   - Move inline scripts to external files
   - Move inline styles to CSS files
   - Add third-party hosts to CSP
   - Use nonces for necessary inline code

2. **HSTS Breaking Subdomains**
   - Verify ALL subdomains are HTTPS
   - Check for HTTP redirects
   - Only add includeSubDomains when ready
   - Test thoroughly before enabling

3. **X-Frame-Options vs CSP**
   - Prefer CSP frame-ancestors
   - If both, ensure they agree
   - Test in multiple browsers

4. **Permissions-Policy Format**
   - Use modern format
   - Test in multiple browsers
   - Consider sending both for compatibility

5. **Expect-CT**
   - Rarely necessary
   - Skip unless required
   - Focus on HSTS and CSP instead

6. **General**
   - Test in staging first
   - Have rollback plan
   - Monitor after deployment
   - Document all changes

---

## 🔗 Resources

- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

