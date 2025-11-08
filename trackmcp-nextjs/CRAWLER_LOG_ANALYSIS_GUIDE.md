# Crawler Log Analysis Guide - Practical Steps

**Status**: ✅ READY TO USE  
**Date**: 2025-11-08  
**Purpose**: Analyze your actual server logs to identify crawler activity

---

## Step 1: Access Your Logs

### For Vercel Deployment

```bash
# View recent logs
vercel logs

# View logs with filter
vercel logs --follow

# View specific deployment logs
vercel logs <deployment-url>
```

### For Self-Hosted/Local

```bash
# Nginx
tail -f /var/log/nginx/access.log

# Apache
tail -f /var/log/apache2/access.log

# Application logs
tail -f /var/log/app.log
```

---

## Step 2: Extract Crawler Information

### Get All User-Agents

```bash
# Extract unique user-agents
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | sort | uniq

# Count requests by user-agent
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | sort | uniq -c | sort -rn
```

### Get Crawler-Only User-Agents

```bash
# Extract only crawler/bot user-agents
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | \
  grep -i "bot\|crawler\|spider\|agent" | \
  sort | uniq -c | sort -rn
```

### Count by Crawler Type

```bash
# Googlebot
grep "Googlebot" /var/log/nginx/access.log | wc -l

# AdsBot
grep "AdsBot" /var/log/nginx/access.log | wc -l

# Google-Extended
grep "Google-Extended" /var/log/nginx/access.log | wc -l

# Bingbot
grep "Bingbot" /var/log/nginx/access.log | wc -l

# PerplexityBot
grep "PerplexityBot" /var/log/nginx/access.log | wc -l

# GPTBot
grep "GPTBot" /var/log/nginx/access.log | wc -l

# Bad bots
grep -E "MJ12bot|AhrefsBot|SemrushBot|DotBot" /var/log/nginx/access.log | wc -l
```

---

## Step 3: Analyze Crawl Patterns

### Get Crawl Times

```bash
# Show when Googlebot crawled
grep "Googlebot" /var/log/nginx/access.log | cut -d'[' -f2 | cut -d']' -f1 | sort

# Show crawl times by hour
grep "Googlebot" /var/log/nginx/access.log | cut -d'[' -f2 | cut -d':' -f2 | sort | uniq -c
```

### Get Most Crawled Paths

```bash
# Show all paths crawled by Googlebot
grep "Googlebot" /var/log/nginx/access.log | grep "GET" | awk '{print $7}' | sort | uniq -c | sort -rn

# Show paths crawled by all bots
grep -i "bot\|crawler" /var/log/nginx/access.log | grep "GET" | awk '{print $7}' | sort | uniq -c | sort -rn | head -20
```

### Get Response Codes

```bash
# Show response codes for Googlebot
grep "Googlebot" /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c

# Show 404s from bots
grep -i "bot\|crawler" /var/log/nginx/access.log | grep " 404 " | head -20
```

---

## Step 4: Verify Bot Identity

### Reverse DNS Lookup

```bash
# Get IP addresses from logs
grep "Googlebot" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq

# Verify IP is Google
nslookup 66.249.64.0
# Should return: crawl-66-249-64-0.googlebot.com

# Verify multiple IPs
for ip in $(grep "Googlebot" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq); do
  echo "IP: $ip"
  nslookup $ip | grep "name ="
done
```

### Check Google IP Ranges

```bash
# Download Google IP ranges
curl -s https://www.gstatic.com/ipranges/goog.json | jq '.prefixes[] | select(.ipv4Prefix) | .ipv4Prefix' > google_ips.txt

# Check if IP is in Google ranges
IP="66.249.64.0"
grep -q "$IP" google_ips.txt && echo "Valid Google IP" || echo "Not Google IP"
```

---

## Step 5: Create Analysis Report

### Create Analysis Script

```bash
#!/bin/bash
# analyze_crawlers.sh

LOG_FILE="/var/log/nginx/access.log"
REPORT_FILE="crawler_report_$(date +%Y%m%d_%H%M%S).txt"

echo "=== Crawler Activity Report ===" > $REPORT_FILE
echo "Generated: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "=== Summary ===" >> $REPORT_FILE
echo "Total requests: $(wc -l < $LOG_FILE)" >> $REPORT_FILE
echo "Unique IPs: $(awk '{print $1}' $LOG_FILE | sort | uniq | wc -l)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "=== Crawler Requests ===" >> $REPORT_FILE
echo "Googlebot: $(grep "Googlebot" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "AdsBot: $(grep "AdsBot" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Google-Extended: $(grep "Google-Extended" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Bingbot: $(grep "Bingbot" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "PerplexityBot: $(grep "PerplexityBot" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "GPTBot: $(grep "GPTBot" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Claude-Web: $(grep "Claude-Web" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "Bad Bots: $(grep -E "MJ12bot|AhrefsBot|SemrushBot|DotBot" $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "=== Response Codes ===" >> $REPORT_FILE
echo "200 OK: $(grep " 200 " $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "301 Redirect: $(grep " 301 " $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "302 Redirect: $(grep " 302 " $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "404 Not Found: $(grep " 404 " $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "500 Error: $(grep " 500 " $LOG_FILE | wc -l)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "=== Top Crawled Paths ===" >> $REPORT_FILE
grep -i "bot\|crawler" $LOG_FILE | grep "GET" | awk '{print $7}' | sort | uniq -c | sort -rn | head -20 >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "=== 404 Errors from Bots ===" >> $REPORT_FILE
grep -i "bot\|crawler" $LOG_FILE | grep " 404 " | awk '{print $7}' | sort | uniq -c | sort -rn | head -20 >> $REPORT_FILE

echo "Report saved to: $REPORT_FILE"
cat $REPORT_FILE
```

