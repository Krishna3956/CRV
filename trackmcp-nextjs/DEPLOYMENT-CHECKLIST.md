# SSR Deployment Checklist

## Pre-Deployment (Local)

- [ ] **Build locally**
  ```bash
  npm run build
  ```
  Expected: No errors, build completes successfully

- [ ] **Test locally**
  ```bash
  npm run dev
  ```
  Expected: Dev server starts on http://localhost:3004

- [ ] **Verify SSR**
  ```bash
  curl -s http://localhost:3004 | grep "Model Context Protocol"
  ```
  Expected: Output shows "3" (content appears 3 times)

- [ ] **Run verification script**
  ```bash
  chmod +x scripts/verify-ssr.sh
  ./scripts/verify-ssr.sh http://localhost:3004
  ```
  Expected: All tests pass (✓ PASS)

- [ ] **Check for TypeScript errors**
  ```bash
  npm run lint
  ```
  Expected: No errors

## Deployment (Git)

- [ ] **Commit changes**
  ```bash
  git add .
  git commit -m "Implement SSR optimization for answer engines

  - Add dynamic = 'force-dynamic' to homepage and tool pages
  - Configure ISR revalidation (1 hour for homepage, 6 hours for tools)
  - Add SSR optimization to next.config.js
  - Add comprehensive documentation and verification script"
  ```

- [ ] **Push to main branch**
  ```bash
  git push origin main
  ```

- [ ] **Monitor Vercel deployment**
  - Go to https://vercel.com/dashboard
  - Wait for build to complete
  - Check for any build errors

## Post-Deployment (Production)

### Immediate (First 1 hour)

- [ ] **Verify production homepage**
  ```bash
  curl -s https://www.trackmcp.com | head -50
  ```
  Expected: Full HTML with content, not empty `<div id="root"></div>`

- [ ] **Verify structured data**
  ```bash
  curl -s https://www.trackmcp.com | grep '"@type":"WebSite"'
  ```
  Expected: Output shows schema

- [ ] **Test with answer engine bots**
  ```bash
  curl -A "PerplexityBot" https://www.trackmcp.com | grep "Model Context Protocol"
  curl -A "ChatGPT-User" https://www.trackmcp.com | grep "Model Context Protocol"
  curl -A "Claude-Web" https://www.trackmcp.com | grep "Model Context Protocol"
  ```
  Expected: All return content

- [ ] **Check cache headers**
  ```bash
  curl -I https://www.trackmcp.com | grep "Cache-Control"
  ```
  Expected: Shows `public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`

### Day 1

- [ ] **Monitor error logs**
  - Check Vercel deployment logs for errors
  - Check application logs for 5xx errors

- [ ] **Test tool pages**
  - Visit a few tool pages manually
  - Verify content loads correctly
  - Check console for errors

- [ ] **Verify Core Web Vitals**
  - Go to https://pagespeed.web.dev/
  - Test https://www.trackmcp.com
  - Check LCP, FID, CLS scores

### Week 1

- [ ] **Request re-indexing in Google Search Console**
  1. Go to https://search.google.com/search-console
  2. Select your property
  3. Click "URL inspection"
  4. Enter: https://www.trackmcp.com
  5. Click "Request indexing"

- [ ] **Test with Google Rich Results Test**
  1. Go to https://search.google.com/test/rich-results
  2. Enter: https://www.trackmcp.com
  3. Verify schemas are detected

- [ ] **Monitor Google Search Console**
  - Check for crawl errors
  - Monitor crawl frequency
  - Check coverage report

- [ ] **Check answer engine crawling**
  - Monitor server logs for PerplexityBot visits
  - Monitor server logs for ChatGPT-User visits
  - Monitor server logs for Claude-Web visits

### Week 2-3

- [ ] **Monitor Google Analytics**
  - Check for new referral traffic from answer engines
  - Look for traffic from perplexity.ai, openai.com, claude.ai

- [ ] **Search for citations**
  - Search your tools in Perplexity: https://www.perplexity.ai
  - Search your tools in ChatGPT: https://chatgpt.com
  - Search your tools in Claude: https://claude.ai
  - Look for citations from trackmcp.com

- [ ] **Monitor Core Web Vitals**
  - Check PageSpeed Insights weekly
  - Monitor Google Search Console Core Web Vitals report

### Month 1

- [ ] **Analyze traffic trends**
  - Compare answer engine traffic to previous month
  - Track citation volume
  - Monitor ranking changes

- [ ] **Optimize based on data**
  - Adjust ISR revalidation if needed
  - Optimize pages with high traffic
  - Fix any issues found

## Rollback Plan (If Issues)

If you encounter critical issues:

```bash
# Revert the changes
git revert HEAD

# Push to production
git push origin main

# Vercel will automatically redeploy
```

## Monitoring Commands

### Check homepage is server-rendered
```bash
curl -s https://www.trackmcp.com | grep -c "Model Context Protocol"
# Should output: 3
```

### Check structured data
```bash
curl -s https://www.trackmcp.com | grep '"@type"' | head -5
# Should show multiple schema types
```

### Check cache headers
```bash
curl -I https://www.trackmcp.com | grep -E "Cache-Control|X-Robots-Tag"
```

### Monitor bot visits
```bash
# Check server logs for answer engine bots
grep -i "perplexitybot\|chatgpt-user\|claude-web" /var/log/app.log
```

## Success Criteria

✅ **Deployment successful when:**
- Homepage loads with full HTML content
- Structured data is present and valid
- Cache headers are correct
- Answer engine bots can access content
- No 5xx errors in logs
- Core Web Vitals remain good
- Google Search Console shows crawl activity

## Support & Troubleshooting

**Issue: Homepage shows empty content**
- Check: `npm run build` completes without errors
- Check: `export const dynamic = 'force-dynamic'` is in page.tsx
- Solution: Restart Vercel deployment

**Issue: Cache headers missing**
- Check: next.config.js has headers configuration
- Check: Vercel is serving from CDN (not origin)
- Solution: Clear CDN cache and redeploy

**Issue: Answer engines not crawling**
- Check: robots.txt allows bots (should be present)
- Check: Site is publicly accessible
- Check: No 403/401 errors in logs
- Solution: Wait 1-2 weeks for bots to discover site

**Issue: Core Web Vitals degraded**
- Check: ISR revalidation time (too frequent = slow)
- Check: Database queries are optimized
- Check: Images are optimized
- Solution: Adjust revalidation timing or optimize queries

---

**Last Updated**: November 14, 2025
**Status**: Ready for Deployment
