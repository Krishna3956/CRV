# Google Site Name Quick Fix Guide

## 🎯 TL;DR

**Problem:** Google shows "trackmcp.com" instead of "Track MCP" in search results

**Good News:** Your code is **already correct**! ✅

**Solution:** Request re-indexing in Google Search Console

---

## ✅ What You Already Have (Correct!)

I audited your code and found **everything is already set up correctly**:

### 1. WebSite Schema ✅
Location: `/src/app/layout.tsx` (lines 136-154)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Track MCP",
  "alternateName": "TrackMCP",
  "url": "https://www.trackmcp.com/"
}
```

### 2. Organization Schema ✅
Location: `/src/app/layout.tsx` (lines 156-174)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Track MCP",
  "url": "https://www.trackmcp.com"
}
```

### 3. Meta Tags ✅
Location: `/src/app/layout.tsx` (lines 18-68)

```typescript
metadata: {
  applicationName: 'Track MCP',
  openGraph: {
    siteName: 'Track MCP',
  },
  other: {
    'application-name': 'Track MCP',
    'apple-mobile-web-app-title': 'Track MCP',
  }
}
```

### 4. Visible Branding ✅
- Navbar: "Track MCP"
- Title: "Track MCP - ..."
- Logo alt: "Track MCP Logo"

---

## 🚀 What You Need to Do Now

### Step 1: Validate (5 minutes)

Test your homepage:
```
https://search.google.com/test/rich-results?url=https://www.trackmcp.com
```

**Expected Result:**
```
✓ WebSite schema detected
✓ Name: "Track MCP"
✓ 0 errors
```

### Step 2: Request Re-Indexing (15 minutes)

**For Homepage (Most Important):**

1. Open [Google Search Console](https://search.google.com/search-console)
2. Click "URL Inspection" at top
3. Enter: `https://www.trackmcp.com/`
4. Click "Test Live URL"
5. Verify schema is detected
6. Click "Request Indexing"
7. Confirm

**For Top Pages:**

Repeat for your most important pages:
```
https://www.trackmcp.com/tool/documcp
https://www.trackmcp.com/tool/mcp_futu
https://www.trackmcp.com/tool/hubspot_mcp
```

### Step 3: Wait & Monitor (2-4 weeks)

**Timeline:**
- Week 1-2: Google re-crawls pages
- Week 3-4: Site name updates in search results
- Week 5+: All pages show "Track MCP"

**Monitor:**
- Search Console → Enhancements → Structured Data
- Manual search: `site:www.trackmcp.com`
- Check weekly for changes

---

## 🔍 Why Google Still Shows Domain

Even though your code is correct, Google shows the domain because:

1. **Not Re-Crawled Yet**: Google hasn't visited your site since you added the schema
2. **Cached Data**: Google is using old cached data
3. **Processing Time**: Takes 2-8 weeks to update site name
4. **Authority**: New sites take longer than established ones

**This is normal!** Once Google re-crawls, it will show "Track MCP".

---

## 📊 How Google Decides Site Name

Google uses this priority order:

1. **WebSite Schema** (`name` property) ← You have this! ✅
2. Organization Schema (`name` property) ← You have this! ✅
3. Open Graph (`og:site_name`) ← You have this! ✅
4. Application name meta tags ← You have this! ✅
5. Title tag patterns
6. Domain name (fallback)

**You have all 4 top signals!** Google will use "Track MCP" once it re-crawls.

---

## ✅ Verification Checklist

Before requesting re-indexing:

- [x] WebSite schema has `"name": "Track MCP"` ✅
- [x] Schema is in `<head>` tag ✅
- [x] `og:site_name` is "Track MCP" ✅
- [x] Navbar shows "Track MCP" ✅
- [x] Title includes "Track MCP" ✅
- [ ] Tested with Rich Results Test ⏳
- [ ] Requested re-indexing ⏳

---

## 🎯 Expected Result

### Before (Current)
```
Search Result:
trackmcp.com › Tool Name
https://www.trackmcp.com/tool/documcp
```

### After (Target - 2-4 weeks)
```
Search Result:
Track MCP › Tool Name
https://www.trackmcp.com/tool/documcp
```

---

## ⚠️ Important Notes

### 1. Be Patient
- Google takes **2-8 weeks** to update site names
- High-authority sites update faster
- New sites may take longer
- This is normal!

### 2. Don't Make Changes
- Your code is already correct
- Don't add duplicate schemas
- Don't change the name
- Just wait for Google

### 3. Monitor Progress
- Check Search Console weekly
- Search `site:www.trackmcp.com` to see current state
- Track when changes appear

### 4. All Pages Will Update
- Once homepage updates, other pages follow
- May take additional 1-2 weeks for all pages
- Be patient and consistent

---

## 🆘 Troubleshooting

### Issue: Rich Results Test Shows Errors

**Check:**
- Is the URL accessible?
- Is there a JavaScript error?
- Is the schema valid JSON?

**Solution:**
- Fix any errors shown
- Re-test until 0 errors

### Issue: Still Shows Domain After 8 Weeks

**Possible Causes:**
1. Google hasn't re-crawled (check Search Console)
2. Low site authority (build backlinks)
3. Conflicting schemas (check for duplicates)

**Solution:**
- Request re-indexing again
- Build brand authority
- Verify no duplicate WebSite schemas

### Issue: Some Pages Show Brand, Others Don't

**Cause:** Google hasn't crawled all pages yet

**Solution:**
- Request re-indexing for specific pages
- Wait for Google to crawl all pages
- Be patient (can take 4-8 weeks)

---

## 📞 Quick Links

- **Test Schema**: https://search.google.com/test/rich-results
- **Search Console**: https://search.google.com/search-console
- **Full Guide**: See `GOOGLE-SITE-NAME-FIX.md` for detailed explanation

---

## ✅ Summary

**Status:** ✅ Your code is already correct!

**What's Needed:**
1. ⏳ Validate with Rich Results Test
2. ⏳ Request re-indexing in Search Console
3. ⏳ Wait 2-4 weeks for Google to update

**Expected Result:** "Track MCP" will appear as the site name in Google search results

**Timeline:** 2-8 weeks after re-indexing

---

**Last Updated:** November 4, 2024
**Status:** Ready for Re-Indexing
