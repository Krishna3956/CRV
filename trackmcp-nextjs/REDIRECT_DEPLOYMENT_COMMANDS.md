# 302 to 301 Redirect Optimization - Deployment Commands

## Quick Command Reference

### Local Testing

```bash
# 1. Build the project
npm run build

# 2. Start development server
npm run start

# 3. Test trailing slash redirect (in another terminal)
curl -I http://localhost:3000/tool/example-tool/

# Expected output:
# HTTP/1.1 301 Moved Permanently
# location: http://localhost:3000/tool/example-tool

# 4. Test root URL
curl -I http://localhost:3000/

# Expected output:
# HTTP/1.1 200 OK

# 5. Test middleware active
curl -I http://localhost:3000/test-path/

# Expected output:
# HTTP/1.1 301 Moved Permanently
# location: http://localhost:3000/test-path
```

---

## Deployment Steps

### Step 1: Verify Changes

```bash
# Check git status
git status

# Should show these files modified:
# - src/middleware.ts (NEW)
# - next.config.js (MODIFIED)
# - vercel.json (MODIFIED)
# - src/app/sitemap.ts (MODIFIED)
```

### Step 2: Review Changes

```bash
# View middleware changes
git diff src/middleware.ts

# View next.config.js changes
git diff next.config.js

# View vercel.json changes
git diff vercel.json

# View sitemap.ts changes
git diff src/app/sitemap.ts
```

### Step 3: Stage Changes

```bash
# Add all modified files
git add src/middleware.ts next.config.js vercel.json src/app/sitemap.ts

# Verify staged changes
git status
```

### Step 4: Commit Changes

```bash
# Commit with descriptive message
git commit -m "fix: convert 302 redirects to 301 permanent redirects for SEO optimization

- Add middleware for URL normalization at edge
- Update next.config.js to ensure all redirects use permanent: true (301)
- Update vercel.json with permanent redirects and cache headers
- Fix sitemap.ts to use consistent URL encoding

This prevents crawl budget waste and improves indexing speed."
```

### Step 5: Push to GitHub

```bash
# Push to main branch
git push origin main

# Or push to a feature branch for review
git push origin feature/redirect-optimization
```

### Step 6: Monitor Vercel Deployment

```bash
# Option 1: Check Vercel dashboard
# Go to: https://vercel.com/dashboard

# Option 2: Monitor via CLI
vercel logs

# Option 3: Check deployment status
curl -I https://trackmcp.com/
```

---

## Production Verification

### Immediate Checks (After Deployment)

```bash
# 1. Test trailing slash redirect
curl -I https://trackmcp.com/tool/example-tool/

# Expected:
# HTTP/2 301
# location: https://trackmcp.com/tool/example-tool

# 2. Test direct URL (no redirect)
curl -I https://trackmcp.com/tool/example-tool

# Expected:
# HTTP/2 200

# 3. Test root URL
curl -I https://trackmcp.com/

# Expected:
# HTTP/2 200

# 4. Check for redirect chains
curl -L -I https://trackmcp.com/tool/example-tool/

# Expected:
# HTTP/2 301 (first response)
# HTTP/2 200 (final response)
# Should only show 2 responses, not more
```

### Detailed Verification

```bash
# 1. Get full response headers
curl -v https://trackmcp.com/tool/example-tool/

# Look for:
# - HTTP/2 301 status
# - location header pointing to correct URL
# - cache-control header

# 2. Check middleware is active
curl -I -H "x-middleware-preflight: 1" https://trackmcp.com/

# Should return 200 OK (middleware is active)

# 3. Test multiple tool URLs
for tool in "example-tool" "another-tool" "test-mcp"; do
  echo "Testing /tool/$tool/"
  curl -I "https://trackmcp.com/tool/$tool/" | grep -E "HTTP|location"
done
```

---

## Monitoring Commands

### Check Vercel Logs

```bash
# View recent deployments
vercel list

# View specific deployment logs
vercel logs <deployment-url>

# Monitor real-time logs
vercel logs --follow
```

### Check Server Logs

```bash
# View 302 redirects (should be none)
grep "302" /var/log/nginx/access.log | wc -l

# View 301 redirects (should see these)
grep "301" /var/log/nginx/access.log | wc -l

# View redirect patterns
grep "301\|302" /var/log/nginx/access.log | tail -20
```

### Monitor Crawl Errors

```bash
# Check Google Search Console API
# (Requires authentication setup)

# Or manually check:
# 1. Go to Google Search Console
# 2. Coverage report
# 3. Look for "Redirect errors" - should be 0
# 4. Check "Crawl stats" - should be stable
```

---

## Rollback Commands

### If Critical Issues Occur

```bash
# 1. Revert last commit
git revert HEAD

# 2. Push to GitHub
git push origin main

# 3. Vercel will auto-deploy previous version
# Typically completes in 2-5 minutes

# 4. Verify rollback
curl -I https://trackmcp.com/tool/example-tool/
# Should return 200 OK (no redirect)
```

### Alternative Rollback

```bash
# 1. Reset to previous commit
git reset --hard HEAD~1

# 2. Force push to GitHub
git push -f origin main

# 3. Vercel will auto-deploy
```

---

## Troubleshooting Commands

### Issue: Still Seeing 302 Redirects

