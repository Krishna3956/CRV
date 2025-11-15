#!/bin/bash

# IndexNow Bulk URL Submission Script
# Submits all URLs from sitemap to IndexNow API

HOST="www.trackmcp.com"
KEY="7c6867e98d7a4de8913fd966093b715f"
KEY_LOCATION="https://www.trackmcp.com/7c6867e98d7a4de8913fd966093b715f.txt"
API_ENDPOINT="https://api.indexnow.org/IndexNow"

echo "=== IndexNow Bulk Submission ==="
echo "Host: $HOST"
echo "Key: $KEY"
echo "Key Location: $KEY_LOCATION"
echo ""

# Fetch all URLs from sitemap
echo "Fetching URLs from sitemap..."
curl -s https://www.trackmcp.com/sitemap.xml | grep "<loc>" | sed 's/.*<loc>//;s/<\/loc>.*//' > /tmp/urls.txt

TOTAL_URLS=$(wc -l < /tmp/urls.txt)
echo "Total URLs found: $TOTAL_URLS"
echo ""

# Split URLs into batches (IndexNow allows up to 10,000 URLs per request)
# We'll submit in batches of 5000 to be safe
BATCH_SIZE=5000
BATCH_NUM=1

while IFS= read -r url; do
    # Add URL to batch array
    URLS_BATCH+=("$url")
    
    # If batch is full, submit it
    if [ ${#URLS_BATCH[@]} -eq $BATCH_SIZE ]; then
        echo "Submitting batch $BATCH_NUM (${#URLS_BATCH[@]} URLs)..."
        
        # Create JSON payload
        JSON_PAYLOAD=$(cat <<EOF
{
  "host": "$HOST",
  "key": "$KEY",
  "keyLocation": "$KEY_LOCATION",
  "urlList": [
EOF
        )
        
        # Add URLs to JSON
        for i in "${!URLS_BATCH[@]}"; do
            if [ $i -lt $((${#URLS_BATCH[@]} - 1)) ]; then
                JSON_PAYLOAD+="\"${URLS_BATCH[$i]}\","
            else
                JSON_PAYLOAD+="\"${URLS_BATCH[$i]}\""
            fi
        done
        
        JSON_PAYLOAD+=$(cat <<EOF
  ]
}
EOF
        )
        
        # Submit to IndexNow
        RESPONSE=$(curl -s -X POST "$API_ENDPOINT" \
            -H "Content-Type: application/json; charset=utf-8" \
            -d "$JSON_PAYLOAD")
        
        echo "Response: $RESPONSE"
        echo ""
        
        # Reset batch
        URLS_BATCH=()
        BATCH_NUM=$((BATCH_NUM + 1))
        
        # Rate limiting (1 second between requests)
        sleep 1
    fi
done < /tmp/urls.txt

# Submit remaining URLs
if [ ${#URLS_BATCH[@]} -gt 0 ]; then
    echo "Submitting final batch $BATCH_NUM (${#URLS_BATCH[@]} URLs)..."
    
    # Create JSON payload
    JSON_PAYLOAD=$(cat <<EOF
{
  "host": "$HOST",
  "key": "$KEY",
  "keyLocation": "$KEY_LOCATION",
  "urlList": [
EOF
    )
    
    # Add URLs to JSON
    for i in "${!URLS_BATCH[@]}"; do
        if [ $i -lt $((${#URLS_BATCH[@]} - 1)) ]; then
            JSON_PAYLOAD+="\"${URLS_BATCH[$i]}\","
        else
            JSON_PAYLOAD+="\"${URLS_BATCH[$i]}\""
        fi
    done
    
    JSON_PAYLOAD+=$(cat <<EOF
  ]
}
EOF
    )
    
    # Submit to IndexNow
    RESPONSE=$(curl -s -X POST "$API_ENDPOINT" \
        -H "Content-Type: application/json; charset=utf-8" \
        -d "$JSON_PAYLOAD")
    
    echo "Response: $RESPONSE"
    echo ""
fi

echo "=== Submission Complete ==="
echo "Total batches submitted: $BATCH_NUM"
echo "Total URLs submitted: $TOTAL_URLS"
echo ""
echo "Your URLs are now queued for indexing!"
echo "Check status at: https://www.bing.com/webmasters"
