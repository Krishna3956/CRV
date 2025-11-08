# Crawl Optimization Audit - Quick Checklist

**Status**: ✅ READY TO EXECUTE  
**Date**: 2025-11-08  
**Goal**: Verify 200 OK (61%→80%+) and HTML share (56%→75%+)

---

## Pre-Audit Setup

- [ ] Access to server logs (Vercel or local)
- [ ] Access to Google Search Console
- [ ] curl command available
- [ ] Audit report template ready

---

## Phase 1: Redirect Cleanup Verification

### 1.1 Test Trailing Slash Redirects

```bash
# Test 1: Trailing slash should redirect to canonical
curl -I https://trackmcp.com/tool/example-tool/
# Expected: HTTP/2 301 Moved Permanently
# Location: https://trackmcp.com/tool/example-tool
✓ PASS / ✗ FAIL
```

```bash
# Test 2: Canonical URL should return 200
curl -I https://trackmcp.com/tool/example-tool
# Expected: HTTP/2 200 OK
✓ PASS / ✗ FAIL
```

### 1.2 Test apple-app-site-association

```bash
# Test 3: With trailing slash (should redirect)
curl -I https://trackmcp.com/apple-app-site-association/
# Expected: HTTP/2 301 Moved Permanently
✓ PASS / ✗ FAIL
```

```bash
# Test 4: Canonical (should return 200)
curl -I https://trackmcp.com/apple-app-site-association
# Expected: HTTP/2 200 OK
✓ PASS / ✗ FAIL
```

### 1.3 Test .well-known Path

```bash
# Test 5: With trailing slash (should redirect)
curl -I https://trackmcp.com/.well-known/apple-app-site-association/
# Expected: HTTP/2 301 Moved Permanently
✓ PASS / ✗ FAIL
```

```bash
# Test 6: Canonical (should return 200)
curl -I https://trackmcp.com/.well-known/apple-app-site-association
# Expected: HTTP/2 200 OK
✓ PASS / ✗ FAIL
```

### 1.4 Verify No 302 Redirects

```bash
# Test 7: Check for 302s in logs
grep " 302 " /var/log/nginx/access.log | wc -l
# Expected: 0
✓ PASS (0 found) / ✗ FAIL (found some)
```

### 1.5 Verify Sitemap URLs

```bash
# Test 8: Check sitemap consistency
curl https://trackmcp.com/sitemap.xml | grep "tool/" | head -5
# Expected: /tool/example-tool (no trailing slash)
✓ PASS / ✗ FAIL
```

### 1.6 Test HTML Pages Return 200

```bash
# Test 9: Home page
curl -I https://trackmcp.com/
# Expected: HTTP/2 200 OK
✓ PASS / ✗ FAIL
```

```bash
# Test 10: Category page
curl -I https://trackmcp.com/category/ai-ml
# Expected: HTTP/2 200 OK
✓ PASS / ✗ FAIL
```

```bash
# Test 11: Tool page
curl -I https://trackmcp.com/tool/example-tool
# Expected: HTTP/2 200 OK
✓ PASS / ✗ FAIL
```

---

## Phase 2: File Type Blocking Verification

### 2.1 Verify robots.txt Blocks Files

```bash
# Test 12: Check robots.txt exists
curl https://trackmcp.com/robots.txt | head -5
# Expected: User-agent: * with Disallow rules
✓ PASS / ✗ FAIL
```

```bash
# Test 13: Count blocked file types
curl https://trackmcp.com/robots.txt | grep "Disallow:" | wc -l
# Expected: 80+
✓ PASS / ✗ FAIL
```

```bash
# Test 14: Verify PDF blocked
curl https://trackmcp.com/robots.txt | grep "\.pdf"
# Expected: /*.pdf$ in disallow list
✓ PASS / ✗ FAIL
```

```bash
# Test 15: Verify JSON blocked
curl https://trackmcp.com/robots.txt | grep "\.json"
# Expected: /*.json$ in disallow list
✓ PASS / ✗ FAIL
```

