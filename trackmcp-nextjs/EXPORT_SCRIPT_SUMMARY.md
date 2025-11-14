# MCP Data Export Script - Summary

## 📋 What Was Created

### 1. Main Export Script
**File**: `scripts/export_mcp_data.py`

A comprehensive Python script that:
- ✅ Fetches all MCP tools from your Supabase database
- ✅ Retrieves README content from GitHub API for each repository
- ✅ Generates smart SEO meta descriptions
- ✅ Handles pagination automatically
- ✅ Respects GitHub API rate limits with delays
- ✅ Caches README content to avoid duplicate requests
- ✅ Exports everything to a formatted Excel file

### 2. Dependencies File
**File**: `scripts/requirements.txt`

Lists all required Python packages:
- requests (HTTP requests)
- pandas (data manipulation)
- openpyxl (Excel file creation)
- python-dotenv (environment variables)

### 3. Documentation Files
- **`scripts/README_EXPORT.md`** - Complete documentation with all details
- **`RUN_EXPORT.md`** - Quick start guide to run the script
- **`EXPORT_SCRIPT_SUMMARY.md`** - This file

## 🎯 Output File Structure

The script creates **`mcp_page_data.xlsx`** with these columns:

| Column | Description | Example |
|--------|-------------|---------|
| Title | Repository name | "mcp-server-sqlite" |
| Repository URL | GitHub URL | "https://github.com/user/repo" |
| README Content | Full README markdown | "# MCP Server\n\nThis is..." |
| Existing Meta Description | Auto-generated meta | "SQLite MCP server. ⭐ 245 stars..." |
| Stars | GitHub star count | 245 |
| Language | Programming language | "TypeScript" |
| Topics | GitHub topics | "mcp, sqlite, database" |
| Category | MCP category | "Database" |
| Status | Approval status | "approved" |
| Description | Short description | "SQLite database integration" |

## 🚀 How to Run

### Quick Start (Copy & Paste)

```bash
# Navigate to project
cd /Users/krishna/Desktop/CRV-3/trackmcp-nextjs

# Run the script
python3 scripts/export_mcp_data.py
```

That's it! The script will:
1. Read credentials from `.env.local`
2. Fetch all tools from Supabase
3. Get README files from GitHub
4. Create `mcp_page_data.xlsx`

## ⚙️ Configuration

### Environment Variables (Already Set)
Your `.env.local` already has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qficcofvzidpvkltjkmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Optional: GitHub Token (Recommended)
Add to `.env.local` for 5000 requests/hour instead of 60:
```env
NEXT_PUBLIC_GITHUB_TOKEN=ghp_your_token_here
```

Get token at: https://github.com/settings/tokens

### Script Settings
Edit these in `scripts/export_mcp_data.py`:
```python
BATCH_SIZE = 50          # Tools per Supabase query
GITHUB_DELAY = 0.5       # Delay between GitHub requests
OUTPUT_FILE = "mcp_page_data.xlsx"  # Output filename
```

## 📊 Expected Performance

| Scenario | Rate Limit | Time for 500 Tools |
|----------|------------|-------------------|
| Without GitHub token | 60/hour | ~30 minutes |
| With GitHub token | 5000/hour | ~5 minutes |

## ✅ Installation Status

All dependencies are **already installed**:
- ✅ Python 3.12.3
- ✅ requests
- ✅ pandas
- ✅ openpyxl
- ✅ python-dotenv

## 🎨 Features

### Smart Meta Description Generation
The script uses the same logic as your Next.js app:
- Truncates long descriptions (>155 chars)
- Adds context for short descriptions (<120 chars)
- Includes star count for popular tools (>100 stars)
- Adds language info if missing
- Ensures "MCP" is mentioned

### Rate Limit Handling
- Automatic delays between requests (0.5s default)
- Detects rate limit errors
- Shows reset time when limit exceeded
- Caches README content to avoid duplicates

### Excel Formatting
- Proper column widths for readability
- Frozen header row
- All data properly escaped
- Ready for import into other tools

## 📝 Example Usage Scenarios

### 1. Generate AI-Optimized Meta Descriptions
```bash
# Export data
python3 scripts/export_mcp_data.py

# Open mcp_page_data.xlsx
# Use README content + existing meta to generate better descriptions with AI
```

### 2. Analyze Documentation Quality
```bash
# Export data
python3 scripts/export_mcp_data.py

# Filter tools with "No README found"
# Identify tools needing documentation improvements
```

### 3. Content Strategy Planning
```bash
# Export data
python3 scripts/export_mcp_data.py

# Analyze topics, categories, languages
# Plan content expansion based on gaps
```

## 🔧 Customization Examples

### Change Output Format to CSV
Edit `export_mcp_data.py`:
```python
# Change this line:
OUTPUT_FILE = "mcp_page_data.csv"

# And in export_to_excel method, replace Excel writer with:
df.to_csv(output_path, index=False)
```

### Fetch Only High-Star Tools
Edit the Supabase query in `fetch_tools_from_supabase`:
```python
params = {
    'select': '...',
    'status': 'in.(approved,pending)',
    'stars': 'gte.100',  # Add this line
    'order': 'stars.desc',
    ...
}
```

### Add More GitHub Data
Add to `fetch_readme_from_github` method to also fetch:
- Contributors
- Open issues
- Last commit date
- License info

## 📚 Files Created

```
trackmcp-nextjs/
├── scripts/
│   ├── export_mcp_data.py      # Main script (350 lines)
│   ├── requirements.txt         # Dependencies
│   └── README_EXPORT.md        # Full documentation
├── RUN_EXPORT.md               # Quick start guide
└── EXPORT_SCRIPT_SUMMARY.md    # This file
```

## 🎯 Next Steps

1. **Run the script** to test it:
   ```bash
   python3 scripts/export_mcp_data.py
   ```

2. **Open the Excel file** to verify the data:
   ```bash
   open mcp_page_data.xlsx
   ```

3. **Optional: Add GitHub token** for faster exports:
   - Get token: https://github.com/settings/tokens
   - Add to `.env.local`: `NEXT_PUBLIC_GITHUB_TOKEN=your_token`

4. **Use the data** for:
   - AI-powered meta description generation
   - Documentation quality analysis
   - Content strategy planning
   - SEO optimization

## 💡 Pro Tips

1. **First run**: Test with a small dataset by modifying the Supabase query to limit results
2. **GitHub token**: Highly recommended if you have 100+ tools
3. **Caching**: The script caches README content, so re-running is faster
4. **Error handling**: The script continues even if some READMEs fail to fetch
5. **Excel limits**: Excel supports 1M+ rows, so no worries about data size

## 🆘 Support

If you encounter issues:
1. Check `scripts/README_EXPORT.md` for troubleshooting
2. Verify `.env.local` has correct credentials
3. Check Python version: `python3 --version` (needs 3.7+)
4. Reinstall dependencies: `pip3 install -r scripts/requirements.txt`

---

**Ready to export your MCP data!** 🚀

Just run: `python3 scripts/export_mcp_data.py`
