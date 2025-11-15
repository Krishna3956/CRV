# CSP Tuning - Quick Start Guide

## 🎯 Practical Steps to Tune CSP Quickly

This guide provides actionable steps to rapidly tune your CSP and move from Report-Only to enforcement.

---

## Phase 1: Deploy Report-Only CSP (Day 1)

### Step 1: Verify Report-Only Header is Active
```bash
# Check current middleware.ts
curl -I https://www.trackmcp.com | grep Content-Security-Policy

# Should see:
# Content-Security-Policy-Report-Only: default-src 'self'; ...
```

### Step 2: Verify CSP Report Endpoint is Working
```bash
# Check endpoint exists
curl -I https://www.trackmcp.com/api/csp-report

# Should return 405 (Method Not Allowed) for GET
# This is expected - endpoint only accepts POST
```

### Step 3: Check Console for Violations
```bash
# Open browser DevTools
# Go to Console tab
# Look for CSP violation messages

# Example:
# Refused to load the script 'https://example.com/script.js'
# because it violates the following Content Security Policy directive
```

### Step 4: Monitor /api/csp-report Endpoint
```bash
# In production, check server logs
# Look for CSP violation reports

# Example log entry:
# 🚨 CSP Violation Report: {
#   documentUri: "https://www.trackmcp.com/",
#   violatedDirective: "script-src",
#   blockedUri: "https://example.com/script.js",
#   ...
# }
```

---

## Phase 2: Collect Violations (Days 1-3)

### Step 1: Browse Your Site Thoroughly
```bash
# Visit all major pages:
1. Homepage
2. Search page
3. Tool detail pages
4. Admin pages (if any)
5. Settings pages
6. Any embedded content
7. Third-party widgets
```

### Step 2: Use All Features
```bash
# Interact with everything:
1. Click all buttons
2. Submit all forms
3. Load all images
4. Play all videos
5. Use all widgets
6. Trigger all animations
7. Test all interactions
```

### Step 3: Check Browser Console
```bash
# Open DevTools (F12)
# Go to Console tab
# Look for CSP violations

# Common violations:
- Refused to load script from ...
- Refused to load stylesheet from ...
- Refused to load font from ...
- Refused to load image from ...
- Refused to connect to ...
```

### Step 4: Check Server Logs
```bash
# Monitor /api/csp-report endpoint
# Look for patterns in violations

# Group by:
- Violated directive (script-src, style-src, etc.)
- Blocked URI (which hosts are blocked)
- Document URI (which pages have violations)
```

### Step 5: Create Violation Report
```
Document all violations found:

Violation Type: script-src
Blocked Host: https://www.googletagmanager.com
Page: All pages
Reason: Google Analytics script

Violation Type: style-src
Blocked Host: https://fonts.googleapis.com
Page: All pages
Reason: Google Fonts

Violation Type: connect-src
Blocked Host: https://api.example.com
Page: Search page
Reason: API calls
```

---

## Phase 3: Add Required Hosts (Days 3-5)

### Step 1: Identify Required Hosts
```
From your violation report, identify:
- Third-party scripts (analytics, widgets, etc.)
- Third-party stylesheets (fonts, UI libraries, etc.)
- Third-party fonts
- API endpoints
- CDN hosts
```

### Step 2: Update CSP in Middleware
```typescript
// middleware.ts

const cspHeader = `
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules'
    https://cdn.jsdelivr.net
    https://cdn.vercel-analytics.com
    https://www.googletagmanager.com
    https://www.google-analytics.com
    https://api.example.com
    'unsafe-inline';
  style-src 'self' 'unsafe-inline'
    https://fonts.googleapis.com
    https://cdn.example.com;
  font-src 'self'
    https://fonts.gstatic.com
    https://fonts.example.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https:
    http://localhost:3000
    http://localhost:3004
    https://www.google-analytics.com
    https://www.googletagmanager.com
    https://api.example.com;
  frame-src 'self' https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  report-uri /api/csp-report;
`
```

### Step 3: Deploy Changes
```bash
# Deploy updated middleware.ts
# Verify changes deployed
curl -I https://www.trackmcp.com | grep Content-Security-Policy
```

### Step 4: Test Again
```bash
# Browse site again
# Check for new violations
# Monitor /api/csp-report
# Update CSP if new violations found
```

### Step 5: Repeat Until No Violations
```
Iteration 1: Find violations → Add hosts → Deploy
Iteration 2: Find violations → Add hosts → Deploy
Iteration 3: Find violations → Add hosts → Deploy
...
Continue until: 0 violations for 24+ hours
```

---

## Phase 4: Remove 'unsafe-inline' (Days 5-7)

### Step 1: Audit Inline Styles
```bash
# Find all inline styles
grep -r "style=" src/

# Example findings:
# src/components/Header.tsx:  <div style="color: red;">
# src/pages/Home.tsx:  <button style="padding: 10px;">
```

### Step 2: Extract to CSS Files
```css
/* styles.css */
.header-red {
  color: red;
}

.button-padded {
  padding: 10px;
}
```