### 2.2 Verify Noindex Headers

```bash
# Test 16: PDF noindex header
curl -I https://trackmcp.com/example.pdf
# Expected: X-Robots-Tag: noindex, nofollow
✓ PASS / ✗ FAIL
```

```bash
# Test 17: JSON noindex header
curl -I https://trackmcp.com/config.json
# Expected: X-Robots-Tag: noindex, nofollow
✓ PASS / ✗ FAIL
```

```bash
# Test 18: XML noindex header
curl -I https://trackmcp.com/feed.xml
# Expected: X-Robots-Tag: noindex, nofollow
✓ PASS / ✗ FAIL
```

```bash
# Test 19: API noindex header
curl -I https://trackmcp.com/api/tools
# Expected: X-Robots-Tag: noindex, nofollow
✓ PASS / ✗ FAIL
```

```bash
# Test 20: Source map noindex header
curl -I https://trackmcp.com/app.js.map
# Expected: X-Robots-Tag: noindex, nofollow
✓ PASS / ✗ FAIL
```

### 2.3 Verify HTML Pages NOT Blocked

```bash
# Test 21: Home page should NOT have noindex
curl -I https://trackmcp.com/
# Expected: NO X-Robots-Tag: noindex
✓ PASS / ✗ FAIL
```

```bash
# Test 22: Tool page should NOT have noindex
curl -I https://trackmcp.com/tool/example-tool
# Expected: NO X-Robots-Tag: noindex
✓ PASS / ✗ FAIL
```

```bash
# Test 23: Category page should NOT have noindex
curl -I https://trackmcp.com/category/ai-ml
# Expected: NO X-Robots-Tag: noindex
✓ PASS / ✗ FAIL
```

### 2.4 Verify Cache Headers

```bash
# Test 24: PDF cache header (1 day)
curl -I https://trackmcp.com/example.pdf | grep "Cache-Control"
# Expected: max-age=86400
✓ PASS / ✗ FAIL
```

```bash
# Test 25: JSON cache header (1 hour)
curl -I https://trackmcp.com/config.json | grep "Cache-Control"
# Expected: max-age=3600
✓ PASS / ✗ FAIL
```

```bash
# Test 26: Source map cache header (1 year)
curl -I https://trackmcp.com/app.js.map | grep "Cache-Control"
# Expected: max-age=31536000
✓ PASS / ✗ FAIL
```

---

## Phase 3: Server Log Analysis

### 3.1 Response Code Distribution

```bash
# Test 27: Calculate 200 OK percentage
TOTAL=$(grep -E ' [0-9]{3} ' /var/log/nginx/access.log | wc -l)
OK=$(grep ' 200 ' /var/log/nginx/access.log | wc -l)
PERCENT=$((OK * 100 / TOTAL))
echo "200 OK: $PERCENT%"
# Expected: 80%+ (currently 61%)
✓ PASS (80%+) / ✗ FAIL (<80%)
```

```bash
# Test 28: Count 301 redirects
grep ' 301 ' /var/log/nginx/access.log | wc -l
# Expected: Some (but not excessive)
✓ PASS / ✗ FAIL
```

```bash
# Test 29: Count 404 errors
grep ' 404 ' /var/log/nginx/access.log | wc -l
# Expected: Low (should be decreasing)
✓ PASS / ✗ FAIL
```

### 3.2 File Type Distribution

```bash
# Test 30: Calculate HTML percentage
TOTAL=$(grep -E '\.(html|json|pdf|xml|js|css)' /var/log/nginx/access.log | wc -l)
HTML=$(grep -E '\.(html|php)' /var/log/nginx/access.log | wc -l)
PERCENT=$((HTML * 100 / TOTAL))
echo "HTML: $PERCENT%"
# Expected: 75%+ (currently 56%)
✓ PASS (75%+) / ✗ FAIL (<75%)
```

