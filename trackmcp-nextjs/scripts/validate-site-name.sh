#!/bin/bash

# Site Name Validation Script
# This script validates that all required elements for Google site name are present

echo "🔍 Validating Site Name Setup for Track MCP"
echo "=============================================="
echo ""

BASE_URL="https://www.trackmcp.com"
HOMEPAGE="$BASE_URL/"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a string exists in HTML
check_html_content() {
    local url=$1
    local search_string=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    if curl -s "$url" | grep -q "$search_string"; then
        echo -e "${GREEN}✓ Found${NC}"
        return 0
    else
        echo -e "${RED}✗ Not Found${NC}"
        return 1
    fi
}

# Function to validate JSON-LD schema
validate_schema() {
    local url=$1
    local schema_type=$2
    
    echo -n "Validating $schema_type schema... "
    
    html=$(curl -s "$url")
    
    if echo "$html" | grep -q "\"@type\":\"$schema_type\""; then
        if echo "$html" | grep -q "\"name\":\"Track MCP\""; then
            echo -e "${GREEN}✓ Valid${NC}"
            return 0
        else
            echo -e "${RED}✗ Schema found but name is not 'Track MCP'${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Schema not found${NC}"
        return 1
    fi
}

echo "📋 Step 1: Checking Homepage ($HOMEPAGE)"
echo "----------------------------------------"

# Check WebSite Schema
validate_schema "$HOMEPAGE" "WebSite"

# Check Organization Schema
validate_schema "$HOMEPAGE" "Organization"

# Check Meta Tags
check_html_content "$HOMEPAGE" "og:site_name" "og:site_name meta tag"
check_html_content "$HOMEPAGE" "application-name" "application-name meta tag"
check_html_content "$HOMEPAGE" "apple-mobile-web-app-title" "apple-mobile-web-app-title meta tag"

# Check Title
check_html_content "$HOMEPAGE" "Track MCP" "Track MCP in title"

echo ""
echo "📋 Step 2: Checking Sample Tool Page"
echo "----------------------------------------"

TOOL_URL="$BASE_URL/tool/documcp"

# Check if WebSite schema is inherited
validate_schema "$TOOL_URL" "WebSite"

# Check SoftwareApplication schema
validate_schema "$TOOL_URL" "SoftwareApplication"

echo ""
echo "📋 Step 3: Testing with Google Rich Results"
echo "----------------------------------------"

echo "Opening Google Rich Results Test for homepage..."
echo "URL: https://search.google.com/test/rich-results?url=$HOMEPAGE"
echo ""
echo -e "${YELLOW}Please verify:${NC}"
echo "  ✓ WebSite schema detected"
echo "  ✓ Name is 'Track MCP'"
echo "  ✓ 0 errors"
echo ""

# Open in browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://search.google.com/test/rich-results?url=$HOMEPAGE"
fi

echo "Press Enter to continue..."
read

echo ""
echo "📋 Step 4: Checking Schema.org Validator"
echo "----------------------------------------"

echo "Opening Schema.org Validator..."
echo "URL: https://validator.schema.org/#url=$HOMEPAGE"
echo ""

# Open in browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://validator.schema.org/#url=$HOMEPAGE"
fi

echo "Press Enter to continue..."
read

echo ""
echo "📋 Step 5: Summary"
echo "----------------------------------------"

echo ""
echo -e "${GREEN}✅ Validation Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. If all checks passed, request re-indexing in Google Search Console"
echo "2. Go to: https://search.google.com/search-console"
echo "3. Use URL Inspection tool"
echo "4. Enter: $HOMEPAGE"
echo "5. Click 'Request Indexing'"
echo ""
echo "Timeline:"
echo "  • Week 1-2: Google re-crawls pages"
echo "  • Week 3-4: Site name updates in search results"
echo "  • Week 5+: All pages show 'Track MCP'"
echo ""
echo "Monitor progress:"
echo "  • Search Console → Enhancements → Structured Data"
echo "  • Manual search: site:www.trackmcp.com"
echo ""
echo -e "${YELLOW}📚 For detailed guide, see: GOOGLE-SITE-NAME-FIX.md${NC}"
echo ""