```tsx
// Component
<div className="header-red">Text</div>
<button className="button-padded">Click</button>
```

### Step 3: Audit Inline Scripts
```bash
# Find all inline scripts
grep -r "<script>" src/ | grep -v "src="

# Example findings:
# src/pages/Home.tsx:  <script>const api = '...'</script>
```

### Step 4: Extract to External Files
```javascript
// config.js
window.config = {
  apiUrl: 'https://api.trackmcp.com'
}
```

```html
<!-- In HTML -->
<script src="/config.js"></script>
```

### Step 5: Update CSP
```typescript
// Remove 'unsafe-inline' from style-src
// BEFORE:
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com

// AFTER:
style-src 'self' https://fonts.googleapis.com
```

### Step 6: Deploy and Test
```bash
# Deploy changes
# Monitor for violations
# If violations, either:
# a) Move more inline code to external files
# b) Add back 'unsafe-inline' temporarily
```

---

## Phase 5: Monitor for 1 Week (Days 7-14)

### Daily Checklist:
```bash
# Each day:
1. Check server logs for CSP violations
2. Check /api/csp-report endpoint
3. Browse site randomly
4. Check browser console
5. Run Lighthouse
6. Document any violations found
```

### What to Look For:
```
✅ GOOD: 0 violations per day
⚠️ WARNING: 1-5 violations per day (investigate)
❌ BAD: 10+ violations per day (don't proceed)
```

### If Violations Found:
```
1. Identify the violation
2. Determine the cause
3. Add host to CSP or
4. Move inline code to external file
5. Deploy fix
6. Monitor for 24 hours
7. If no new violations, continue
```

### Success Criteria:
```
✅ 0 unexpected violations for 7 consecutive days
✅ All features working correctly
✅ No user-reported issues
✅ Analytics working
✅ Third-party services working
✅ All pages loading correctly
```

---

## Phase 6: Switch to Enforcement (Day 14)

### Step 1: Verify No Violations
```bash
# Check logs for past 7 days
# Should see 0 violations

# If violations found:
# Go back to Phase 5
# Fix violations
# Wait another 7 days
```

### Step 2: Update Middleware
```typescript
// middleware.ts

// BEFORE (Report-Only):
response.headers.append('Content-Security-Policy-Report-Only', cspHeader)

// AFTER (Enforcement):
response.headers.append('Content-Security-Policy', cspHeader)
```

### Step 3: Deploy to Production
```bash
# Deploy updated middleware.ts
# Verify deployment successful
curl -I https://www.trackmcp.com | grep Content-Security-Policy

# Should see:
# Content-Security-Policy: default-src 'self'; ...
# (NOT Content-Security-Policy-Report-Only)
```

### Step 4: Monitor Closely (First 24 Hours)
```bash
# Monitor error logs
# Check for user-reported issues
# Monitor /api/csp-report (should be empty)
# Run Lighthouse
# Test in all browsers
```

### Step 5: If Issues Found
```
If CSP is blocking legitimate content:
1. Revert to Report-Only mode
2. Identify the issue
3. Fix in CSP
4. Wait 7 days
5. Try enforcement again
```

---

## Phase 7: Continuous Monitoring (Ongoing)

### Weekly Checks:
```bash
# Every week:
1. Check /api/csp-report for violations
2. Monitor error logs
3. Run Lighthouse
4. Test in all browsers
5. Check user reports
```

### Monthly Checks:
```bash
# Every month:
1. Review CSP policy
2. Remove unnecessary hosts
3. Tighten restrictions where possible
4. Update third-party services
5. Document changes
```

### Quarterly Reviews:
```bash
# Every quarter:
1. Full security audit
2. Review all third-party services
3. Update CSP based on changes
4. Plan next hardening phase
5. Document lessons learned
```

---

## 🔧 CSP Report Endpoint Details

### Current Implementation:
```typescript
// src/app/api/csp-report/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const report = body['csp-report']
  
  console.error('🚨 CSP Violation Report:', {
    timestamp: new Date().toISOString(),
    documentUri: report['document-uri'],
    violatedDirective: report['violated-directive'],
    blockedUri: report['blocked-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
    // ... more fields
  })
  
  return NextResponse.json({ success: true }, { status: 204 })
}
```

### Accessing Reports:

#### Option 1: Server Logs
```bash
# Check application logs
# Look for "🚨 CSP Violation Report"
# Grep for specific violations
grep "CSP Violation" logs.txt
```

#### Option 2: Monitoring Service
```typescript
// Add to /api/csp-report/route.ts
await fetch('https://your-monitoring-service.com/csp-reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(report),
})
```

#### Option 3: Database Logging
```typescript
// Add to /api/csp-report/route.ts
await db.cspViolations.create({
  documentUri: report['document-uri'],
  violatedDirective: report['violated-directive'],
  blockedUri: report['blocked-uri'],
  timestamp: new Date(),
})
```

---

## 📊 CSP Tuning Checklist