```bash
# Test 31: Count JSON crawls
grep '\.json' /var/log/nginx/access.log | wc -l
# Expected: Low or 0
✓ PASS / ✗ FAIL
```

```bash
# Test 32: Count PDF crawls
grep '\.pdf' /var/log/nginx/access.log | wc -l
# Expected: Low or 0
✓ PASS / ✗ FAIL
```

```bash
# Test 33: Count API crawls
grep '/api/' /var/log/nginx/access.log | wc -l
# Expected: Low or 0
✓ PASS / ✗ FAIL
```

### 3.3 Crawler Activity

```bash
# Test 34: Googlebot requests
grep 'Googlebot' /var/log/nginx/access.log | wc -l
# Expected: High (3000+)
✓ PASS / ✗ FAIL
```

```bash
# Test 35: Bad bot activity
grep -E 'MJ12bot|AhrefsBot|SemrushBot' /var/log/nginx/access.log | wc -l
# Expected: 0
✓ PASS (0) / ✗ FAIL (found some)
```

---

## Phase 4: Google Search Console Verification

### 4.1 Coverage Report

- [ ] Go to Google Search Console
- [ ] Select property
- [ ] Go to Coverage
- [ ] Verify:
  - [ ] Indexed pages: Increasing
  - [ ] Excluded pages: Shows blocked file types
  - [ ] 404 errors: Decreasing
  - [ ] No "Blocked by robots.txt" for HTML pages

### 4.2 Crawl Stats

- [ ] Go to Settings → Crawl Stats
- [ ] Verify:
  - [ ] Requests per day: Decreasing
  - [ ] Kilobytes downloaded: Decreasing
  - [ ] Response time: Stable

### 4.3 URL Inspection

- [ ] Test `/tool/example-tool` → 200 OK
- [ ] Test `/category/ai-ml` → 200 OK
- [ ] Test `/` → 200 OK
- [ ] Test `/tool/example-tool/` → 301 redirect
- [ ] Test `/example.pdf` → Noindex
- [ ] Test `/api/tools` → Noindex

---

## Audit Results Summary

### Redirect Cleanup
- Tests Passed: ___/11
- Status: ✓ PASS / ✗ FAIL

### File Type Blocking
- Tests Passed: ___/15
- Status: ✓ PASS / ✗ FAIL

### Server Log Analysis
- Tests Passed: ___/7
- Status: ✓ PASS / ✗ FAIL

### Google Search Console
- Checks Completed: ___/3
- Status: ✓ PASS / ✗ FAIL

### Overall Score
- Total Tests: 36
- Passed: ___
- Failed: ___
- **Pass Rate**: ___%

---

## Issues Found

### Critical Issues (Must Fix)
1. ___________________________
2. ___________________________
3. ___________________________

### Warning Issues (Should Fix)
1. ___________________________
2. ___________________________
3. ___________________________

### Info Issues (Nice to Have)
1. ___________________________
2. ___________________________
3. ___________________________

---

## Action Items

### Immediate (This Week)
- [ ] ___________________________
- [ ] ___________________________
- [ ] ___________________________

### Short-term (This Month)
- [ ] ___________________________
- [ ] ___________________________
- [ ] ___________________________

### Long-term (This Quarter)
- [ ] ___________________________
- [ ] ___________________________
- [ ] ___________________________

---

## Baseline Metrics (Before Optimization)

**Date**: _______________

| Metric | Before | Target | After |
|--------|--------|--------|-------|
| 200 OK % | 61% | 80%+ | __% |
| HTML Share % | 56% | 75%+ | __% |
| 302 Redirects | ? | 0 | __ |
| 404 Errors | ? | Low | __ |
| Crawl Budget Waste | ~40% | <20% | __% |

---

## Sign-Off

**Audit Conducted By**: _______________  
**Date**: _______________  
**Status**: ✓ PASS / ✗ FAIL  

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

---

**Status**: ✅ READY TO USE

**Last Updated**: 2025-11-08
