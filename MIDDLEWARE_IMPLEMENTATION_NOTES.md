# Middleware Implementation Notes

## 🎯 Critical Considerations for Track MCP

This document outlines important implementation details and gotchas for the security headers middleware.

---

## 1. HSTS Preload - DO NOT ADD YET

### Current Configuration:
```typescript
// ✅ SAFE (no preload)
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

### Why NO Preload During Tuning Phase:
```
Preload is PERMANENT:
- Once added to HSTS preload list, very hard to remove
- Removal takes 6+ months minimum
- Can break your site if not ready
- Requires perfect HTTPS setup on ALL subdomains
```

### Preload Requirements (Before Adding):
```
✅ HTTPS everywhere (all subdomains)
✅ No HTTP redirects on any subdomain
✅ Valid SSL certificates on all subdomains
✅ HSTS header working for 1+ month without issues
✅ No user-reported HTTPS problems
✅ Thoroughly tested in staging
✅ Thoroughly tested in production (1-3 months)
```

### Timeline for Preload:
```
Week 1-4:   Deploy without preload (tuning phase)
Week 4-8:   Monitor for issues, verify all subdomains HTTPS
Week 8-12:  Plan preload submission
Week 12+:   Add preload directive and submit
Week 12-14: Wait for inclusion in preload list
```

### How to Add Preload Later:
```typescript
// Step 1: Verify all requirements met
// Step 2: Update middleware.ts
response.headers.append(
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains; preload'
)

// Step 3: Deploy to production
// Step 4: Submit to https://hstspreload.org/
// Step 5: Wait for inclusion (1-2 months)
```

### Checklist Before Adding Preload:
- [ ] All subdomains verified HTTPS
- [ ] No HTTP redirects on any subdomain
- [ ] SSL certificates valid on all subdomains
- [ ] HSTS header working 1+ month without issues
- [ ] No user-reported HTTPS problems
- [ ] Tested in staging thoroughly
- [ ] Tested in production 1-3 months
- [ ] Security team approval
- [ ] Rollback plan documented

---

## 2. 'unsafe-inline' for Styles - PLAN TO REMOVE

### Current Configuration:
```
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

### Why It's There:
```
'unsafe-inline' allows inline styles:
<div style="color: red;">Text</div>

This prevents immediate breakage during deployment.
But it weakens security (allows CSS injection attacks).
```

### Plan to Remove 'unsafe-inline':

#### Phase 1: Audit (Week 1-2)
```bash
# Find all inline styles
grep -r "style=" src/

# Document findings
# Create list of all inline styles
```

#### Phase 2: Extract (Week 2-4)
```html
<!-- ❌ BEFORE (inline) -->
<div style="color: red; font-size: 16px;">Text</div>

<!-- ✅ AFTER (CSS file) -->
<!-- styles.css -->
.text-red {
  color: red;
  font-size: 16px;
}

<!-- In component -->
<div class="text-red">Text</div>
```

#### Phase 3: Remove (Week 4)
```typescript
// Update middleware.ts
// BEFORE:
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com

// AFTER:
style-src 'self' https://fonts.googleapis.com
```

#### Phase 4: Test (Week 4-5)
```bash
# Deploy changes
# Monitor for CSP violations
# Check /api/csp-report
# Run Lighthouse
# Test in all browsers
```

### Gradual Removal Timeline:
```
Week 1-2:   Monitor violations in Report-Only mode
Week 2-3:   Fix violations, move inline code
Week 3-4:   Remove 'unsafe-inline' from styles
Week 4-5:   Remove 'unsafe-inline' from scripts
Week 5+:    Remove 'wasm-unsafe-eval' if not needed
```

### Checklist for Removing 'unsafe-inline':
- [ ] Audit all inline styles
- [ ] Create list of all inline styles
- [ ] Extract styles to CSS files
- [ ] Update components to use CSS classes
- [ ] Test in staging
- [ ] Monitor CSP violations
- [ ] Remove 'unsafe-inline' from CSP
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Verify no breakage

---

## 3. 'unsafe-inline' for Scripts - PLAN TO REMOVE

### Current Configuration:
```
script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' ... 'unsafe-inline'
```

### Why It's There:
```
'unsafe-inline' allows inline scripts:
<script>
  const apiUrl = 'https://api.trackmcp.com'
</script>

This prevents immediate breakage during deployment.
But it weakens security (allows JavaScript injection attacks).
```

### Two Approaches to Remove:

