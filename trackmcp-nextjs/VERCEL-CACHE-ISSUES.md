# Vercel Cache Issues & Solutions

## Issue: Canonical Tags Not Updating After Code Changes

### What Happened:
- Fixed canonical tags in code (each page should have its own URL)
- Pushed to GitHub and deployed to Vercel
- Pages still showed old canonical tags (homepage URL on all pages)

### Root Cause:
**Multiple layers of caching:**
1. **Data Cache** - Caches database queries (Supabase)
2. **Edge Cache** - Caches pre-rendered HTML pages
3. **Build Cache** - Caches build artifacts between deployments

When we deployed the fix, Vercel:
- ✅ Used new code
- ❌ Served pre-rendered HTML from previous build (Edge Cache)
- ❌ Pages had old canonical tags baked into HTML

### Solution:

#### Option 1: Purge All Caches (Recommended)
1. Go to Vercel Dashboard → Project → Settings → Caches
2. Purge **Data Cache**
3. Purge **Edge Cache** (if available)
4. Redeploy with "Use existing Build Cache" **UNCHECKED**

#### Option 2: Force Fresh Rebuild
1. Go to Deployments tab
2. Click ⋯ on latest deployment
3. Select "Redeploy"
4. **Uncheck** "Use existing Build Cache"
5. Click "Redeploy"

#### Option 3: Use Revalidation API (For Single Pages)
```bash
curl -X POST "https://www.trackmcp.com/api/revalidate?secret=dev-revalidate&path=/tool/[tool-name]"
```

---

## How to Prevent This:

### 1. Use Cache Tags for Better Control
```typescript
// In your fetch calls
const res = await fetch('...', {
  next: { 
    revalidate: 3600,
    tags: ['tools'] // Add cache tags
  }
})

// Then revalidate on-demand
import { revalidateTag } from 'next/cache'
revalidateTag('tools')
```

### 2. Reduce Revalidation Time During Development
```typescript
// In page.tsx
export const revalidate = process.env.NODE_ENV === 'production' ? 3600 : 60
```

### 3. Use Dynamic Rendering for Frequently Changing Pages
```typescript
export const dynamic = 'force-dynamic' // No caching
```

### 4. Monitor Cache Headers
```bash
curl -sI https://www.trackmcp.com/tool/[name] | grep -i "cache\|age"
```

Look for:
- `x-vercel-cache: HIT` = Served from cache
- `x-vercel-cache: MISS` = Freshly generated
- `age: X` = Seconds since cached

---

## Vercel Cache Layers Explained:

### 1. Data Cache (Supabase/API Calls)
- **What:** Caches responses from `fetch()` calls
- **Duration:** Based on `revalidate` setting
- **Clear:** Settings → Caches → Purge Data Cache

### 2. Edge Cache (Pre-rendered Pages)
- **What:** Caches static HTML at CDN edge
- **Duration:** Until revalidation or manual purge
- **Clear:** Redeploy without build cache

### 3. Build Cache (Dependencies/Artifacts)
- **What:** Caches node_modules, build outputs
- **Duration:** Between deployments
- **Clear:** Redeploy with "Use existing Build Cache" OFF

---

## Quick Troubleshooting:

### Pages not updating after deployment?
1. Check cache headers: `curl -sI [url]`
2. If `x-vercel-cache: HIT` → Purge caches
3. If `age` is high → Wait for revalidation or force purge

### Metadata not updating?
1. Purge Data Cache (database queries)
2. Redeploy without build cache
3. Hard refresh browser (Cmd+Shift+R)

### CSS/JS not updating?
1. Check build cache
2. Redeploy without build cache
3. Clear browser cache

---

## Best Practices:

1. **Use appropriate revalidation times:**
   - Frequently changing: 60-300 seconds
   - Moderate: 3600 seconds (1 hour)
   - Rarely changing: 86400 seconds (1 day)

2. **Add cache tags for granular control:**
   ```typescript
   next: { tags: ['tools', 'homepage'] }
   ```

3. **Test in production-like environment:**
   - Use Vercel preview deployments
   - Test cache behavior before merging

4. **Monitor cache hit rates:**
   - Check Vercel Analytics
   - Optimize revalidation times based on data

---

**Last Updated:** November 2, 2025
**Issue:** Canonical tags caching
**Resolution:** Purge all caches + redeploy without build cache
