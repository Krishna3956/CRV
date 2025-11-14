# OG Image Generation - Debug Analysis

**Date**: 2025-11-14  
**Issue**: Tool OG images not showing (API route exists but images not displaying)  

---

## 🔍 ROOT CAUSE IDENTIFIED

### **The Problem:**

When a tool page URL has underscores or mixed case, the OG image URL is being generated incorrectly:

```
URL: /tool/google_calendar_mcp
↓
generateMetadata() called with params.name = "google_calendar_mcp"
↓
getTool("google_calendar_mcp") - uses ilike (case-insensitive)
↓
Finds tool in database (repo_name might be "google-calendar-mcp" or "Google Calendar MCP")
↓
OG image URL generated with: toolName = tool.repo_name
↓
Result: /api/og?tool=google-calendar-mcp&stars=...
↓
But URL was normalized to: /tool/google-calendar-mcp (with redirect)
↓
OG image URL now points to WRONG tool name!
```

### **Why It's Broken:**

1. **URL Normalization happens AFTER metadata generation**
   - `generateMetadata()` is called first (with original params)
   - Page component runs second (normalizes URL)
   - By then, OG image URL is already generated with wrong name

2. **Database has inconsistent repo_name formats**
   - Some: `google-calendar-mcp` (dashes)
   - Some: `google_calendar_mcp` (underscores)
   - Some: `Google Calendar MCP` (spaces)
   - ilike finds them all, but returns different formats

3. **OG image URL uses database repo_name**
   - If database has `google-calendar-mcp`
   - But URL was `/tool/google_calendar_mcp`
   - OG image URL uses `google-calendar-mcp`
   - But page is now at `/tool/google-calendar-mcp` (after redirect)
   - This creates a mismatch!

---

## ✅ SOLUTION

### **Fix: Normalize in generateMetadata too**

Update `generateMetadata()` to normalize the URL BEFORE fetching the tool:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ✅ NORMALIZE FIRST
  const decodedName = decodeURIComponent(params.name)
  const normalizedName = decodedName.toLowerCase().replace(/_/g, '-')
  
  // ✅ FETCH WITH NORMALIZED NAME
  const tool = await getTool(normalizedName)
  
  if (!tool) {
    return {
      title: 'MCP Tool Not Found | Track MCP',
      description: '...',
    }
  }
  
  // ✅ USE NORMALIZED NAME IN OG IMAGE URL
  const toolName = normalizedName  // Use normalized, not tool.repo_name
  
  return {
    openGraph: {
      images: [
        {
          url: `https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&...`,
          // ...
        },
      ],
    },
  }
}
```

### **Why This Works:**

1. ✅ URL is normalized BEFORE fetching tool
2. ✅ OG image URL uses normalized name
3. ✅ Page component also normalizes and redirects
4. ✅ Everything uses same canonical URL format
5. ✅ OG image API receives correct tool name

---

## 📊 BEFORE vs AFTER

### **BEFORE (Broken):**
```
URL: /tool/google_calendar_mcp
↓
generateMetadata() → getTool("google_calendar_mcp")
↓
tool.repo_name = "google-calendar-mcp" (from database)
↓
OG image URL: /api/og?tool=google-calendar-mcp
↓
Page redirects to: /tool/google-calendar-mcp
↓
Result: ❌ OG image might not match
```

### **AFTER (Fixed):**
```
URL: /tool/google_calendar_mcp
↓
generateMetadata() → normalize to "google-calendar-mcp"
↓
getTool("google-calendar-mcp")
↓
tool.repo_name = "google-calendar-mcp" (from database)
↓
OG image URL: /api/og?tool=google-calendar-mcp
↓
Page redirects to: /tool/google-calendar-mcp
↓
Result: ✅ Everything matches!
```

---

## 🔧 IMPLEMENTATION

Need to update `/src/app/tool/[name]/page.tsx`:

1. Move normalization logic to TOP of `generateMetadata()`
2. Use normalized name for `getTool()`
3. Use normalized name for OG image URL (not `tool.repo_name`)
4. Keep page component redirect logic as-is

---

## ⚠️ IMPORTANT NOTE

The API route `/api/og/route.tsx` is working correctly. The issue is NOT with the API - it's with the URL being passed to it!

---

**Status**: Ready to implement fix
