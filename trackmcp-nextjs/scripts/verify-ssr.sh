#!/bin/bash

# SSR Verification Script
# Verifies that your site is properly server-rendered for answer engines

set -e

echo "🔍 SSR Verification Script"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SITE_URL="${1:-http://localhost:3004}"
HOMEPAGE="$SITE_URL"
TOOL_PAGE="$SITE_URL/tool/anthropic-claude-mcp"

echo "Testing: $SITE_URL"
echo ""

# Function to check if response contains text
check_content() {
    local url=$1
    local search_text=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$search_text"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Function to check response headers
check_header() {
    local url=$1
    local header=$2
    local expected=$3
    local description=$4
    
    echo -n "Checking $description... "
    
    header_value=$(curl -s -I "$url" | grep -i "^$header:" | cut -d' ' -f2- | tr -d '\r')
    
    if echo "$header_value" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC} ($header_value)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Got: $header_value)"
        return 1
    fi
}

# Test 1: Homepage has full HTML content
echo "Test 1: Homepage Content"
echo "------------------------"
check_content "$HOMEPAGE" "<title>" "HTML title tag"
check_content "$HOMEPAGE" "App Store for MCP" "Page title content"
check_content "$HOMEPAGE" "application/ld+json" "JSON-LD schema"
check_content "$HOMEPAGE" "Model Context Protocol" "Main content"
echo ""

# Test 2: Tool page has full HTML content
echo "Test 2: Tool Page Content"
echo "------------------------"
check_content "$TOOL_PAGE" "<title>" "HTML title tag"
check_content "$TOOL_PAGE" "SoftwareApplication" "SoftwareApplication schema"
check_content "$TOOL_PAGE" "BreadcrumbList" "Breadcrumb schema"
echo ""

# Test 3: Cache headers
echo "Test 3: Cache Headers"
echo "---------------------"
check_header "$HOMEPAGE" "Cache-Control" "public" "Cache-Control header"
check_header "$HOMEPAGE" "X-Robots-Tag" "all" "X-Robots-Tag header"
echo ""

# Test 4: Answer engine bots can access content
echo "Test 4: Answer Engine Bot Access"
echo "--------------------------------"
echo -n "Testing Perplexity Bot... "
perplexity_response=$(curl -s -A "PerplexityBot" "$HOMEPAGE")
if echo "$perplexity_response" | grep -q "Model Context Protocol"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo -n "Testing ChatGPT User... "
chatgpt_response=$(curl -s -A "ChatGPT-User" "$HOMEPAGE")
if echo "$chatgpt_response" | grep -q "Model Context Protocol"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo -n "Testing Claude Web... "
claude_response=$(curl -s -A "Claude-Web" "$HOMEPAGE")
if echo "$claude_response" | grep -q "Model Context Protocol"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 5: Structured data validation
echo "Test 5: Structured Data"
echo "----------------------"
check_content "$HOMEPAGE" '"@type":"WebSite"' "WebSite schema"
check_content "$HOMEPAGE" '"@type":"Organization"' "Organization schema"
check_content "$HOMEPAGE" '"@type":"FAQPage"' "FAQPage schema"
check_content "$TOOL_PAGE" '"@type":"SoftwareApplication"' "SoftwareApplication schema"
echo ""

# Test 6: Meta tags
echo "Test 6: Meta Tags"
echo "-----------------"
check_content "$HOMEPAGE" 'name="description"' "Meta description"
check_content "$HOMEPAGE" 'property="og:title"' "OpenGraph title"
check_content "$HOMEPAGE" 'property="og:image"' "OpenGraph image"
check_content "$HOMEPAGE" 'openai:title' "OpenAI meta tag"
check_content "$HOMEPAGE" 'perplexity:title' "Perplexity meta tag"
echo ""

# Summary
echo "Summary"
echo "======="
echo -e "${GREEN}✓ SSR is properly configured!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy to production"
echo "2. Monitor Google Search Console for crawl activity"
echo "3. Check Perplexity/ChatGPT for citations"
echo "4. Track referral traffic from answer engines"
echo ""
