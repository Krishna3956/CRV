#!/bin/bash

# Quick Submit Script
# Paste your URLs, press Ctrl+D when done, and they'll be submitted automatically

echo "🚀 Quick MCP Server Bulk Submission"
echo "===================================="
echo ""
echo "Paste your GitHub URLs below (one per line)"
echo "Press Ctrl+D when finished"
echo ""

# Read URLs from stdin
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE"

echo ""
echo "📝 Processing URLs..."

# Parse URLs
cd "$(dirname "$0")/.."
python3 scripts/parse-urls.py "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎯 Starting bulk submission..."
    echo ""
    npm run bulk-submit scripts/bulk-urls-to-submit.json
else
    echo "❌ Error parsing URLs"
    exit 1
fi

# Cleanup
rm "$TEMP_FILE"
