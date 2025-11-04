# Fix 404 Errors - Investigation Guide

## 🔍 How to Check 404 Errors in Search Console

### Step 1: Access the 404 Report

1. Open [Google Search Console](https://search.google.com/search-console)
2. Select your property: `trackmcp.com`
3. Navigate to: **Indexing** → **Pages**
4. Scroll down to "Why pages aren't indexed"
5. Click on **"Not found (404)"**

### Step 2: Export the List

1. Click the **Export** button (top right)
2. Download as CSV or Google Sheets
3. Review the list of URLs returning 404

---

## 🔧 Common Causes of 404 Errors

### 1. Tool Name Changes
**Cause:** Repository names changed on GitHub but old URLs still indexed

**Example:**
```
Old: https://www.trackmcp.com/tool/old-repo-name
New: https://www.trackmcp.com/tool/new-repo-name
```

**Solution:** Add redirects in `next.config.js`

### 2. Deleted Tools
**Cause:** Tools removed from database but still in Google's index

**Solution:** Return 410 (Gone) status or redirect to homepage

### 3. URL Encoding Issues
**Cause:** Special characters in tool names not properly encoded

**Example:**
```
❌ https://www.trackmcp.com/tool/mcp-server@v2
✅ https://www.trackmcp.com/tool/mcp-server%40v2
```

**Solution:** Ensure proper URL encoding in links

### 4. Case Sensitivity
**Cause:** GitHub repo names are case-sensitive

**Example:**
```
Database: "GitHub-MCP-Server"
URL: https://www.trackmcp.com/tool/github-mcp-server
```

**Solution:** Normalize case in database or handle case-insensitive lookups

---

## 🛠️ Solutions

### Solution 1: Add Redirects (Recommended)

**File:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  async redirects() {
    return [
      // Redirect old tool names to new ones
      {
        source: '/tool/old-tool-name',
        destination: '/tool/new-tool-name',
        permanent: true, // 301 redirect
      },
      // Add more redirects as needed
    ]
  },
}

module.exports = nextConfig
```

### Solution 2: Handle 404s Gracefully

**File:** `src/app/tool/[name]/not-found.tsx`

Create a custom 404 page for tool pages:

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ToolNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Tool Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The MCP tool you're looking for doesn't exist or has been removed.
      </p>
      
      <div className="flex gap-4 justify-center">
        <Button asChild>
          <Link href="/">Browse All Tools</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Search Tools</Link>
        </Button>
      </div>
      
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Popular MCP Tools</h2>
        {/* Add links to popular tools */}
      </div>
    </div>
  )
}
```

### Solution 3: Database Cleanup Script

**File:** `scripts/find-404-tools.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

async function find404Tools() {
  const supabase = createClient()
  
  // Get all tools from database
  const { data: tools, error } = await supabase
    .from('mcp_tools')
    .select('id, repo_name, github_url')
  
  if (error) {
    console.error('Error fetching tools:', error)
    return
  }
  
  console.log(`Checking ${tools.length} tools...`)
  
  const issues: any[] = []
  
  for (const tool of tools) {
    // Check for URL encoding issues
    const encodedName = encodeURIComponent(tool.repo_name)
    if (encodedName !== tool.repo_name) {
      issues.push({
        id: tool.id,
        repo_name: tool.repo_name,
        issue: 'URL encoding needed',
        encoded: encodedName,
      })
    }
    
    // Check for special characters
    if (/[@#$%^&*()+=\[\]{}|\\:;"'<>,.?\/]/.test(tool.repo_name)) {
      issues.push({
        id: tool.id,
        repo_name: tool.repo_name,
        issue: 'Special characters in name',
      })
    }
  }
  
  console.log(`Found ${issues.length} potential issues:`)
  console.table(issues)
}

find404Tools()
```

**Run it:**
```bash
npx tsx scripts/find-404-tools.ts
```

### Solution 4: Add Sitemap Exclusions

If some tools should not be indexed, exclude them from sitemap:

