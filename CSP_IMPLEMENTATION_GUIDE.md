# Content Security Policy (CSP) Implementation Guide

## ✅ Implementation Complete

### Files Created:
1. **`middleware.ts`** - CSP middleware with report-only mode
2. **`src/app/api/csp-report/route.ts`** - CSP violation reporting endpoint

---

## 📋 CSP Configuration

### Current Mode: **Report-Only** (Monitoring Phase)
- Duration: 7-14 days
- Header: `Content-Security-Policy-Report-Only`
- Violations logged but NOT blocked

### CSP Directives:
```
default-src 'self'
script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' https://cdn.jsdelivr.net https://cdn.vercel-analytics.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https: blob:
media-src 'self' https:
connect-src 'self' https: http://localhost:3000 http://localhost:3004
frame-src 'self' https:
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
report-uri /api/csp-report
```

### Additional Security Headers:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: Disabled dangerous APIs`
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 🔍 Monitoring CSP Violations

### CSP Report Endpoint: `/api/csp-report`
- **Method**: POST
- **Content-Type**: application/json
- **Response**: 204 No Content

### Logged Information:
- Document URI
- Violated directive
- Blocked URI
- Source file and line number
- Status code
- Timestamp

### Console Output:
```
🚨 CSP Violation Report: {
  timestamp: "2025-11-16T01:35:00.000Z",
  documentUri: "https://www.trackmcp.com/",
  violatedDirective: "script-src",
  blockedUri: "https://example.com/script.js",
  sourceFile: "https://www.trackmcp.com/page.html",
  lineNumber: 42,
  columnNumber: 10,
  disposition: "report"
}
```

---

## 📊 Monitoring Phase Timeline

### Week 1-2: Observation
1. ✅ Deploy middleware with Report-Only mode
2. ✅ Monitor CSP violations in console logs
3. ✅ Identify false positives and legitimate resources
4. ✅ Document all violations

### Week 2-3: Adjustment
1. Add legitimate sources to CSP directives
2. Remove overly restrictive rules
3. Test with real user traffic
4. Verify no critical functionality breaks

### Week 3+: Enforcement
1. Switch to enforced `Content-Security-Policy` header
2. Remove `'unsafe-inline'` from style-src
3. Remove `'wasm-unsafe-eval'` if not needed
4. Monitor for user-reported issues

### Final: HSTS Preload
1. Ensure all subdomains serve HTTPS
2. Test thoroughly with HSTS preload
3. Submit to HSTS preload list
4. Enable `preload` directive in HSTS header

---

## 🔧 Integration with Monitoring Services

### Option 1: Sentry
```typescript
// In /api/csp-report/route.ts
import * as Sentry from "@sentry/nextjs";

await Sentry.captureMessage('CSP Violation', {
  level: 'warning',
  contexts: { csp: report },
});
```

### Option 2: DataDog
```typescript
await fetch('https://http-intake.logs.datadoghq.com/v1/input/{YOUR_DD_API_KEY}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ csp_report: report }),
});
```

### Option 3: Custom Logging
```typescript
await fetch('https://your-api.com/logs/csp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(report),
});
```

---

## ✅ Checklist

### Before Deployment:
- [ ] Review CSP directives for your use case
- [ ] Test with Report-Only mode in staging
- [ ] Verify no console CSP warnings
- [ ] Check extension compatibility

### During Monitoring (7-14 days):
- [ ] Monitor `/api/csp-report` endpoint
- [ ] Review console logs for violations
- [ ] Document all violations
- [ ] Identify legitimate resources
- [ ] Plan adjustments

### Before Enforcement:
- [ ] Update CSP with legitimate sources
- [ ] Remove overly restrictive rules
- [ ] Test all features thoroughly
- [ ] Prepare rollback plan

### After Enforcement:
- [ ] Monitor for user issues
- [ ] Keep report endpoint active
- [ ] Plan HSTS preload submission
- [ ] Document final CSP policy

---

## 📝 Notes

- **Report-Only Mode**: Violations are logged but NOT blocked
- **Localhost**: Allowed for development (3000, 3004)
- **HSTS**: Currently set to 1 year, ready for preload after testing
- **Permissions-Policy**: Blocks geolocation, microphone, camera, payment, USB, sensors
- **Upgrade Insecure Requests**: Automatically upgrades HTTP to HTTPS

---

## 🚀 Next Steps

1. **Deploy middleware.ts** to production
2. **Monitor CSP reports** for 7-14 days
3. **Collect violation data** and analyze
4. **Adjust CSP rules** based on findings
5. **Switch to enforced mode** when stable
6. **Plan HSTS preload** submission

