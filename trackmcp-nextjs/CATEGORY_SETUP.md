# Category Filter Setup Guide

## Overview
This guide explains how to set up and use the category filtering system for your MCP tools platform.

## Categories
The following categories have been implemented:

1. **Featured** - Manually curated featured tools (currently empty, awaiting your list)
2. **AI & Machine Learning** - AI, LLM, agents, and ML-related tools
3. **Developer Kits** - SDKs, libraries, and development frameworks
4. **Servers & Infrastructure** - Backend servers, databases, and cloud infrastructure
5. **Search & Data Retrieval** - Search engines, indexing, and data retrieval tools
6. **Automation & Productivity** - Workflow automation and productivity tools
7. **Web & Internet Tools** - Web scraping, APIs, and internet-related tools
8. **Communication** - Chat, messaging, and notification tools
9. **File & Data Management** - File handling and data processing tools
10. **Others** - Tools that don't fit into other categories
11. **All** - Shows all tools (sorted by most recent upload)

## Setup Steps

### Step 1: Run Database Migration
First, you need to add the `category` column to your Supabase database.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/add_category_field.sql`
4. Click "Run" to execute the migration

**Option B: Using Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Categorize All Tools
Run the categorization script to automatically assign categories to all your existing tools:

```bash
npx tsx scripts/categorize-tools.ts
```

This script will:
- Fetch all tools from your database
- Analyze each tool's name, description, and topics
- Assign the most appropriate category based on keyword matching
- Update the database with the assigned categories
- Display a summary of the categorization results

**Expected Output:**
```
🚀 Starting tool categorization...
📥 Fetching tools from database...
✅ Fetched 2250 tools
🔄 Categorizing tools...
   Updated 100/2250 tools...
   Updated 200/2250 tools...
   ...
✅ Categorized 2250 tools

📊 Category Distribution:
   AI & Machine Learning: 450 tools
   Developer Kits: 380 tools
   Servers & Infrastructure: 320 tools
   ...
✨ Done!
```

### Step 3: Test the UI
1. Restart your development server if it's running:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. You should see the category filter buttons below the stats section

4. Click on different categories to filter the tools

## How Categorization Works

The categorization script uses keyword matching to assign categories:

- **AI & Machine Learning**: Matches keywords like `ai`, `llm`, `claude`, `gpt`, `agent`, `machine-learning`, etc.
- **Developer Kits**: Matches keywords like `sdk`, `library`, `python`, `typescript`, `javascript`, etc.
- **Servers & Infrastructure**: Matches keywords like `server`, `database`, `cloud`, `aws`, `docker`, etc.
- And so on for each category...

The script counts keyword matches for each category and assigns the category with the highest score. If no keywords match, the tool is assigned to "Others".

## Adding Featured Tools

To add tools to the "Featured" category:

1. Identify the tool IDs you want to feature
2. Update them manually in Supabase:
   ```sql
   UPDATE mcp_tools 
   SET category = 'Featured' 
   WHERE id IN ('tool-id-1', 'tool-id-2', 'tool-id-3');
   ```

Or create a script to manage featured tools programmatically.

## Customizing Categories

### To Add a New Category:

1. Update `scripts/categorize-tools.ts`:
   - Add keywords to the `categoryKeywords` object

2. Update `src/components/CategoryFilter.tsx`:
   - Add the new category to the `CATEGORIES` array

3. Re-run the categorization script:
   ```bash
   npx tsx scripts/categorize-tools.ts
   ```

### To Modify Category Keywords:

1. Edit `scripts/categorize-tools.ts`
2. Update the keywords in the `categoryKeywords` object
3. Re-run the categorization script

## Troubleshooting

### Categories not showing up?
- Ensure you ran the database migration
- Check that the categorization script completed successfully
- Verify the `category` column exists in your `mcp_tools` table

### Tools showing in wrong category?
- Review the keywords in `scripts/categorize-tools.ts`
- Add more specific keywords for better matching
- Re-run the categorization script

### Featured category is empty?
- This is expected! You need to manually assign tools to "Featured"
- Use the SQL query above or create a custom script

## Files Modified/Created

### New Files:
- `supabase/migrations/add_category_field.sql` - Database migration
- `scripts/categorize-tools.ts` - Categorization script
- `src/components/CategoryFilter.tsx` - Category filter UI component
- `CATEGORY_SETUP.md` - This guide

### Modified Files:
- `src/types/database.types.ts` - Added category field to types
- `src/app/page.tsx` - Added category to query
- `src/app/api/tools/route.ts` - Added category to API response
- `src/components/home-client.tsx` - Added category filtering logic

## Next Steps

1. Run the database migration
2. Run the categorization script
3. Test the category filtering in your browser
4. Provide a list of featured tools to populate the "Featured" category
5. Adjust category keywords if needed for better accuracy
