# How to Submit Your URLs in Bulk

Since you have a very large list of URLs, here's the easiest way to submit them:

## Option 1: Quick Submit (Recommended)

1. **Save your URLs to a text file:**
   - Copy all your GitHub URLs
   - Save them to `scripts/my-urls.txt` (one URL per line)

2. **Run the parser:**
   ```bash
   cd /Users/krishna/Desktop/CRV/trackmcp-nextjs
   python3 scripts/parse-urls.py scripts/my-urls.txt
   ```

3. **Submit them:**
   ```bash
   npm run bulk-submit scripts/bulk-urls-to-submit.json
   ```

## Option 2: Direct Paste

1. **Create the URLs file:**
   ```bash
   cd /Users/krishna/Desktop/CRV/trackmcp-nextjs/scripts
   nano my-urls.txt
   # Paste your URLs, then press Ctrl+X, Y, Enter to save
   ```

2. **Parse and submit:**
   ```bash
   python3 parse-urls.py my-urls.txt
   npm run bulk-submit bulk-urls-to-submit.json
   ```

## Option 3: One-Liner

If your URLs are already in a file:

```bash
cd /Users/krishna/Desktop/CRV/trackmcp-nextjs
python3 scripts/parse-urls.py /path/to/your/urls.txt && npm run bulk-submit scripts/bulk-urls-to-submit.json
```

## What the Script Does

The `parse-urls.py` script will:
- ✅ Extract valid GitHub repository URLs
- ✅ Remove duplicates
- ✅ Clean up `.git` suffixes
- ✅ Remove URL paths (keeps only owner/repo)
- ✅ Create a clean JSON file for submission

## Expected Output

```
✅ Created /Users/krishna/Desktop/CRV/trackmcp-nextjs/scripts/bulk-urls-to-submit.json
📝 Found 1234 unique valid GitHub repository URLs

First 10 URLs:
  1. https://github.com/owner1/repo1
  2. https://github.com/owner2/repo2
  ...
```

Then the bulk submission will process them in batches!

## Tips

- The script handles duplicates automatically
- Invalid URLs are skipped
- URLs with paths (like `/releases` or `/wiki`) are cleaned to just owner/repo
- `.git` suffixes are removed automatically
