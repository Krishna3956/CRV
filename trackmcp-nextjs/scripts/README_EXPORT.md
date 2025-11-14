# MCP Data Export Script

This script fetches all MCP server data from your Supabase database and GitHub API, then exports it to an Excel file.

## Features

✅ Fetches all MCP tools from Supabase database  
✅ Retrieves README content from GitHub for each repository  
✅ Generates smart meta descriptions  
✅ Handles pagination automatically  
✅ Respects GitHub API rate limits with delays  
✅ Caches README content to avoid duplicate requests  
✅ Exports to formatted Excel file with proper column widths  

## Output File Columns

| Column | Description |
|--------|-------------|
| **Title** | Repository name / MCP server title |
| **Repository URL** | GitHub repository URL |
| **README Content** | Full README markdown content from GitHub |
| **Existing Meta Description** | Current meta description (auto-generated) |
| **Stars** | GitHub star count |
| **Language** | Primary programming language |
| **Topics** | GitHub topics/tags |
| **Category** | MCP tool category |
| **Status** | Approval status (approved/pending) |
| **Description** | Repository description |

## Installation

### 1. Install Python Dependencies

```bash
# Navigate to the scripts directory
cd /Users/krishna/Desktop/CRV-3/trackmcp-nextjs/scripts

# Install required packages
pip install -r requirements.txt
```

Or install individually:

```bash
pip install requests pandas openpyxl python-dotenv
```

### 2. Verify Environment Variables

Make sure your `.env.local` file has the required credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qficcofvzidpvkltjkmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: GitHub token for higher rate limits (5000/hour vs 60/hour)
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here
```

## Usage

### Run the Script

```bash
# From the project root
python scripts/export_mcp_data.py

# Or from the scripts directory
cd scripts
python export_mcp_data.py
```

### Expected Output

```
============================================================
🚀 MCP SERVER DATA EXPORT SCRIPT
============================================================

📥 Fetching MCP tools from Supabase...
   Fetched 50 tools...
   Fetched 100 tools...
   ...
✅ Fetched 500 tools from database

🔄 Processing tools and fetching README files...
   Processing 10/500 tools... (mcp-server-example)
   Processing 20/500 tools... (another-mcp-tool)
   ...

📝 Creating Excel file...
✅ Excel file created successfully!

📁 Location: /Users/krishna/Desktop/CRV-3/trackmcp-nextjs/mcp_page_data.xlsx

============================================================
📊 EXPORT SUMMARY
============================================================
Total tools exported:        500
Tools with README:           450
Tools without README:        50
Average stars:               125
Top language:                TypeScript
Unique categories:           15
============================================================

✨ Done!

📂 Open the file: mcp_page_data.xlsx
```

## Rate Limits

### Without GitHub Token
- **60 requests/hour** (unauthenticated)
- Script will take ~30 minutes for 500 tools

### With GitHub Token
- **5000 requests/hour** (authenticated)
- Script will take ~5 minutes for 500 tools

### How to Get a GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo` (read access to public repositories)
4. Copy the token and add to `.env.local`:
   ```env
   NEXT_PUBLIC_GITHUB_TOKEN=ghp_your_token_here
   ```

## Configuration

You can modify these settings at the top of `export_mcp_data.py`:

```python
BATCH_SIZE = 50          # Tools to fetch per Supabase query
GITHUB_DELAY = 0.5       # Delay between GitHub requests (seconds)
OUTPUT_FILE = "mcp_page_data.xlsx"  # Output filename
```

## Troubleshooting

### Error: Missing Supabase credentials
- Check that `.env.local` exists in the project root
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Error: GitHub API rate limit exceeded
- Add a GitHub token to `.env.local`
- Wait for rate limit to reset (shown in error message)
- Increase `GITHUB_DELAY` to slow down requests

### Error: Module not found
- Run `pip install -r requirements.txt`
- Make sure you're using Python 3.7+

## Output File

The script creates `mcp_page_data.xlsx` in the project root with:
- ✅ Formatted columns with appropriate widths
- ✅ Frozen header row for easy scrolling
- ✅ All data properly escaped and formatted
- ✅ Ready to import into other tools or databases

## Next Steps

After exporting the data, you can:
1. Use it to generate SEO-optimized meta descriptions with AI
2. Analyze README quality and completeness
3. Identify tools missing documentation
4. Create content improvement strategies
5. Import into other tools for further processing