### Phase 1: Deploy Report-Only
- [ ] Verify Report-Only header active
- [ ] Verify /api/csp-report endpoint working
- [ ] Check console for violations
- [ ] Monitor server logs

### Phase 2: Collect Violations (Days 1-3)
- [ ] Browse all pages
- [ ] Use all features
- [ ] Check browser console
- [ ] Check server logs
- [ ] Create violation report

### Phase 3: Add Required Hosts (Days 3-5)
- [ ] Identify required hosts
- [ ] Update middleware.ts
- [ ] Deploy changes
- [ ] Test again
- [ ] Repeat until 0 violations

### Phase 4: Remove 'unsafe-inline' (Days 5-7)
- [ ] Audit inline styles
- [ ] Extract to CSS files
- [ ] Audit inline scripts
- [ ] Extract to external files
- [ ] Update CSP
- [ ] Deploy and test

### Phase 5: Monitor 1 Week (Days 7-14)
- [ ] Daily: Check for violations
- [ ] Daily: Browse site
- [ ] Daily: Check console
- [ ] Daily: Run Lighthouse
- [ ] Achieve: 0 violations for 7 days

### Phase 6: Switch to Enforcement (Day 14)
- [ ] Verify no violations
- [ ] Update middleware to enforcement
- [ ] Deploy to production
- [ ] Monitor first 24 hours
- [ ] Verify no issues

### Phase 7: Continuous Monitoring (Ongoing)
- [ ] Weekly: Check violations
- [ ] Weekly: Monitor logs
- [ ] Monthly: Review policy
- [ ] Quarterly: Full audit

---

## 🚨 Common Issues & Solutions

### Issue 1: Too Many Violations
```
Problem: 100+ violations per day
Cause: CSP too restrictive
Solution: Add more hosts to CSP
Timeline: May take several iterations
```

### Issue 2: Analytics Not Working
```
Problem: Google Analytics blocked
Cause: googletagmanager.com not in CSP
Solution: Add to script-src and connect-src
```

### Issue 3: Fonts Not Loading
```
Problem: Fonts not displaying
Cause: fonts.googleapis.com or fonts.gstatic.com not in CSP
Solution: Add to style-src and font-src
```

### Issue 4: Inline Scripts Still Blocked
```
Problem: Inline scripts blocked after removing 'unsafe-inline'
Cause: Inline scripts still in code
Solution: Move all inline scripts to external files
```

### Issue 5: Third-Party Widget Broken
```
Problem: Widget not loading
Cause: Widget host not in CSP
Solution: Add widget host to appropriate directives
```

---

## ⏱️ Timeline Summary

```
Day 1:      Deploy Report-Only CSP
Days 1-3:   Collect violations
Days 3-5:   Add required hosts
Days 5-7:   Remove 'unsafe-inline'
Days 7-14:  Monitor for 1 week
Day 14:     Switch to enforcement
Day 14+:    Continuous monitoring
```

**Total time to enforcement: 2 weeks**

---

## 📝 Quick Reference

### CSP Directives:
```
default-src:    Default for all content
script-src:     JavaScript sources
style-src:      CSS sources
font-src:       Font sources
img-src:        Image sources
connect-src:    API/WebSocket sources
frame-src:      Iframe sources
object-src:     Plugin sources
```

### Common Hosts to Add:
```
Google Analytics:    www.googletagmanager.com, www.google-analytics.com
Google Fonts:        fonts.googleapis.com, fonts.gstatic.com
CDN:                 cdn.jsdelivr.net, cdn.vercel-analytics.com
Your API:            api.trackmcp.com
```

### CSP Values:
```
'self':              Same origin only
'none':              Deny all
*:                   Allow all
https:               Allow all HTTPS
data:                Allow data: URIs
blob:                Allow blob: URIs
'unsafe-inline':     Allow inline code (not recommended)
'nonce-xyz':         Allow specific nonce
'hash-xyz':          Allow specific hash
```

---

## 🎯 Success Metrics

### Phase 1-2: Violations Documented
- ✅ All violations identified
- ✅ Patterns recognized
- ✅ Required hosts listed

### Phase 3: CSP Updated
- ✅ All required hosts added
- ✅ 0 violations for 24+ hours
- ✅ All features working

### Phase 4: 'unsafe-inline' Removed
- ✅ All inline code extracted
- ✅ 0 violations for 24+ hours
- ✅ All features working

### Phase 5: Monitoring Complete
- ✅ 0 violations for 7 days
- ✅ All features working
- ✅ No user issues

### Phase 6: Enforcement Active
- ✅ CSP enforced
- ✅ 0 violations
- ✅ No breakage
- ✅ Security improved

---

## 🚀 Next Steps

1. **Today**: Deploy Report-Only CSP
2. **Days 1-3**: Collect violations
3. **Days 3-5**: Add required hosts
4. **Days 5-7**: Remove 'unsafe-inline'
5. **Days 7-14**: Monitor
6. **Day 14**: Switch to enforcement
7. **Ongoing**: Continuous monitoring

**You can have CSP enforced in 2 weeks!** 🎯