```bash
# 1. Clear browser cache
# Cmd+Shift+Delete (or Ctrl+Shift+Delete on Windows/Linux)

# 2. Hard refresh browser
# Cmd+Shift+R (or Ctrl+Shift+R on Windows/Linux)

# 3. Check middleware deployed
curl -I -H "x-middleware-preflight: 1" https://trackmcp.com/

# 4. Check Vercel deployment
vercel list

# 5. Check if middleware.ts exists in deployment
curl -I https://trackmcp.com/_next/static/middleware.js
```

### Issue: Redirect Chains

```bash
# 1. Test for redirect chains
curl -L -v https://trackmcp.com/tool/example-tool/

# 2. Count redirects
curl -L -I https://trackmcp.com/tool/example-tool/ | grep -c "HTTP"

# Should be 2 (one 301, one 200)
# If more than 2, there's a redirect chain

# 3. Check middleware logic
cat src/middleware.ts

# 4. Check next.config.js redirects
cat next.config.js | grep -A 20 "async redirects"
```

### Issue: 404 Errors

```bash
# 1. Check if tool exists in database
# (Requires database access)

# 2. Test URL encoding
curl -I "https://trackmcp.com/tool/MCP-Example"
curl -I "https://trackmcp.com/tool/mcp-example"

# 3. Check sitemap
curl https://trackmcp.com/sitemap.xml | grep "tool/"

# 4. Check Vercel logs
vercel logs
```

---

## Verification Checklist

### ✅ Pre-Deployment

```bash
# 1. Build succeeds
npm run build
# Should complete without errors

# 2. No TypeScript errors
npm run build 2>&1 | grep -i "error"
# Should show no errors

# 3. Middleware syntax correct
npx tsc --noEmit src/middleware.ts
# Should complete without errors

# 4. Local tests pass
npm run start &
sleep 5
curl -I http://localhost:3000/tool/example/
# Should return 301
kill %1
```

### ✅ Post-Deployment

```bash
# 1. Deployment succeeded
vercel list | head -1
# Should show recent deployment

# 2. No 502/503 errors
curl -I https://trackmcp.com/
# Should return 200 OK

# 3. Redirects work
curl -I https://trackmcp.com/tool/example/
# Should return 301

# 4. No redirect chains
curl -L -I https://trackmcp.com/tool/example/ | wc -l
# Should be 2 or 3 lines (not more)
```

---

## Automated Testing Script

```bash
#!/bin/bash

echo "=== Redirect Optimization Verification ==="
echo ""

# Test 1: Trailing slash redirect
echo "Test 1: Trailing slash redirect"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://trackmcp.com/tool/example-tool/)
if [ "$RESPONSE" = "301" ]; then
  echo "✅ PASS: Returns 301"
else
  echo "❌ FAIL: Returns $RESPONSE (expected 301)"
fi
echo ""

# Test 2: Direct URL (no redirect)
echo "Test 2: Direct URL (no redirect)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://trackmcp.com/tool/example-tool)
if [ "$RESPONSE" = "200" ]; then
  echo "✅ PASS: Returns 200"
else
  echo "❌ FAIL: Returns $RESPONSE (expected 200)"
fi
echo ""

# Test 3: No redirect chains
echo "Test 3: No redirect chains"
COUNT=$(curl -s -L -I https://trackmcp.com/tool/example-tool/ | grep -c "HTTP")
if [ "$COUNT" -le "2" ]; then
  echo "✅ PASS: No redirect chains ($COUNT responses)"
else
  echo "❌ FAIL: Redirect chain detected ($COUNT responses)"
fi
echo ""

# Test 4: Middleware active
echo "Test 4: Middleware active"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "x-middleware-preflight: 1" https://trackmcp.com/)
if [ "$RESPONSE" = "200" ]; then
  echo "✅ PASS: Middleware active"
else
  echo "❌ FAIL: Middleware not responding ($RESPONSE)"
fi
echo ""

echo "=== Verification Complete ==="
```

---

## Continuous Monitoring

### Daily Checks

```bash
# 1. Check for 302 redirects
curl -s https://trackmcp.com/tool/example-tool/ -w "\nStatus: %{http_code}\n"

# 2. Check Vercel status
vercel status

# 3. Check error rate
vercel logs | grep -i "error" | wc -l
```

### Weekly Checks

```bash
# 1. Check Google Search Console
# Go to: https://search.google.com/search-console

# 2. Check crawl errors
# Coverage report → Redirect errors (should be 0)

# 3. Check crawl stats
# Settings → Crawl stats (should be stable or decreasing)
```

### Monthly Checks

```bash
# 1. Analyze crawl budget trends
# Check if crawl budget usage decreased

# 2. Check indexing speed
# Monitor how quickly new pages are indexed

# 3. Check rankings
# Monitor if rankings improved or remained stable
```

---

## Emergency Contacts

### If Issues Occur

1. **Check Vercel Dashboard**: https://vercel.com/dashboard
2. **Check Google Search Console**: https://search.google.com/search-console
3. **Check Server Logs**: Contact hosting provider
4. **Rollback**: Use rollback commands above

---

## Summary

### Deployment
```bash
git add src/middleware.ts next.config.js vercel.json src/app/sitemap.ts
git commit -m "fix: convert 302 redirects to 301 permanent redirects"
git push origin main
```

### Verification
```bash
curl -I https://trackmcp.com/tool/example-tool/
# Should return: HTTP/2 301
```

### Monitoring
```bash
vercel logs
# Check for any errors
```

---

**Status**: Ready for deployment ✅
**Last Updated**: 2025-11-08
