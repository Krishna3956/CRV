# Quick Start: Export MCP Data

## ✅ Prerequisites Installed

All Python dependencies are now installed:
- ✅ requests
- ✅ pandas
- ✅ openpyxl
- ✅ python-dotenv

## 🚀 Run the Export Script

### Option 1: From Project Root (Recommended)

```bash
cd /Users/krishna/Desktop/CRV-3/trackmcp-nextjs
python3 scripts/export_mcp_data.py
```

### Option 2: From Scripts Directory

```bash
cd /Users/krishna/Desktop/CRV-3/trackmcp-nextjs/scripts
python3 export_mcp_data.py
```

## 📊 What the Script Does

1. **Connects to Supabase** - Fetches all MCP tools from your database
2. **Fetches README files** - Gets README content from GitHub for each tool
3. **Generates metadata** - Creates SEO-optimized meta descriptions
4. **Exports to Excel** - Saves everything to `mcp_page_data.xlsx`

## 📁 Output File

The script will create: **`mcp_page_data.xlsx`** in the project root

### Columns in the Excel file:
- **Title** - Repository name
- **Repository URL** - GitHub URL
- **README Content** - Full README markdown
- **Existing Meta Description** - Current meta description
- **Stars** - GitHub stars
- **Language** - Programming language
- **Topics** - GitHub topics
- **Category** - MCP category
- **Status** - Approval status
- **Description** - Short description

## ⚡ Performance

### Without GitHub Token
- Rate limit: 60 requests/hour
- Time for 500 tools: ~30 minutes

### With GitHub Token (Recommended)
- Rate limit: 5000 requests/hour  
- Time for 500 tools: ~5 minutes

### Add GitHub Token (Optional)

1. Get token: https://github.com/settings/tokens
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GITHUB_TOKEN=ghp_your_token_here
   ```

## 🎯 Example Output

```
============================================================
🚀 MCP SERVER DATA EXPORT SCRIPT
============================================================

📥 Fetching MCP tools from Supabase...
   Fetched 50 tools...
   Fetched 100 tools...
✅ Fetched 150 tools from database

🔄 Processing tools and fetching README files...
   Processing 10/150 tools... (mcp-server-sqlite)
   Processing 20/150 tools... (mcp-server-postgres)
   ...

📝 Creating Excel file...
✅ Excel file created successfully!

📁 Location: /Users/krishna/Desktop/CRV-3/trackmcp-nextjs/mcp_page_data.xlsx

============================================================
📊 EXPORT SUMMARY
============================================================
Total tools exported:        150
Tools with README:           140
Tools without README:        10
Average stars:               245
Top language:                TypeScript
Unique categories:           12
============================================================

✨ Done!
```

## 🔧 Troubleshooting

### Script won't run?
```bash
# Make sure you're in the right directory
cd /Users/krishna/Desktop/CRV-3/trackmcp-nextjs

# Check Python version (needs 3.7+)
python3 --version

# Reinstall dependencies if needed
pip3 install -r scripts/requirements.txt
```

### Rate limit errors?
- Add a GitHub token to `.env.local`
- Or wait for the rate limit to reset

### Missing .env.local?
- The file should be at: `/Users/krishna/Desktop/CRV-3/trackmcp-nextjs/.env.local`
- It should contain your Supabase credentials

## 📖 Full Documentation

See `scripts/README_EXPORT.md` for complete documentation.
