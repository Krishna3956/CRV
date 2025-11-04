# Bulk MCP Server Submission Guide

This guide explains how to use the bulk submission script to automatically submit multiple MCP servers to your database.

## Prerequisites

1. **Environment Variables**: Make sure you have the following in your `.env` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Optional but recommended for higher rate limits:
   GITHUB_TOKEN=your_github_personal_access_token
   # Optional for admin operations:
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Install tsx** (if not already installed):
   ```bash
   npm install -g tsx
   # or use npx (no installation needed)
   ```

## Quick Start

### 1. Create Your Input File

Create a JSON file with the GitHub URLs you want to submit. Two formats are supported:

**Format 1: Simple Array**
```json
[
  "https://github.com/owner1/repo1",
  "https://github.com/owner2/repo2",
  "https://github.com/owner3/repo3"
]
```

**Format 2: Object with URLs Array** (Recommended)
```json
{
  "urls": [
    "https://github.com/owner1/repo1",
    "https://github.com/owner2/repo2",
    "https://github.com/owner3/repo3"
  ]
}
```

Save this file as `scripts/mcp-servers-to-submit.json` or any name you prefer.

### 2. Run the Script

```bash
npx tsx scripts/bulk-submit-mcp-servers.ts scripts/mcp-servers-to-submit.json
```

### 3. Review the Output

The script will:
- Process URLs in batches of 5 (configurable)
- Show real-time progress for each URL
- Display a summary at the end with statistics

## Example Output

```
🚀 Bulk MCP Server Submission Script
============================================================
📁 Reading input file: scripts/mcp-servers-to-submit.json
📝 Found 10 URLs to process
✅ GitHub token detected (higher rate limits)

📦 Processing batch 1/2 (5 URLs)...
✅ https://github.com/owner1/repo1 (repo1): Successfully submitted
⚠️ https://github.com/owner2/repo2 (repo2): Already exists in database
✅ https://github.com/owner3/repo3 (repo3): Successfully submitted
❌ https://github.com/owner4/repo4: Repository not found
🚫 https://github.com/punkpeye/awesome-mcp-servers: Repository is banned from submission

⏳ Waiting 2s before next batch...

📦 Processing batch 2/2 (5 URLs)...
...

============================================================
📊 SUBMISSION SUMMARY
============================================================
Total URLs processed:  10
✅ Successfully added:  6
⚠️  Already existed:     2
🚫 Banned repos:        1
❌ Errors:              1
============================================================

✨ Done!
```

## Status Indicators

- ✅ **Success**: Repository was successfully added to the database
- ⚠️ **Duplicate**: Repository already exists in the database (skipped)
- 🚫 **Banned**: Repository is on the banned list (skipped)
- ❌ **Error**: Failed to submit (see error message for details)

## Configuration

You can modify these settings in the script:

```typescript
const BATCH_SIZE = 5 // Number of concurrent requests
const DELAY_BETWEEN_BATCHES = 2000 // 2 seconds delay between batches
```

## Rate Limiting

### Without GitHub Token
- **Limit**: 60 requests per hour
- **Recommendation**: Submit in small batches

### With GitHub Token
- **Limit**: 5,000 requests per hour
- **How to get**: Create a Personal Access Token at https://github.com/settings/tokens
- **Permissions needed**: `public_repo` (read-only access to public repositories)

## Troubleshooting

### "GitHub API rate limit exceeded"
**Solution**: Add a `GITHUB_TOKEN` to your `.env` file or wait for the rate limit to reset.

### "Missing Supabase credentials"
**Solution**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in your `.env` file.

### "Repository not found"
**Possible causes**:
- URL is incorrect or typo in the repository name
- Repository is private
- Repository has been deleted

### "Repository is banned from submission"
**Explanation**: Some repositories (like awesome-lists) are intentionally blocked from submission.

## Advanced Usage

### Submit from Multiple Files

```bash
# Submit from multiple files
npx tsx scripts/bulk-submit-mcp-servers.ts file1.json
npx tsx scripts/bulk-submit-mcp-servers.ts file2.json
npx tsx scripts/bulk-submit-mcp-servers.ts file3.json
```

### Dry Run (Test Mode)

To test without actually submitting, you can modify the script to comment out the database insert:

```typescript
// const { error } = await supabase.from('mcp_tools').insert({
//   ...
// })
```

### Custom Batch Processing

For very large lists (100+ URLs), consider:
1. Splitting into multiple files
2. Increasing `DELAY_BETWEEN_BATCHES` to 5000ms (5 seconds)
3. Running during off-peak hours

## Best Practices

1. **Validate URLs First**: Ensure all URLs are valid GitHub repository URLs
2. **Remove Duplicates**: Check for duplicate URLs in your input file
3. **Use GitHub Token**: Always use a GitHub token for better rate limits
4. **Monitor Progress**: Watch the output for any errors
5. **Keep Records**: Save the output logs for reference

## Example Workflow

1. **Collect URLs**: Gather all GitHub URLs you want to submit
2. **Create JSON File**: Format them into a JSON file
3. **Test with Small Batch**: Start with 5-10 URLs to test
4. **Run Full Batch**: Once confirmed working, run the full list
5. **Review Results**: Check the summary and handle any errors
6. **Verify in Database**: Confirm submissions in your Supabase dashboard

## Support

If you encounter issues:
1. Check the error messages in the output
2. Verify your environment variables
3. Ensure GitHub URLs are valid and public
4. Check GitHub API rate limits
5. Review Supabase logs for database errors

## Script Location

- **Script**: `scripts/bulk-submit-mcp-servers.ts`
- **Sample Input**: `scripts/mcp-servers-to-submit.json`
- **Documentation**: `scripts/BULK-SUBMISSION-GUIDE.md` (this file)
