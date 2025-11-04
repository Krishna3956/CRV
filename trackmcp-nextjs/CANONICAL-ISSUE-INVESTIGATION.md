# Canonical Tag Issue - 214 Pages Investigation

## 🔍 Problem Summary

**Issue:** 214 out of 2000 pages showing "Alternative page with proper canonical tag"
**Status:** These pages aren't indexed or served on Google
**Percentage:** ~10.7% of pages affected

---

## 🎯 Key Questions

Since only **214 pages** are affected (not all), there must be a specific pattern:

### 1. What makes these 214 pages different?

Possible patterns:
- **Special characters in tool names** (e.g., `@`, `/`, spaces, etc.)
- **Case sensitivity issues** (e.g., `GitHub-MCP` vs `github-mcp`)
- **URL encoding problems** (e.g., `%40` vs `@`)
- **Duplicate tool names** in database
- **Recently added/updated tools**
- **Tools with specific categories or languages**

### 2. How to identify the pattern?

**You need to export the list of affected URLs from Search Console:**

1. Go to: **Indexing** → **Pages**
2. Click: "Alternative page with proper canonical tag"
3. Click: **Export** button
4. Download the CSV with all 214 URLs

---

## 🔧 Investigation Steps

### Step 1: Export the Affected URLs

From Search Console, get the list of 214 URLs:

```
Example format:
https://www.trackmcp.com/tool/tool-name-1
https://www.trackmcp.com/tool/tool-name-2
...
```

### Step 2: Analyze Patterns

Once you have the list, I can analyze:

**Pattern Analysis Script:**
```bash
# Extract tool names from URLs
cat affected-urls.txt | sed 's|https://www.trackmcp.com/tool/||' > tool-names.txt

# Check for special characters
grep -E '[^a-zA-Z0-9_-]' tool-names.txt

# Check for uppercase letters
grep -E '[A-Z]' tool-names.txt

# Check for URL-encoded characters
grep '%' tool-names.txt
```

### Step 3: Compare with Database

```sql
-- Get the 214 affected tools from database
SELECT 
  repo_name,
  github_url,
  created_at,
  updated_at,
  language,
  topics,
  LENGTH(repo_name) as name_length,
  repo_name ~ '[^a-zA-Z0-9_-]' as has_special_chars,
  repo_name ~ '[A-Z]' as has_uppercase
FROM mcp_tools
WHERE repo_name IN (
  -- List of 214 tool names from Search Console
  'tool-name-1',
  'tool-name-2',
  ...
)
ORDER BY created_at DESC;
```

---

## 🔍 Common Patterns (Hypotheses)

### Hypothesis 1: Special Characters in Names

**Example affected tools:**
```
mcp-server@v2
tool-name/subname
tool name with spaces
tool-name#123
```

**Why this causes issues:**
- URL encoding: `@` becomes `%40`
- Canonical uses database name: `mcp-server@v2`
- Actual URL accessed: `mcp-server%40v2`
- Google sees mismatch!

**Solution:**
```typescript
// Always encode in canonical
canonical: `https://www.trackmcp.com/tool/${encodeURIComponent(toolName)}`
```

### Hypothesis 2: Case Sensitivity

**Example affected tools:**
```
GitHub-MCP-Server
OpenAI-Tools
Claude-MCP
```

**Why this causes issues:**
- Database: `GitHub-MCP-Server`
- Users access: `/tool/github-mcp-server`
- Canonical points to: `/tool/GitHub-MCP-Server`
- Google sees two different URLs!

**Solution:**
```typescript
// Normalize to lowercase in database
UPDATE mcp_tools 
SET repo_name = LOWER(repo_name)
WHERE repo_name ~ '[A-Z]';

// Or handle case-insensitive lookup
const { data } = await supabase
  .from('mcp_tools')
  .select('*')
  .ilike('repo_name', decodeURIComponent(name))
  .single()
```

### Hypothesis 3: Duplicate Tool Names

**Example:**
```
Database has:
- id: 1, repo_name: "mcp-server"
- id: 2, repo_name: "mcp-server" (duplicate!)
```

**Why this causes issues:**
- Both tools have same canonical URL
- Google sees duplicate content
- Chooses one as canonical, marks other as alternate

**Solution:**
```sql
-- Find duplicates
SELECT repo_name, COUNT(*) as count
FROM mcp_tools
GROUP BY repo_name
HAVING COUNT(*) > 1;

-- Remove duplicates (keep most recent)
DELETE FROM mcp_tools
WHERE id NOT IN (
  SELECT MAX(id)
  FROM mcp_tools
  GROUP BY repo_name
);
```

### Hypothesis 4: Recently Updated Tools

**Pattern:**
- Tools updated in last 30 days
- Google hasn't re-crawled yet
- Old canonical vs new canonical mismatch

**Solution:**
- Wait for Google to re-crawl
- Request re-indexing for affected pages

### Hypothesis 5: URL Parameter Variations

**Example:**
```
Accessed URLs:
- /tool/name?ref=twitter
- /tool/name?utm_source=google
- /tool/name

