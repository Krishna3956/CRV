# SEO Implementation Notes for Track MCP

## Overview
Track MCP is a Single Page Application (SPA) built with React + Vite. This document explains how SEO is implemented and what to expect.

---

## How Meta Tags Work

### Client-Side Rendering (Development)
In local development (`npm run dev`), the app uses **React Helmet** to dynamically update meta tags:

1. Browser loads `index.html` with default meta tags
2. React app loads and renders
3. React Helmet updates `<head>` tags based on current route
4. Meta tags are now correct for the current page

**Important**: Web crawlers that don't execute JavaScript will only see the default meta tags from `index.html`.

### Production (Vercel Deployment)
When deployed to Vercel:

1. Vercel automatically handles SPA routing via `vercel.json`
2. Modern crawlers (Google, Bing) execute JavaScript and see correct meta tags
3. Social media crawlers (Facebook, Twitter, LinkedIn) may see default tags initially

---

## Current SEO Implementation

### ✅ What's Implemented

#### 1. Dynamic Meta Tags (All Pages)
Each page has unique meta tags via React Helmet:
- `<title>` - Page-specific title
- `<meta name="description">` - Page-specific description
- `<link rel="canonical">` - Page-specific canonical URL
- `<meta property="og:url">` - Page-specific Open Graph URL
- `<meta property="og:title">` - Page-specific OG title
- `<meta property="og:description">` - Page-specific OG description
- `<meta property="og:image">` - Track MCP logo
- Twitter Card meta tags

#### 2. Structured Data (Schema.org)
- **Homepage**: ItemList schema (top 10 tools)
- **Tool Pages**: SoftwareApplication + BreadcrumbList schemas
- **Static HTML**: Organization + WebSite schemas

#### 3. Performance Optimizations
- Preconnect to external domains
- DNS-prefetch for faster loading
- Code splitting with vendor chunks
- CSS code splitting
- Lazy loading for components

#### 4. Technical SEO
- XML Sitemap (auto-generated, includes all tools)
- Robots.txt (optimized)
- Favicon (multiple formats)
- Alt text on all images
- Semantic HTML structure

---

## Page-Specific Meta Tags

### Homepage (`/`)
```
Title: Discover 10,000+ Model Context Protocol Tools & Servers - Track MCP
Description: Explore the world's largest directory of Model Context Protocol (MCP) tools...
Canonical: https://trackmcp.com/
OG URL: https://trackmcp.com/
```

### Tool Pages (`/tool/:name`)
```
Title: [Tool Name] - Track MCP
Description: Learn about [Tool Name], a tool for the Model Context Protocol...
Canonical: https://trackmcp.com/tool/[tool-name]
OG URL: https://trackmcp.com/tool/[tool-name]
```

### 404 Page
```
Title: Page Not Found - Track MCP
Canonical: https://trackmcp.com/
OG URL: https://trackmcp.com/
```

---

## Testing SEO

### 1. Google Search Console
- Verify site ownership
- Submit sitemap: `https://trackmcp.com/sitemap.xml`
- Monitor indexing status
- Check Core Web Vitals

### 2. Rich Results Test
Test structured data:
```
https://search.google.com/test/rich-results
```
Enter: `https://trackmcp.com` or any tool page URL

### 3. Facebook Debugger
Test Open Graph tags:
```
https://developers.facebook.com/tools/debug/
```
Enter any page URL and click "Scrape Again" to refresh cache

### 4. Twitter Card Validator
Test Twitter Cards:
```
https://cards-dev.twitter.com/validator
```
Enter any page URL

### 5. PageSpeed Insights
Test performance and Core Web Vitals:
```
https://pagespeed.web.dev/
```
Enter: `https://trackmcp.com`

---

## Known Limitations

### Social Media Crawlers
Social media platforms (Facebook, Twitter, LinkedIn) may not execute JavaScript:
- They might see default meta tags from `index.html`
- Solution: Use Vercel's built-in prerendering (automatic)
- Alternative: Use a service like Prerender.io

### Local Development
In local development:
- `curl` requests will show default meta tags
- Browser will show correct meta tags (React Helmet updates them)
- This is expected behavior for SPAs

---

## Vercel Configuration

The `vercel.json` file ensures proper SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This tells Vercel to serve `index.html` for all routes, allowing React Router to handle navigation.

---

## Future Improvements

### 1. Prerendering
Consider adding prerendering for better social media sharing:
- Use `react-snap` or `react-helmet-async` with SSR
- Or use Vercel's Edge Functions for dynamic OG images

### 2. Dynamic OG Images
Generate unique Open Graph images for each tool page:
- Tool name + logo
- Stars count
- Last updated date

### 3. Additional Structured Data
- FAQ schema for common questions
- Review schema (if user reviews are added)
- VideoObject schema (if tutorials are added)

---

## Monitoring Checklist

### Weekly
- [ ] Check Google Search Console for errors
- [ ] Monitor Core Web Vitals scores
- [ ] Review top-performing pages

### Monthly
- [ ] Analyze keyword rankings
- [ ] Check backlink profile
- [ ] Review and update meta descriptions
- [ ] Test social media previews

### Quarterly
- [ ] Audit structured data
- [ ] Update sitemap if needed
- [ ] Review and optimize slow pages
- [ ] Analyze competitor SEO strategies

---

## Resources

- [React Helmet Async Docs](https://github.com/staylor/react-helmet-async)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

---

## Contact

For SEO questions or issues, contact Krishna Goyal:
- LinkedIn: https://www.linkedin.com/in/krishnaa-goyal/
- GitHub: https://github.com/Krishna3956
