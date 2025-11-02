# Metadata Export Guide

## Overview
Export all meta titles, descriptions, and keywords for every page on your site to a CSV file.

## Quick Start

### 1. Install Dependencies (First Time Only)
```bash
npm install -D tsx
```

### 2. Run the Export
```bash
npm run export-metadata
```

### 3. Find Your File
The CSV file will be created at: `metadata-export.csv`

---

## What Gets Exported

### Columns in CSV:
1. **Page Type** - Homepage or Tool Page
2. **URL** - Full URL of the page
3. **Meta Title** - SEO-optimized title
4. **Meta Description** - SEO-optimized description (150-160 chars)
5. **Meta Keywords** - Comma-separated keywords
6. **Stars** - GitHub star count
7. **Language** - Programming language
8. **Topics** - GitHub topics

### Example Output:
```csv
Page Type,URL,Meta Title,Meta Description,Meta Keywords,Stars,Language,Topics
Homepage,https://www.trackmcp.com,Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers,"Explore the world's largest directory...",MCP; Model Context Protocol; AI tools,,,
Tool Page,https://www.trackmcp.com/tool/awesome-mcp-servers,awesome-mcp-servers - 5234⭐ MCP Tool,"A curated list of MCP servers. ⭐ 5,234 stars.",awesome-mcp-servers; MCP tool; popular MCP tool,5234,TypeScript,"mcp, servers, tools"
```

---

## Use Cases

### 1. SEO Audit
- Review all meta titles and descriptions
- Check for duplicates
- Verify optimal lengths
- Identify missing keywords

### 2. Content Planning
- See which tools need better descriptions
- Identify keyword opportunities
- Plan content improvements

### 3. Reporting
- Share with stakeholders
- Track SEO improvements over time
- Compare before/after changes

### 4. Bulk Analysis
- Import into Excel/Google Sheets
- Create pivot tables
- Analyze by language, stars, topics
- Find patterns and opportunities

---

## Advanced Usage

### Filter by Stars
Edit `scripts/export-metadata.ts` and add a filter:

```typescript
const { data, error } = await supabase
  .from('mcp_tools')
  .select('*')
  .gte('stars', 100) // Only tools with 100+ stars
  .order('stars', { ascending: false })
```

### Export Specific Fields
Modify the metadata object to include/exclude fields:

```typescript
metadata.push({
  'URL': `https://www.trackmcp.com/tool/${tool.repo_name}`,
  'Title': smartTitle,
  'Description': smartDescription,
  // Add custom fields here
  'GitHub URL': tool.github_url,
  'Last Updated': tool.last_updated,
})
```

### Export to JSON
Change the output format:

```typescript
// Instead of CSV
const json = JSON.stringify(metadata, null, 2)
writeFileSync('metadata-export.json', json, 'utf-8')
```

---

## Analysis Tips

### In Excel/Google Sheets:

#### 1. Check Title Lengths
```excel
=LEN(C2)  // Column C = Meta Title
```
Ideal: 50-60 characters

#### 2. Check Description Lengths
```excel
=LEN(D2)  // Column D = Meta Description
```
Ideal: 150-160 characters

#### 3. Find Duplicates
```excel
=COUNTIF(C:C, C2) > 1  // Check if title appears more than once
```

#### 4. Analyze by Language
Create a pivot table:
- Rows: Language
- Values: Count of URLs
- See which languages have most tools

#### 5. Analyze by Stars
Create ranges:
- 0-100 stars
- 100-1000 stars
- 1000+ stars

---

## Troubleshooting

### Error: "tsx not found"
```bash
npm install -D tsx
```

### Error: "Cannot find module"
Make sure you're in the project directory:
```bash
cd /path/to/trackmcp-nextjs
npm run export-metadata
```

### Error: "Supabase connection failed"
Check your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Empty CSV File
- Check database connection
- Verify tools exist in database
- Check console for errors

---

## Automation

### Schedule Regular Exports

#### Option 1: Cron Job (Linux/Mac)
```bash
# Run every Monday at 9am
0 9 * * 1 cd /path/to/project && npm run export-metadata
```

#### Option 2: GitHub Actions
```yaml
# .github/workflows/export-metadata.yml
name: Export Metadata
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
  workflow_dispatch:  # Manual trigger

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run export-metadata
      - uses: actions/upload-artifact@v3
        with:
          name: metadata-export
          path: metadata-export.csv
```

---

## Performance

### Export Speed:
- **100 tools**: ~2 seconds
- **1,000 tools**: ~10 seconds
- **10,000 tools**: ~60 seconds

### File Size:
- **100 tools**: ~50 KB
- **1,000 tools**: ~500 KB
- **10,000 tools**: ~5 MB

---

## Next Steps

After exporting:

1. **Open in Excel/Google Sheets**
2. **Sort by Stars** (highest first)
3. **Review Top 100 Tools** - Ensure they have great metadata
4. **Check for Duplicates** - Fix any duplicate titles
5. **Verify Lengths** - Ensure titles are 50-60 chars, descriptions 150-160 chars
6. **Identify Improvements** - Find tools with weak descriptions
7. **Track Changes** - Export regularly to see improvements

---

## Example Analysis Queries

### Find Tools with Short Descriptions
```sql
SELECT repo_name, description 
FROM metadata 
WHERE LENGTH(description) < 100
ORDER BY stars DESC
```

### Find Most Popular Languages
```sql
SELECT language, COUNT(*) as count
FROM metadata
GROUP BY language
ORDER BY count DESC
```

### Find Tools Missing Keywords
```sql
SELECT repo_name, keywords
FROM metadata
WHERE keywords NOT LIKE '%MCP%'
```

---

## Support

If you need help:
1. Check the error message
2. Verify environment variables
3. Check database connection
4. Review the script code

Happy analyzing! 📊