All have same canonical: /tool/name
```

**Why this causes issues:**
- Google sees multiple URLs
- All point to same canonical
- Some marked as alternates

**Solution:**
Already handled by canonical tag (this is correct behavior)

---

## 🛠️ Diagnostic Script

Create a script to analyze the 214 affected pages:

**File:** `scripts/analyze-canonical-issues.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'

async function analyzeCanonicalIssues() {
  // Read affected URLs from file
  const affectedUrls = fs.readFileSync('affected-urls.txt', 'utf-8')
    .split('\n')
    .filter(Boolean)
  
  // Extract tool names
  const toolNames = affectedUrls.map(url => {
    const match = url.match(/\/tool\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  }).filter(Boolean)
  
  console.log(`Analyzing ${toolNames.length} affected tools...`)
  
  const supabase = createClient()
  
  // Get tools from database
  const { data: tools } = await supabase
    .from('mcp_tools')
    .select('*')
    .in('repo_name', toolNames)
  
  // Analyze patterns
  const analysis = {
    total: toolNames.length,
    found_in_db: tools?.length || 0,
    not_found: toolNames.length - (tools?.length || 0),
    patterns: {
      has_special_chars: 0,
      has_uppercase: 0,
      has_spaces: 0,
      has_slash: 0,
      has_at_symbol: 0,
      very_long: 0,
    },
    examples: {
      special_chars: [] as string[],
      uppercase: [] as string[],
      spaces: [] as string[],
    }
  }
  
  toolNames.forEach(name => {
    // Check for special characters
    if (/[^a-zA-Z0-9_-]/.test(name)) {
      analysis.patterns.has_special_chars++
      if (analysis.examples.special_chars.length < 10) {
        analysis.examples.special_chars.push(name)
      }
    }
    
    // Check for uppercase
    if (/[A-Z]/.test(name)) {
      analysis.patterns.has_uppercase++
      if (analysis.examples.uppercase.length < 10) {
        analysis.examples.uppercase.push(name)
      }
    }
    
    // Check for spaces
    if (/ /.test(name)) {
      analysis.patterns.has_spaces++
      if (analysis.examples.spaces.length < 10) {
        analysis.examples.spaces.push(name)
      }
    }
    
    // Check for slash
    if (/\//.test(name)) {
      analysis.patterns.has_slash++
    }
    
    // Check for @ symbol
    if (/@/.test(name)) {
      analysis.patterns.has_at_symbol++
    }
    
    // Check length
    if (name.length > 50) {
      analysis.patterns.very_long++
    }
  })
  
  console.log('\n📊 Analysis Results:')
  console.log('='.repeat(50))
  console.log(`Total affected: ${analysis.total}`)
  console.log(`Found in DB: ${analysis.found_in_db}`)
  console.log(`Not found: ${analysis.not_found}`)
  console.log('\nPatterns detected:')
  console.log(`  Special characters: ${analysis.patterns.has_special_chars}`)
  console.log(`  Uppercase letters: ${analysis.patterns.has_uppercase}`)
  console.log(`  Spaces: ${analysis.patterns.has_spaces}`)
  console.log(`  Slashes: ${analysis.patterns.has_slash}`)
  console.log(`  @ symbols: ${analysis.patterns.has_at_symbol}`)
  console.log(`  Very long names: ${analysis.patterns.very_long}`)
  
  console.log('\n📝 Examples:')
  if (analysis.examples.special_chars.length > 0) {
    console.log('\nSpecial characters:')
    analysis.examples.special_chars.forEach(name => console.log(`  - ${name}`))
  }
  if (analysis.examples.uppercase.length > 0) {
    console.log('\nUppercase letters:')
    analysis.examples.uppercase.forEach(name => console.log(`  - ${name}`))
  }
  if (analysis.examples.spaces.length > 0) {
    console.log('\nSpaces:')
    analysis.examples.spaces.forEach(name => console.log(`  - ${name}`))
  }
  
  // Save detailed report
  fs.writeFileSync('canonical-analysis.json', JSON.stringify(analysis, null, 2))
  console.log('\n✅ Detailed report saved to: canonical-analysis.json')
}

analyzeCanonicalIssues()
```

**Run it:**
```bash
# First, export URLs from Search Console to affected-urls.txt
# Then run:
npx tsx scripts/analyze-canonical-issues.ts
```

---

## 🎯 Most Likely Causes (Ranked)

### 1. Special Characters (90% probability)
Tools with `@`, `/`, spaces, or other special characters in names.

**Quick test:**
```sql
SELECT COUNT(*) 
FROM mcp_tools 
WHERE repo_name ~ '[^a-zA-Z0-9_-]';
```

If this returns ~214, that's your issue!

### 2. Case Sensitivity (70% probability)
Tools with uppercase letters causing URL mismatches.

**Quick test:**
```sql
SELECT COUNT(*) 
FROM mcp_tools 
WHERE repo_name ~ '[A-Z]';
```

### 3. Duplicate Names (30% probability)
Multiple tools with same name.

**Quick test:**
```sql
SELECT COUNT(*) 
FROM (
  SELECT repo_name 
  FROM mcp_tools 
  GROUP BY repo_name 
  HAVING COUNT(*) > 1
) as duplicates;
```

### 4. Recently Updated (20% probability)
Tools updated recently, Google hasn't re-crawled.

**Quick test:**
```sql
SELECT COUNT(*) 
FROM mcp_tools 
WHERE updated_at > NOW() - INTERVAL '30 days';
```

---

## 🚀 Quick Fixes

### Fix 1: Normalize Tool Names on Import

**Add to your tool import script:**
```typescript
function normalizeToolName(name: string): string {
  return name
    .toLowerCase()                    // Convert to lowercase
    .replace(/[^a-z0-9_-]/g, '-')    // Replace special chars with dash
    .replace(/-+/g, '-')              // Remove duplicate dashes
    .replace(/^-|-$/g, '')            // Remove leading/trailing dashes
}

// When importing tools:
const normalizedName = normalizeToolName(githubRepoName)
```

### Fix 2: Add Database Constraint

**Prevent future issues:**
```sql
-- Add check constraint
ALTER TABLE mcp_tools
ADD CONSTRAINT repo_name_format 
CHECK (repo_name ~ '^[a-z0-9_-]+$');

-- Add unique constraint
ALTER TABLE mcp_tools
ADD CONSTRAINT repo_name_unique 
UNIQUE (repo_name);
```

### Fix 3: Batch Update Existing Tools

**Normalize existing tool names:**
```sql
-- Backup first!
CREATE TABLE mcp_tools_backup AS SELECT * FROM mcp_tools;

-- Update to lowercase
UPDATE mcp_tools
SET repo_name = LOWER(repo_name);

-- Replace special characters
UPDATE mcp_tools
SET repo_name = REGEXP_REPLACE(repo_name, '[^a-z0-9_-]', '-', 'g');

-- Remove duplicate dashes
UPDATE mcp_tools
SET repo_name = REGEXP_REPLACE(repo_name, '-+', '-', 'g');
```

---

## 📋 Action Plan

### Immediate Actions (Today)

1. **Export affected URLs from Search Console**
   - Get the list of 214 URLs
   - Save to `affected-urls.txt`

2. **Share the list with me**
   - I'll analyze the patterns
   - Identify the root cause
   - Create specific fixes

3. **Run diagnostic queries**
   ```sql
   -- Check for special characters
   SELECT repo_name FROM mcp_tools 
   WHERE repo_name ~ '[^a-zA-Z0-9_-]' 
   LIMIT 20;
   
   -- Check for uppercase
   SELECT repo_name FROM mcp_tools 
   WHERE repo_name ~ '[A-Z]' 
   LIMIT 20;
   
   -- Check for duplicates
   SELECT repo_name, COUNT(*) 
   FROM mcp_tools 
   GROUP BY repo_name 
   HAVING COUNT(*) > 1;
   ```

### Short-term (This Week)

4. **Implement fixes based on pattern**
   - If special chars: Normalize names
   - If case issues: Convert to lowercase
   - If duplicates: Remove duplicates

5. **Test fixes locally**
   - Verify canonical tags are correct
   - Check URL encoding

6. **Deploy and request re-indexing**
   - Push changes to production
   - Request re-indexing for 214 pages

### Long-term (This Month)

7. **Add validation on import**
   - Normalize tool names automatically
   - Prevent future issues

8. **Monitor Search Console**
   - Track if 214 pages get indexed
   - Watch for new canonical issues

---

## 📊 Expected Timeline

- **Day 1:** Export URLs, identify pattern
- **Day 2:** Implement fixes
- **Day 3:** Deploy and request re-indexing
- **Week 1-2:** Google re-crawls pages
- **Week 3-4:** Pages get indexed
- **Month 1:** All 214 pages indexed

---

## 🔗 Next Steps

**Please provide:**

1. **Export the 214 affected URLs** from Search Console
   - Go to: Indexing → Pages → "Alternative page with proper canonical tag"
   - Click Export
   - Share the CSV or list

2. **Run these SQL queries** and share results:
   ```sql
   -- Count special characters
   SELECT COUNT(*) FROM mcp_tools WHERE repo_name ~ '[^a-zA-Z0-9_-]';
   
   -- Count uppercase
   SELECT COUNT(*) FROM mcp_tools WHERE repo_name ~ '[A-Z]';
   
   -- Count duplicates
   SELECT COUNT(*) FROM (
     SELECT repo_name FROM mcp_tools 
     GROUP BY repo_name HAVING COUNT(*) > 1
   ) as dup;
   ```

3. **Share examples** of affected tool names (5-10 examples)

Then I can:
- ✅ Identify the exact pattern
- ✅ Create targeted fixes
- ✅ Write migration scripts
- ✅ Test the solution

---

**Status:** Awaiting affected URLs list
**Date:** November 4, 2024
**Priority:** High (10.7% of pages not indexed)