#### Approach 1: Move to External Files (Simpler)
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

**Pros:**
- Simple to implement
- No complex nonce generation
- Works in all browsers

**Cons:**
- Requires moving all inline scripts

#### Approach 2: Use Nonce (More Complex)
```typescript
// middleware.ts - Generate nonce
import crypto from 'crypto'

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('hex')
  
  const cspHeader = `
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
  `
  
  response.headers.append('Content-Security-Policy', cspHeader)
  response.headers.append('X-Nonce', nonce)
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

**Pros:**
- Allows inline scripts/styles
- More secure than 'unsafe-inline'
- Modern approach

**Cons:**
- Complex to implement
- Requires nonce per request
- Requires server-side rendering integration
- More error-prone

### Recommendation:
```
For Track MCP: Use Approach 1 (Move to External Files)
- Simpler to implement
- No complex nonce generation
- Cleaner code organization
- Better for performance (external files can be cached)
```

### Plan to Remove 'unsafe-inline' (Scripts):

#### Phase 1: Audit (Week 1-2)
```bash
# Find all inline scripts
grep -r "<script>" src/ | grep -v "src="

# Document findings
# Create list of all inline scripts
```

#### Phase 2: Extract (Week 2-4)
```javascript
// Move each inline script to external file
// Update imports
// Test functionality
```

#### Phase 3: Remove (Week 4)
```typescript
// Update middleware.ts
// BEFORE:
script-src 'self' 'wasm-unsafe-eval' ... 'unsafe-inline'

// AFTER:
script-src 'self' 'wasm-unsafe-eval' ...
```

#### Phase 4: Test (Week 4-5)
```bash
# Deploy changes
# Monitor for CSP violations
# Check /api/csp-report
# Run Lighthouse
# Test in all browsers
```

### Checklist for Removing 'unsafe-inline' (Scripts):
- [ ] Audit all inline scripts
- [ ] Create list of all inline scripts
- [ ] Extract scripts to external files
- [ ] Update imports
- [ ] Test functionality
- [ ] Monitor CSP violations
- [ ] Remove 'unsafe-inline' from CSP
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Verify no breakage

---

## 4. Nonce Implementation (If Needed)

### When to Use Nonce:
```
Use nonce if:
- You have inline scripts that can't be moved
- You have inline styles that can't be moved
- You need to allow specific inline code

Don't use nonce if:
- You can move all inline code to external files
- You want simpler implementation
- You want better performance
```

### Nonce Implementation Steps:

#### Step 1: Generate Nonce in Middleware
```typescript
// middleware.ts
import crypto from 'crypto'

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('hex')
  const response = NextResponse.next()
  
  // Pass nonce to response headers
  response.headers.set('X-Nonce', nonce)
  
  // Use nonce in CSP
  const cspHeader = `
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
  `
  
  response.headers.append('Content-Security-Policy', cspHeader)
  
  return response
}
```

#### Step 2: Pass Nonce to Server Rendering
```typescript
// app/layout.tsx or similar
import { headers } from 'next/headers'

