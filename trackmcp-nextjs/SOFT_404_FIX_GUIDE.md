# Soft 404 Fix Guide - Google Search Console Issues

**Date**: 2025-11-14  
**Issue**: Soft 404 errors on tool pages  
**Status**: Analysis & Solution  

---

## 🔍 PROBLEM ANALYSIS

### **What is a Soft 404?**
A soft 404 is when a page returns HTTP 200 (success) but the content indicates the page doesn't exist. Google sees this as a soft 404 and marks it as a crawl issue.

### **Affected Pages** (19 total):
```
markdown-pdf
shopify_python_api
limitless-api-examples
README_ZH.md
msgraph-sdk-python
stable-diffusion.cpp
files-mock-server
underdoc-python-sdk
example-crud
seta-apex-docs-example
ai-pdf-chatbot-langchain
transformerbeeclient.py
rust-rpc-router
biothings_client.py
AI-Connector-for-Revit
descope-mcp-server-stdio
cosense-mcp-server
mcp-accessibility-scanner
microcms-mcp-server
```

### **Root Causes**:
1. **Tools exist in database but have missing/invalid data**
   - No GitHub URL
   - No repo name
   - Invalid repository
   - Deleted repository

2. **Tools are being indexed by Google**
   - Sitemap includes them
   - Backlinks point to them
   - Google crawled them before they were removed

3. **Page returns 200 but shows 404 content**
   - `notFound()` is called in page.tsx
   - But Google sees HTTP 200 (soft 404)

---

## ✅ SOLUTION APPROACH

### **Step 1: Identify Invalid Tools**
These tools need to be checked in the database:
- Do they have valid `repo_name`?
- Do they have valid `github_url`?
- Can the GitHub URL be accessed?
- Are they marked as `status = 'approved'`?

### **Step 2: Remove Invalid Tools from Database**
For tools with:
- ❌ Missing `repo_name`
- ❌ Missing `github_url`
- ❌ Invalid GitHub URLs
- ❌ Deleted repositories

**Action**: Delete from `mcp_tools` table or mark as `status = 'rejected'`

### **Step 3: Add to Blocked Repos List**
Update `/src/components/home-client.tsx` to block these tools:

```typescript
const blockedRepos = useMemo(() => [
  // ... existing blocked repos ...
  'markdown-pdf',
  'shopify_python_api',
  'limitless-api-examples',
  'README_ZH.md',
  'msgraph-sdk-python',
  'stable-diffusion.cpp',
  'files-mock-server',
  'underdoc-python-sdk',
  'example-crud',
  'seta-apex-docs-example',
  'ai-pdf-chatbot-langchain',
  'transformerbeeclient.py',
  'rust-rpc-router',
  'biothings_client.py',
  'AI-Connector-for-Revit',
  'descope-mcp-server-stdio',
  'cosense-mcp-server',
  'mcp-accessibility-scanner',
  'microcms-mcp-server',
], [])
```

### **Step 4: Ensure Proper 404 Handling**
The code already handles this correctly:
```typescript
if (!tool) {
  notFound()  // Returns proper 404
}
```

### **Step 5: Update Sitemap**
Ensure sitemap doesn't include these URLs:
- Sitemap generation filters by `status = 'approved'`
- If tools are deleted, they won't appear in sitemap
- Google will remove them from index after 90 days

### **Step 6: Submit to Google Search Console**
1. Go to Google Search Console
2. Go to Coverage → Soft 404 errors
3. Click "Validate fix" for each URL
4. Google will re-crawl and verify

---

## 🔧 IMPLEMENTATION STEPS

### **Option A: Delete from Database** (Recommended)
1. Connect to Supabase
2. Delete rows where `repo_name` IN (list of invalid repos)
3. Or mark as `status = 'rejected'`

**SQL**:
```sql
DELETE FROM mcp_tools 
WHERE repo_name IN (
  'markdown-pdf',
  'shopify_python_api',
  'limitless-api-examples',
  'README_ZH.md',
  'msgraph-sdk-python',
  'stable-diffusion.cpp',
  'files-mock-server',
  'underdoc-python-sdk',
  'example-crud',
  'seta-apex-docs-example',
  'ai-pdf-chatbot-langchain',
  'transformerbeeclient.py',
  'rust-rpc-router',
  'biothings_client.py',
  'AI-Connector-for-Revit',
  'descope-mcp-server-stdio',
  'cosense-mcp-server',
  'mcp-accessibility-scanner',
  'microcms-mcp-server'
);
```

### **Option B: Add to Blocked Repos** (Temporary)
1. Update `/src/components/home-client.tsx`
2. Add all 19 repos to `blockedRepos` array
3. Deploy
4. These won't show in UI but will still return 404 on direct access

---

## 📊 EXPECTED OUTCOME

After implementing the fix:
- ✅ Tools deleted from database
- ✅ Sitemap no longer includes them
- ✅ Direct access returns proper 404 (not soft 404)
- ✅ Google removes from index
- ✅ Search Console shows 0 soft 404 errors

---

## ⏱️ TIMELINE

1. **Immediate**: Delete/block invalid tools
2. **1-7 days**: Google re-crawls and updates index
3. **7-30 days**: Soft 404 errors disappear from Search Console
4. **30-90 days**: URLs removed from Google index

---

## 🚀 NEXT STEPS

1. **Verify** which tools are actually invalid
2. **Delete** from database (recommended)
3. **Deploy** changes
4. **Monitor** Google Search Console
5. **Validate** fixes in GSC

---

## 📝 NOTES

- These tools are likely spam/invalid submissions
- Deleting them is the best solution
- Blocking them is a temporary workaround
- Google will eventually remove them from index
- No need to create redirects (they're not valid tools)

---

**Status**: Ready for implementation  
**Recommendation**: Delete from database + deploy  
**Expected Fix Time**: 1-2 weeks (Google re-crawl)