### Run Analysis

```bash
chmod +x analyze_crawlers.sh
./analyze_crawlers.sh
```

---

## Step 6: Identify Issues

### Check for Bad Bots

```bash
# Find bad bot requests
grep -E "MJ12bot|AhrefsBot|SemrushBot|DotBot" /var/log/nginx/access.log | head -20

# Count bad bot requests by IP
grep -E "MJ12bot|AhrefsBot|SemrushBot|DotBot" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn
```

### Check for 404s from Bots

```bash
# Find 404s from bots
grep -i "bot\|crawler" /var/log/nginx/access.log | grep " 404 " | head -20

# Most 404'd paths
grep -i "bot\|crawler" /var/log/nginx/access.log | grep " 404 " | awk '{print $7}' | sort | uniq -c | sort -rn
```

### Check for Slow Responses

```bash
# Find slow responses (> 1 second)
awk '$10 > 1000 {print $0}' /var/log/nginx/access.log | head -20

# Average response time by bot
grep "Googlebot" /var/log/nginx/access.log | awk '{sum+=$10; count++} END {print "Avg: " sum/count "ms"}'
```

---

## Step 7: Monitor Going Forward

### Create Monitoring Script

```bash
#!/bin/bash
# monitor_crawlers.sh

while true; do
  clear
  echo "=== Crawler Activity (Last Hour) ==="
  echo ""
  
  # Get logs from last hour
  SINCE=$(date -d '1 hour ago' '+%d/%b/%Y:%H:%M:%S')
  
  echo "Googlebot requests:"
  grep "Googlebot" /var/log/nginx/access.log | grep "\[$SINCE" | wc -l
  
  echo "AdsBot requests:"
  grep "AdsBot" /var/log/nginx/access.log | grep "\[$SINCE" | wc -l
  
  echo "Bad bot requests:"
  grep -E "MJ12bot|AhrefsBot|SemrushBot" /var/log/nginx/access.log | grep "\[$SINCE" | wc -l
  
  echo "404 errors:"
  grep " 404 " /var/log/nginx/access.log | grep "\[$SINCE" | wc -l
  
  echo ""
  echo "Last updated: $(date)"
  echo "Press Ctrl+C to exit"
  
  sleep 60
done
```

### Run Monitoring

```bash
chmod +x monitor_crawlers.sh
./monitor_crawlers.sh
```

---

## Step 8: Take Action

### Block Bad Bots

Update `/src/app/robots.ts`:

```typescript
// Block aggressive bots
{
  userAgent: 'MJ12bot',
  disallow: '/',
},
{
  userAgent: 'AhrefsBot',
  disallow: '/',
},
{
  userAgent: 'SemrushBot',
  disallow: '/',
},
```

### Rate Limit Crawlers

Update `/next.config.js`:

```javascript
// Add rate limiting headers
{
  source: '/api/:path*',
  headers: [
    {
      key: 'X-RateLimit-Limit',
      value: '100',
    },
    {
      key: 'X-RateLimit-Remaining',
      value: '99',
    },
  ],
},
```

### Fix 404s

Review most 404'd paths and:
1. Create missing pages
2. Add redirects
3. Update internal links
4. Update sitemap

---

## Example Output

### Sample Analysis Report

```
=== Crawler Activity Report ===
Generated: 2025-11-08 12:00:00

=== Summary ===
Total requests: 10,000
Unique IPs: 150

=== Crawler Requests ===
Googlebot: 3,500
AdsBot: 800
Google-Extended: 200
Bingbot: 500
PerplexityBot: 150
GPTBot: 100
Claude-Web: 50
Bad Bots: 0

=== Response Codes ===
200 OK: 8,500
301 Redirect: 500
302 Redirect: 0
404 Not Found: 800
500 Error: 0

=== Top Crawled Paths ===
1. /tool/example-tool (1,200 requests)
2. /category/ai-ml (800 requests)
3. / (600 requests)
4. /top-mcp (400 requests)
5. /new (300 requests)

=== 404 Errors from Bots ===
1. /tool/docs/api.md (150 requests)
2. /path/to/file.py (100 requests)
3. /tool/assets/image.png (80 requests)
```

---

## Interpretation Guide

### Good Signs ✅
- High Googlebot activity
- Low 404 errors
- Consistent crawl patterns
- No bad bot activity
- Fast response times

### Warning Signs ⚠️
- No Googlebot activity (site might not be indexed)
- High 404 errors (broken links)
- Sudden crawl spikes (might indicate issues)
- Bad bot activity (security concern)
- Slow response times (performance issue)

### Action Items
- **High 404s**: Fix broken links
- **Bad bots**: Block in robots.txt
- **Slow responses**: Optimize server
- **No Googlebot**: Submit to Google Search Console
- **Crawl spikes**: Check for redirect loops

---

## Summary

1. **Access logs** via Vercel or server
2. **Extract crawlers** by user-agent
3. **Analyze patterns** (times, paths, codes)
4. **Verify identity** with reverse DNS
5. **Create report** with analysis script
6. **Identify issues** (404s, bad bots)
7. **Monitor** ongoing activity
8. **Take action** (block, fix, optimize)

---

**Status**: ✅ READY TO USE

**Last Updated**: 2025-11-08  
**Version**: 1.0
