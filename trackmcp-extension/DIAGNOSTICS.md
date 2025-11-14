# Track MCP Extension - Diagnostics & Troubleshooting

## 🔴 REAL ISSUES IDENTIFIED

### Issue #1: API Endpoints Not Implemented
**Problem**: Extension calls these endpoints that may not exist:
- `GET https://www.trackmcp.com/api/search?q=keyword`
- `GET https://www.trackmcp.com/api/trending`
- `GET https://www.trackmcp.com/api/mcp/lookup?domain=...&url=...`

**Evidence**: If these endpoints don't return data, the extension shows "Error loading results"

**Fix Required**: Implement these endpoints on your Next.js backend

---

### Issue #2: CORS Blocking
**Problem**: Chrome extension requests may be blocked by CORS

**Symptoms**:
- Network tab shows CORS error
- "No 'Access-Control-Allow-Origin' header"

**Fix**: Add CORS headers to your API responses:
```javascript
// In your Next.js API route
res.setHeader('Access-Control-Allow-Origin', '*')
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
```

---

### Issue #3: Extension Not Loading Properly
**Problem**: Extension may have errors preventing it from working

**How to Debug**:
1. Open Chrome DevTools on popup: Right-click popup → "Inspect"
2. Check Console tab for errors
3. Check Network tab for failed requests

**Common Errors**:
- `Uncaught TypeError: Cannot read property 'addEventListener' of null`
  - Fix: HTML elements not loading before JS runs
- `Uncaught ReferenceError: chrome is not defined`
  - Fix: Extension context issue

---

### Issue #4: Missing API Implementation
**Problem**: Your Next.js app doesn't have `/api/search`, `/api/trending`, `/api/mcp/lookup` endpoints

**What You Need to Add**:

#### 1. Search Endpoint
```typescript
// /src/app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q) {
    return Response.json({ results: [] })
  }

  // Query your database
  const results = await db.query(
    `SELECT id, repo_name, description, stars
     FROM mcp_tools
     WHERE (repo_name ILIKE $1 OR description ILIKE $1)
     AND status = 'approved'
     ORDER BY stars DESC
     LIMIT 100`,
    [`%${q}%`]
  )

  return Response.json({ results: results.rows })
}
```

#### 2. Trending Endpoint
```typescript
// /src/app/api/trending/route.ts
export async function GET(request: Request) {
  const trending = await db.query(
    `SELECT id, repo_name, description, stars
     FROM mcp_tools
     WHERE status = 'approved'
     ORDER BY stars DESC
     LIMIT 10`
  )

  return Response.json({ trending: trending.rows })
}
```

#### 3. MCP Lookup Endpoint
```typescript
// /src/app/api/mcp/lookup/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  const url = searchParams.get('url')

  if (!domain) {
    return Response.json({ mcps: [], category: '' })
  }

  // Map domain to category
  const categoryMap: { [key: string]: string } = {
    'github.com': 'Development',
    'stackoverflow.com': 'Development',
    'medium.com': 'Content',
    // Add more mappings
  }

  const category = categoryMap[domain] || 'Others'

  const mcps = await db.query(
    `SELECT id, repo_name, description, stars
     FROM mcp_tools
     WHERE category = $1
     AND status = 'approved'
     ORDER BY stars DESC
     LIMIT 10`,
    [category]
  )

  return Response.json({
    domain,
    category,
    mcps: mcps.rows
  })
}
```

---

## 🔧 Step-by-Step Fix

### Step 1: Verify Extension Loads
1. Go to `chrome://extensions/`
2. Find "Track MCP"
3. Click "Details"
4. Check for any errors

### Step 2: Test Extension Popup
1. Click extension icon
2. Right-click → "Inspect"
3. Open Console tab
4. Type in search box
5. Check for errors

### Step 3: Check Network Requests
1. In DevTools, go to Network tab
2. Type in search box
3. Look for `api/search` request
4. Check if it returns data or error

### Step 4: Implement Missing API Endpoints
Add the three endpoints above to your Next.js app

### Step 5: Test Again
1. Reload extension
2. Try searching
3. Should see results

---

## 🧪 Quick Test

### Test Search Manually
```bash
curl "https://www.trackmcp.com/api/search?q=python"
```

If you get:
- **200 OK with data**: API works ✅
- **404 Not Found**: Endpoint doesn't exist ❌
- **CORS error**: Need CORS headers ❌

### Test Trending Manually
```bash
curl "https://www.trackmcp.com/api/trending"
```

### Test Page Detection Manually
```bash
curl "https://www.trackmcp.com/api/mcp/lookup?domain=github.com&url=https://github.com"
```

---

## 🎯 Root Cause

**The extension code is correct, but the API endpoints are missing.**

The extension is trying to call endpoints that don't exist on your website.

---

## ✅ What You Need to Do

1. **Add the 3 API endpoints** to your Next.js app (see code above)
2. **Test endpoints manually** with curl
3. **Reload extension** in Chrome
4. **Test again** - should work now

---

## 📝 Files to Create

Create these files in your Next.js app:

1. `/src/app/api/search/route.ts`
2. `/src/app/api/trending/route.ts`
3. `/src/app/api/mcp/lookup/route.ts`

---

## 🚨 Important

The extension itself is fine. The problem is your backend doesn't have the API endpoints it's trying to call.

Once you add those 3 endpoints, everything will work.