export default function RootLayout({ children }) {
  const nonce = headers().get('X-Nonce')
  
  return (
    <html>
      <head>
        <script nonce={nonce}>
          // Inline script here
        </script>
        <style nonce={nonce}>
          /* Inline styles here */
        </style>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

#### Step 3: Add Nonce to Inline Code
```html
<!-- In HTML -->
<script nonce="<%= nonce %>">
  const apiUrl = 'https://api.trackmcp.com'
</script>

<style nonce="<%= nonce %>">
  body { color: red; }
</style>
```

#### Step 4: Update CSP
```typescript
// Remove 'unsafe-inline', use nonce instead
// BEFORE:
script-src 'self' 'unsafe-inline'

// AFTER:
script-src 'self' 'nonce-${nonce}'
```

### Nonce Gotchas:
```
1. Nonce must be unique per request
2. Nonce must be passed to server rendering
3. Nonce must be added to every inline script/style
4. Nonce changes on every page load
5. Can't cache pages with nonces
6. More complex than moving to external files
```

### Recommendation:
```
For Track MCP: DON'T use nonce
- Move all inline code to external files instead
- Simpler implementation
- Better performance (caching)
- Cleaner code
```

---

## 5. Gradual Hardening Timeline

### Week 1-2: Monitoring Phase
```
✅ Deploy middleware with all headers
✅ CSP in Report-Only mode
✅ Monitor /api/csp-report for violations
✅ Use online tools (Security Headers, Mozilla Observatory)
✅ Run Lighthouse
✅ Document all violations
```

### Week 2-3: Fix Violations
```
✅ Move inline scripts to external files
✅ Move inline styles to CSS files
✅ Add third-party hosts to CSP
✅ Update analytics configuration
✅ Test each fix
✅ Verify 0 violations for 3+ days
```

### Week 3: Enforce CSP
```
✅ Switch from Report-Only to enforced CSP
✅ Deploy to production
✅ Monitor for 24 hours
✅ Check error logs
✅ Verify no user issues
```

### Week 3-4: Remove 'unsafe-inline' from Styles
```
✅ Audit all inline styles
✅ Extract to CSS files
✅ Update CSP
✅ Deploy and test
✅ Monitor for issues
```

### Week 4-5: Remove 'unsafe-inline' from Scripts
```
✅ Audit all inline scripts
✅ Extract to external files
✅ Update CSP
✅ Deploy and test
✅ Monitor for issues
```

### Week 5+: Remove 'wasm-unsafe-eval' if Not Needed
```
✅ Check if WebAssembly is used
✅ Check if eval() is used
✅ If not needed, remove from CSP
✅ Deploy and test
✅ Monitor for issues
```

### Week 8-12: Plan HSTS Preload
```
✅ Verify all subdomains are HTTPS
✅ Verify no HTTP redirects
✅ Verify SSL certificates
✅ Verify HSTS working 1+ month
✅ Plan preload submission
```

### Week 12+: Add HSTS Preload
```
✅ Add preload directive to middleware
✅ Deploy to production
✅ Submit to https://hstspreload.org/
✅ Wait for inclusion (1-2 months)
✅ Monitor preload status
```

---

## 6. Monitoring & Verification

### Daily Checks:
```bash
# Check headers
curl -I https://www.trackmcp.com | grep -E "Strict-Transport|X-Content|X-Frame|X-XSS|Referrer|Permissions|Content-Security"

# Check CSP violations
# Monitor /api/csp-report endpoint
# Check application logs
```

### Weekly Checks:
```bash
# Full security scan
# https://securityheaders.com/

# Mozilla Observatory
# https://observatory.mozilla.org/

# Lighthouse
# Chrome DevTools → Lighthouse → Security

# Multi-browser testing
# Chrome, Firefox, Safari, Edge
```

### Before Each Phase:
```bash
# Test in staging
# Run all security tools
# Review changes
# Get approval
# Deploy to production
```

---

## 7. Rollback Plan

### If Issues Occur:
```
Minor (CSP violations):
1. Investigate violation
2. Fix in code
3. Update CSP
4. Re-deploy
5. Monitor

Major (Site broken):
1. Revert middleware.ts
2. Deploy previous version
3. Investigate issue
4. Fix in staging
5. Test thoroughly
6. Re-deploy
```

### Rollback Command:
```bash
# Revert to previous commit
git revert <commit-hash>
git push

# Or revert specific file
git checkout <previous-commit> -- middleware.ts
git commit -m "Rollback: Revert security headers"
git push
```

---

## ✅ Implementation Checklist

### Before Deployment:
- [ ] Review all middleware comments
- [ ] Understand HSTS preload requirements
- [ ] Understand 'unsafe-inline' removal plan
- [ ] Understand nonce approach (if needed)
- [ ] Test in staging
- [ ] Have rollback plan
- [ ] Document all changes

### During Deployment:
- [ ] Deploy middleware.ts
- [ ] Verify headers present
- [ ] Monitor /api/csp-report
- [ ] Check error logs
- [ ] Run security tools
- [ ] Monitor for issues

### After Deployment:
- [ ] Monitor for 24 hours
- [ ] Check user reports
- [ ] Verify analytics working
- [ ] Verify third-party services working
- [ ] Document findings
- [ ] Plan next phase

---

## 📝 Key Takeaways

1. **HSTS Preload**: Don't add yet - wait 1-3 months of testing
2. **'unsafe-inline' Styles**: Plan to remove after 2-4 weeks
3. **'unsafe-inline' Scripts**: Plan to remove after 2-4 weeks
4. **Nonce Approach**: Only use if you can't move inline code
5. **Gradual Hardening**: Remove 'unsafe-inline' incrementally
6. **Monitoring**: Check /api/csp-report daily
7. **Testing**: Test in all browsers before each phase
8. **Rollback**: Have plan ready if issues occur

