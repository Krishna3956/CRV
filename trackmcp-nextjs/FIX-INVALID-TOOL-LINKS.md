# Fix Invalid Tool Links (404 Errors)

## 🔴 Problem

Some pages return 404 errors because:
1. **Tool doesn't exist in database** - Invalid links in sitemap
2. **Invalid tool names** - File extensions like `CONFIG.md`
3. **Case mismatches** - Database has lowercase, URL has uppercase

---

## 🔍 Identify Invalid Tools

### Step 1: Run the Diagnostic Script

```bash
npx tsx scripts/find-invalid-tools.ts
```

This will:
- Check all 214 affected URLs
- Identify which tools don't exist in database
- Find invalid tool names (CONFIG.md, etc.)
- Generate a detailed report

### Step 2: Review the Report

The script creates `invalid-tools-report.json` with:
- Tools not in database (true 404s)
- Tools with file extensions
- Tools with uppercase letters
- Tools with special characters

---

## ✅ Solutions

### Solution 1: Remove Invalid Tools from Database

**For tools that shouldn't exist (like CONFIG.md):**

```sql
-- Remove invalid tool entries
DELETE FROM mcp_tools 
WHERE repo_name IN (
  'CONFIG.md',
  -- Add other invalid names
);
```

### Solution 2: Fix Tool Names in Database

**For tools with uppercase/special chars:**

```sql
-- Backup first!
CREATE TABLE mcp_tools_backup AS SELECT * FROM mcp_tools;

-- Convert to lowercase
UPDATE mcp_tools
SET repo_name = LOWER(repo_name)
WHERE repo_name ~ '[A-Z]';

-- Replace special characters (except hyphens and underscores)
UPDATE mcp_tools
SET repo_name = REGEXP_REPLACE(
  REGEXP_REPLACE(repo_name, '[^a-z0-9_-]', '-', 'g'),
  '-+', '-', 'g'
)
WHERE repo_name ~ '[^a-z0-9_-]';

-- Remove leading/trailing dashes
UPDATE mcp_tools
SET repo_name = TRIM(BOTH '-' FROM repo_name);
```

### Solution 3: Add Redirects for Changed Names

**If you normalize names, add redirects in `next.config.js`:**

```javascript
async redirects() {
  return [
    // Uppercase to lowercase
    {
      source: '/tool/Audio-MCP-Server',
      destination: '/tool/audio-mcp-server',
      permanent: true,
    },
    {
      source: '/tool/BinanceMCPServer',
      destination: '/tool/binancemcpserver',
      permanent: true,
    },
    {
      source: '/tool/MemoryMesh',
      destination: '/tool/memorymesh',
      permanent: true,
    },
    // Add more as needed
    
    // Trailing slashes
    {
      source: '/tool/:name/',
      destination: '/tool/:name',
      permanent: true,
    },
  ]
}
```

### Solution 4: Update Sitemap to Exclude Invalid Tools

