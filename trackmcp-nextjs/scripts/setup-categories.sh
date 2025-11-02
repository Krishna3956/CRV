#!/bin/bash

echo "🚀 Category Filter Setup Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Database Migration${NC}"
echo "You need to run the following SQL in your Supabase dashboard:"
echo ""
echo "─────────────────────────────────────────────────────────────"
cat << 'EOF'
-- Add category column to mcp_tools table
ALTER TABLE mcp_tools 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Others';

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_mcp_tools_category ON mcp_tools(category);
EOF
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql"
echo "2. Copy and paste the SQL above"
echo "3. Click 'Run'"
echo ""

read -p "Have you completed the database migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}❌ Please complete the migration first, then run this script again.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Categorizing Tools${NC}"
echo "Running categorization script..."
echo ""

npx tsx scripts/categorize-tools.ts

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Setup Complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart your dev server: npm run dev"
    echo "2. Open http://localhost:3000 in your browser"
    echo "3. Test the category filters below the stats section"
    echo ""
    echo "To add featured tools, see CATEGORY_SETUP.md"
else
    echo ""
    echo -e "${RED}❌ Categorization failed. Please check the error above.${NC}"
    exit 1
fi