**File:** `src/app/sitemap.ts`

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  const { data: tools } = await supabase
    .from('mcp_tools')
    .select('repo_name, updated_at')
    .eq('status', 'active') // Only include active tools
    .not('repo_name', 'is', null)
  
  return [
    {
      url: 'https://www.trackmcp.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...(tools || []).map((tool) => ({
      url: `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name)}`,
      lastModified: new Date(tool.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
```

---

## 📋 Investigation Checklist

### Step 1: Identify the 404 URLs

From Search Console, get the list of 404 URLs and categorize them:

```
Category 1: Tool name changed
  - /tool/old-name-1
  - /tool/old-name-2

Category 2: Tool deleted
  - /tool/deleted-tool-1
  - /tool/deleted-tool-2

Category 3: URL encoding issues
  - /tool/name@with@special
  - /tool/name with spaces

Category 4: Unknown/Other
  - /tool/random-url
```

### Step 2: Check Database

```sql
-- Check if tools exist in database
SELECT repo_name, github_url, status
FROM mcp_tools
WHERE repo_name IN ('tool-name-1', 'tool-name-2', ...);

-- Check for similar names (case-insensitive)
SELECT repo_name, github_url
FROM mcp_tools
WHERE LOWER(repo_name) = LOWER('Tool-Name');

-- Check for special characters
SELECT repo_name, github_url
FROM mcp_tools
WHERE repo_name ~ '[^a-zA-Z0-9_-]';
```

### Step 3: Create Redirect Map

Based on your findings, create a redirect map:

```javascript
const redirects = [
  // Tool name changes
  { from: '/tool/old-name', to: '/tool/new-name' },
  
  // Deleted tools → homepage
  { from: '/tool/deleted-tool', to: '/' },
  
  // URL encoding fixes
  { from: '/tool/name@special', to: '/tool/name%40special' },
]
```

### Step 4: Implement Redirects

Add to `next.config.js`:

```javascript
async redirects() {
  return [
    {
      source: '/tool/old-name',
      destination: '/tool/new-name',
      permanent: true,
    },
    // Add all redirects from your map
  ]
}
```

### Step 5: Submit to Search Console

1. Go to **Removals** in Search Console
2. For deleted tools, request removal of outdated URLs
3. For redirected tools, wait for Google to re-crawl

---

## 🔍 Quick Diagnostic Commands

### Check if URL exists locally

```bash
# Test a specific tool URL
curl -I http://localhost:3000/tool/github-mcp-server

# Expected: 200 OK
# If 404: Tool doesn't exist in database
```

### Check database for tool

```bash
# Using psql or your database client
psql -h your-db-host -U your-user -d your-db -c \
  "SELECT repo_name FROM mcp_tools WHERE repo_name = 'github-mcp-server';"
```

### Check URL encoding

```bash
# Test URL encoding
node -e "console.log(encodeURIComponent('tool-name@special'))"
# Output: tool-name%40special
```

---

## 📊 Common 404 Patterns

### Pattern 1: Trailing Slashes

```
❌ https://www.trackmcp.com/tool/tool-name/
✅ https://www.trackmcp.com/tool/tool-name
```

**Fix:** Add redirect in `next.config.js`:
```javascript
{
  source: '/tool/:name/',
  destination: '/tool/:name',
  permanent: true,
}
```

### Pattern 2: Case Variations

```
Database: "GitHub-MCP-Server"
URLs trying:
  - /tool/github-mcp-server (404)
  - /tool/GitHub-MCP-Server (200)
```

**Fix:** Make lookup case-insensitive:
```typescript
const { data } = await supabase
  .from('mcp_tools')
  .select('*')
  .ilike('repo_name', decodeURIComponent(name))
  .single()
```

### Pattern 3: Special Characters

```
❌ /tool/mcp-server@v2
❌ /tool/mcp server
✅ /tool/mcp-server%40v2
✅ /tool/mcp%20server
```

**Fix:** Ensure all internal links use `encodeURIComponent()`

---

## 🚀 Action Plan

### Immediate Actions

1. **Export 404 list from Search Console**
   - Get all URLs returning 404
   - Categorize by issue type

2. **Check database**
   - Verify which tools exist
   - Identify name changes
   - Find special character issues

3. **Create redirect map**
   - Map old URLs to new URLs
   - Decide what to do with deleted tools

4. **Implement redirects**
   - Add to `next.config.js`
   - Test locally
   - Deploy

### Long-term Solutions

1. **Add monitoring**
   - Set up alerts for 404 errors
   - Track 404 rate in analytics

2. **Improve URL handling**
   - Always use `encodeURIComponent()`
   - Handle case-insensitive lookups
   - Validate tool names on import

3. **Better 404 page**
   - Show similar tools
   - Add search functionality
   - Provide helpful navigation

---

## 📞 Next Steps

**Please provide:**

1. **Screenshot or list of 404 URLs** from Search Console
2. **Number of 404 errors** you're seeing
3. **Any patterns** you notice in the URLs

Then I can:
- Create specific redirects for your case
- Fix any code issues causing 404s
- Update the database if needed

---

## 🔗 Resources

- [Next.js Redirects Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/redirects)
- [Google Search Console - Fix 404 Errors](https://support.google.com/webmasters/answer/181708)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

**Status:** Awaiting 404 URL list from Search Console
**Date:** November 4, 2024
