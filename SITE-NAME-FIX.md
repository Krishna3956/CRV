# Site Name Display Fix for Google Search Results

## Issue
Google search results were showing "Google" or incorrect site name instead of "Track MCP"

## Root Cause
While `og:site_name` was set correctly, Google primarily uses **Schema.org structured data** (specifically the WebSite and Organization schemas) to determine the site name in search results. The schemas needed additional properties for better recognition.

## LinkedIn References Found
LinkedIn is only mentioned in:
1. **Footer link** - Author credit link to Krishna Goyal's LinkedIn profile
2. **Documentation files** - README.md and SEO notes
3. **Organization schema** - Now added as a social profile link

None of these should cause Google to show incorrect site names.

## Changes Made

### 1. Enhanced WebSite Schema (index.html)
Added the following properties to help Google recognize "Track MCP":

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://www.trackmcp.com/",
  "name": "Track MCP",                          // ✅ Primary site name
  "alternateName": "TrackMCP",                  // ✅ NEW - Alternate name
  "description": "World's Largest Model Context Protocol Repository", // ✅ NEW
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.trackmcp.com/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### 2. Enhanced Organization Schema (index.html)
Added more details to strengthen brand identity:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "url": "https://www.trackmcp.com",
  "name": "Track MCP",                          // ✅ Organization name
  "alternateName": "TrackMCP",                  // ✅ NEW - Alternate name
  "logo": "https://www.trackmcp.com/logo.png",
  "description": "World's Largest Model Context Protocol Repository", // ✅ NEW
  "sameAs": [
    "https://x.com/trackmcp",
    "https://github.com/trackmcp",
    "https://www.linkedin.com/company/trackmcp" // ✅ NEW - LinkedIn company page
  ]
}
```

### 3. Existing Correct Configurations (No Changes Needed)
These were already correctly set:

✅ `<title>Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers</title>`
✅ `<meta name="application-name" content="Track MCP" />`
✅ `<meta property="og:site_name" content="Track MCP" />`
✅ `manifest.json` with `"name": "Track MCP - Model Context Protocol Tools Directory"`
✅ `manifest.json` with `"short_name": "Track MCP"`

## Why This Works

### Google's Site Name Recognition Process:
1. **Primary Source**: Schema.org WebSite and Organization structured data
2. **Secondary Source**: Open Graph `og:site_name` meta tag
3. **Fallback**: Page title and domain name

### Key Improvements:
- **`alternateName`**: Helps Google recognize variations of your brand name
- **`description`**: Provides context about what Track MCP is
- **LinkedIn in `sameAs`**: Adds another verified social profile (strengthens brand signals)
- **Consistent naming**: "Track MCP" used everywhere consistently

## Expected Results

After Google re-crawls and re-indexes your site (typically 1-7 days):
- ✅ Search results should show "Track MCP" as the site name
- ✅ Knowledge panel (if generated) will show "Track MCP"
- ✅ Rich results will display correct organization name
- ✅ Social media shares will show "Track MCP"

## How to Speed Up Recognition

1. **Request re-indexing** in Google Search Console:
   - Go to URL Inspection tool
   - Enter: https://www.trackmcp.com/
   - Click "Request Indexing"

2. **Submit updated sitemap**:
   - Already done with www URLs
   - Google will re-crawl all pages

3. **Verify structured data**:
   - Use Google's Rich Results Test: https://search.google.com/test/rich-results
   - Test URL: https://www.trackmcp.com/
   - Should show valid WebSite and Organization schemas

## Verification Checklist

- ✅ WebSite schema includes `name` and `alternateName`
- ✅ Organization schema includes `name` and `alternateName`
- ✅ Both schemas include `description`
- ✅ `og:site_name` meta tag is set
- ✅ `application-name` meta tag is set
- ✅ Page title includes "Track MCP"
- ✅ manifest.json has correct names
- ✅ All URLs use www version
- ✅ LinkedIn company page added to social profiles

## Notes

- The LinkedIn link to Krishna Goyal in the footer is fine - it's an author credit, not a site identity claim
- Google distinguishes between:
  - **Site/Organization name**: Track MCP (from schema)
  - **Author/Creator**: Krishna Goyal (from footer link)
- These are separate entities and won't conflict

## Testing

Test your structured data:
```bash
# Google Rich Results Test
https://search.google.com/test/rich-results?url=https://www.trackmcp.com/

# Schema Markup Validator
https://validator.schema.org/#url=https://www.trackmcp.com/
```

Both should show valid WebSite and Organization schemas with "Track MCP" as the name.