**In `src/app/sitemap.ts`:**

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  const { data: tools } = await supabase
    .from('mcp_tools')
    .select('repo_name, updated_at')
    .not('repo_name', 'is', null)
    // Exclude invalid patterns
    .not('repo_name', 'like', '%.md')
    .not('repo_name', 'like', '%.txt')
    .not('repo_name', 'like', '%.json')
  
  return [
    {
      url: 'https://www.trackmcp.com/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...(tools || [])
      .filter(tool => {
        // Only include valid tool names
        return /^[a-z0-9_-]+$/.test(tool.repo_name)
      })
      .map((tool) => ({
        url: `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name)}`,
        lastModified: new Date(tool.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
  ]
}
```

---

## 🎯 Quick Fix for Common Issues

### Issue 1: CONFIG.md Returns 404

**Problem:** `CONFIG.md` is not a tool, it's a file

**Solution:**
```sql
-- Remove from database
DELETE FROM mcp_tools WHERE repo_name = 'CONFIG.md';
```

**Or add to 404 redirect:**
```javascript
{
  source: '/tool/CONFIG.md',
  destination: '/',
  permanent: true,
}
```

### Issue 2: Uppercase Tool Names

**Problem:** Database has `audio-mcp-server`, URL is `Audio-MCP-Server`

**Solution:** Already fixed! Our canonical tag fix handles this.
- Canonical now points to lowercase version
- Google will index the correct URL

### Issue 3: Tools Not in Database

**Problem:** URL exists but tool doesn't exist in database

**Solutions:**
1. **If tool should exist:** Add it to database
2. **If tool shouldn't exist:** Remove from sitemap, let it 404
3. **If tool was deleted:** Add redirect to homepage

---

## 📋 Action Plan

### Immediate Actions

1. **Run diagnostic script:**
   ```bash
   npx tsx scripts/find-invalid-tools.ts
   ```

2. **Review the report:**
   - Check `invalid-tools-report.json`
   - Identify which tools are truly invalid

3. **Clean up database:**
   ```sql
   -- Remove obvious invalid entries
   DELETE FROM mcp_tools 
   WHERE repo_name LIKE '%.md'
      OR repo_name LIKE '%.txt'
      OR repo_name LIKE '%.json';
   ```

4. **Normalize tool names:**
   ```sql
   -- Convert to lowercase
   UPDATE mcp_tools
   SET repo_name = LOWER(repo_name)
   WHERE repo_name ~ '[A-Z]';
   ```

5. **Update sitemap:**
   - Add validation to exclude invalid patterns
   - Redeploy

### Long-term Solutions

6. **Add validation on import:**
   ```typescript
   function isValidToolName(name: string): boolean {
     return /^[a-z0-9_-]+$/.test(name)
   }
   
   // When importing tools:
   if (!isValidToolName(toolName)) {
     console.warn(`Skipping invalid tool name: ${toolName}`)
     return
   }
   ```

7. **Add database constraints:**
   ```sql
   ALTER TABLE mcp_tools
   ADD CONSTRAINT repo_name_format 
   CHECK (repo_name ~ '^[a-z0-9_-]+$');
   ```

---

## 🔧 Automated Fix Script

Create `scripts/fix-invalid-tools.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Need admin key
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixInvalidTools() {
  console.log('🔧 Fixing invalid tool names...\n')
  
  // 1. Remove file extensions
  const { data: fileExtTools } = await supabase
    .from('mcp_tools')
    .select('id, repo_name')
    .or('repo_name.like.%.md,repo_name.like.%.txt,repo_name.like.%.json')
  
  if (fileExtTools && fileExtTools.length > 0) {
    console.log(`Removing ${fileExtTools.length} tools with file extensions...`)
    const ids = fileExtTools.map(t => t.id)
    await supabase.from('mcp_tools').delete().in('id', ids)
    console.log('✅ Removed\n')
  }
  
  // 2. Normalize to lowercase
  const { data: uppercaseTools } = await supabase
    .from('mcp_tools')
    .select('id, repo_name')
    .filter('repo_name', 'like', '%[A-Z]%')
  
  if (uppercaseTools && uppercaseTools.length > 0) {
    console.log(`Normalizing ${uppercaseTools.length} tools to lowercase...`)
    for (const tool of uppercaseTools) {
      const normalized = tool.repo_name.toLowerCase()
      await supabase
        .from('mcp_tools')
        .update({ repo_name: normalized })
        .eq('id', tool.id)
    }
    console.log('✅ Normalized\n')
  }
  
  // 3. Fix special characters
  const { data: specialCharTools } = await supabase
    .from('mcp_tools')
    .select('id, repo_name')
    .filter('repo_name', 'like', '%[^a-z0-9_-]%')
  
  if (specialCharTools && specialCharTools.length > 0) {
    console.log(`Fixing ${specialCharTools.length} tools with special characters...`)
    for (const tool of specialCharTools) {
      const normalized = tool.repo_name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      await supabase
        .from('mcp_tools')
        .update({ repo_name: normalized })
        .eq('id', tool.id)
    }
    console.log('✅ Fixed\n')
  }
  
  console.log('✅ All invalid tools fixed!')
}

fixInvalidTools().catch(console.error)
```

---

## 📊 Expected Results

### Before Fix:
```
Total tools: 2000
Invalid names: 214
- Uppercase: 150
- File extensions: 5
- Special chars: 59
404 errors: 214
```

### After Fix:
```
Total tools: 1995 (removed 5 invalid)
Invalid names: 0
- All normalized to lowercase
- All special chars fixed
- File extensions removed
404 errors: 0 (or only legitimate 404s)
```

---

## ⚠️ Important Notes

### Before Running Fixes:

1. **Backup your database:**
   ```sql
   CREATE TABLE mcp_tools_backup AS SELECT * FROM mcp_tools;
   ```

2. **Test on a few tools first:**
   ```sql
   -- Test normalization
   SELECT 
     repo_name as original,
     LOWER(repo_name) as normalized
   FROM mcp_tools
   WHERE repo_name ~ '[A-Z]'
   LIMIT 10;
   ```

3. **Check for duplicates after normalization:**
   ```sql
   -- This will show if normalization creates duplicates
   SELECT 
     LOWER(repo_name) as normalized,
     COUNT(*) as count
   FROM mcp_tools
   GROUP BY LOWER(repo_name)
   HAVING COUNT(*) > 1;
   ```

### After Running Fixes:

1. **Verify no duplicates:**
   ```sql
   SELECT repo_name, COUNT(*) 
   FROM mcp_tools 
   GROUP BY repo_name 
   HAVING COUNT(*) > 1;
   ```

2. **Check all names are valid:**
   ```sql
   SELECT COUNT(*) 
   FROM mcp_tools 
   WHERE repo_name !~ '^[a-z0-9_-]+$';
   -- Should return 0
   ```

3. **Request re-indexing** for affected pages

---

## 🚀 Next Steps

1. **Run diagnostic:** `npx tsx scripts/find-invalid-tools.ts`
2. **Review report:** Check `invalid-tools-report.json`
3. **Backup database:** Create backup table
4. **Run fixes:** Execute SQL or run fix script
5. **Update sitemap:** Add validation
6. **Deploy changes**
7. **Request re-indexing** in Search Console

---

**Status:** Ready to identify and fix invalid tools
**Date:** November 4, 2024
**Priority:** High (affects 214 pages)
