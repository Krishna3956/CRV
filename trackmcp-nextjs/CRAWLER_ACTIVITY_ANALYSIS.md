# Crawler Activity Analysis & Monitoring Guide

**Status**: ✅ COMPLETE  
**Date**: 2025-11-08  
**Purpose**: Identify and optimize crawl activity from different bot types

---

## Overview

This guide helps you:
1. Identify different crawler types accessing your site
2. Analyze their crawl patterns
3. Optimize for beneficial crawlers
4. Block or rate-limit harmful crawlers

---

## Crawler Types & User-Agents

### Google Crawlers (Beneficial)

#### Primary Search Crawlers
```
Googlebot/2.1 (+http://www.google.com/bot.html)
Googlebot-Image/1.0
Googlebot-Mobile/2.1 (+http://www.google.com/bot.html)
```
**Purpose**: Index pages for Google Search  
**Frequency**: High (depends on crawl budget)  
**Action**: Allow full access

#### Google Specialized Crawlers
```
AdsBot-Google (+http://www.google.com/adsbot.html)
AdsBot-Google-Mobile
Mediapartners-Google
```
**Purpose**: Crawl for ads relevance (AdSense, AdWords)  
**Frequency**: Medium  
**Action**: Allow (if using Google ads)

#### Google AI/ML Crawlers
```
Google-Extended
GoogleOther
GoogleOther-Image
GoogleOther-Video
GoogleAgent-Mariner
Google-CloudVertexBot
CloudVertexBot
```
**Purpose**: Train AI models, vertex AI  
**Frequency**: Low to Medium  
**Action**: Allow (strategic decision for AI visibility)

#### Google Specialized Services
```
Googlebot-News
Googlebot-Video
Googlebot-Shopping
```
**Purpose**: Index for Google News, Videos, Shopping  
**Frequency**: Medium  
**Action**: Allow (if relevant to your content)

### Microsoft Crawlers

```
Bingbot/2.0 (+http://www.bing.com/bingbot.htm)
BingPreview/1.0b
Slurp/3.0 (+http://help.inktomi.com/webmaster/spiders.html)
```
**Purpose**: Index for Bing/Yahoo search  
**Frequency**: Medium  
**Action**: Allow

### AI & Search Crawlers (Beneficial)

```
PerplexityBot/1.0 (+http://www.perplexity.ai)
Perplexity-User
ChatGPT-User
OAI-SearchBot
GPTBot/1.0 (+http://openai.com/gptbot)
Claude-Web
anthropic-ai
MistralAI-User
cohere-ai
YouBot/1.0
PhindBot/1.0
Amazonbot/1.0
Diffbot/1.0
Bytespider/1.0
```
**Purpose**: AI search, model training, content discovery  
**Frequency**: Low to Medium  
**Action**: Allow (strategic for AI visibility)

### Archive & Research Crawlers

```
ia_archiver (+http://archive.org/details/archive.org_bot)
CCBot/2.0 (+http://commoncrawl.org/faq/)
```
**Purpose**: Archive pages, research datasets  
**Frequency**: Low  
**Action**: Allow

### Social Media Crawlers

```
facebookexternalhit/1.1
Twitterbot/1.0
LinkedInBot/1.0
Slurp (Yahoo)
```
**Purpose**: Preview links on social media  
**Frequency**: Low  
**Action**: Allow

### Bad/Aggressive Crawlers (Block)

```
MJ12bot/v1.4.8
AhrefsBot/7.0
SemrushBot/7~bl
DotBot/1.1
```
**Purpose**: SEO tools, aggressive scraping  
**Frequency**: High (problematic)  
**Action**: Block

---

## Analyzing Server Logs

### Finding Your Logs

#### Vercel Deployment
```bash
# View Vercel logs
vercel logs

# Or check Vercel dashboard
https://vercel.com/dashboard → Select Project → Deployments → Logs
```

#### Local/Self-Hosted
```bash
# Nginx logs
tail -f /var/log/nginx/access.log

# Apache logs
tail -f /var/log/apache2/access.log

# Application logs
tail -f /var/log/app.log
```

### Log Format

Typical access log entry:
```
192.168.1.1 - - [08/Nov/2025:12:00:00 +0000] "GET /robots.txt HTTP/1.1" 200 1234 "-" "Googlebot/2.1 (+http://www.google.com/bot.html)"
```

**Components**:
- `192.168.1.1` - IP address
- `GET /robots.txt` - Request method and path
- `200` - HTTP status code
- `1234` - Response size in bytes
- `"Googlebot/2.1..."` - User-Agent string

### Parsing User-Agent

Extract bot type from User-Agent:
```bash
# Count all bots
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Count Googlebot requests
grep "Googlebot" /var/log/nginx/access.log | wc -l

# Count AdsBot requests
grep "AdsBot" /var/log/nginx/access.log | wc -l

# Count all Google crawlers
grep "Google" /var/log/nginx/access.log | wc -l

# Count bad bots
grep -E "MJ12bot|AhrefsBot|SemrushBot|DotBot" /var/log/nginx/access.log | wc -l
```

---

## Google Search Console Insights

### Crawl Stats

**Location**: Google Search Console → Settings → Crawl Stats

**Metrics**:
- **Requests per day**: How many pages Google crawls daily
- **Kilobytes downloaded**: Data transferred
- **Response time**: Average response time

**What to Look For**:
- Sudden spikes in requests (might indicate issues)
- Consistent patterns (normal crawl schedule)
- Response time trends (should be stable)

### Bot Report

**Location**: Google Search Console → Enhancements → Core Web Vitals (or relevant section)

**Shows**:
- Which Googlebots accessed your site
- Crawl patterns
- Any errors encountered

---

## Monitoring Different Crawler Types

### Create Monitoring Script

```bash
#!/bin/bash
# crawler_analysis.sh

echo "=== Crawler Activity Analysis ==="
echo ""

# Count requests by bot type
echo "Bot Type Distribution:"
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | \
  grep -i "bot\|crawler\|spider" | \
  sed 's|/.*||' | \
  sort | uniq -c | sort -rn | head -20

echo ""
echo "=== Google Crawlers ==="
grep "Googlebot" /var/log/nginx/access.log | wc -l
echo "Googlebot requests"

grep "AdsBot" /var/log/nginx/access.log | wc -l
echo "AdsBot requests"

grep "Google-Extended" /var/log/nginx/access.log | wc -l
echo "Google-Extended requests"

echo ""
echo "=== Other Search Engines ==="
grep "Bingbot" /var/log/nginx/access.log | wc -l
echo "Bingbot requests"

grep "DuckDuckBot" /var/log/nginx/access.log | wc -l
echo "DuckDuckBot requests"

echo ""
echo "=== AI Crawlers ==="
grep "PerplexityBot" /var/log/nginx/access.log | wc -l
echo "PerplexityBot requests"

grep "GPTBot" /var/log/nginx/access.log | wc -l
echo "GPTBot requests"

grep "Claude-Web" /var/log/nginx/access.log | wc -l
echo "Claude-Web requests"

echo ""
echo "=== Bad Bots ==="
grep -E "MJ12bot|AhrefsBot|SemrushBot|DotBot" /var/log/nginx/access.log | wc -l
echo "Bad bot requests (should be 0)"
```

### Run Analysis

```bash
chmod +x crawler_analysis.sh
./crawler_analysis.sh
```

---

## Crawler IP Addresses

### Google IP Ranges

Google publishes their IP ranges:
```bash
# Download Google IP ranges
curl https://www.gstatic.com/ipranges/goog.json | jq .

# Check if IP is Google
IP="66.249.64.0"
curl -s https://www.gstatic.com/ipranges/goog.json | \
  jq -r '.prefixes[] | select(.ipv4Prefix) | .ipv4Prefix' | \
  grep -q "$IP" && echo "Google IP" || echo "Not Google IP"
```

### Verify Bot Identity

```bash
# Reverse DNS lookup
nslookup 66.249.64.0

# Should return something like:
# 0.64.249.66.in-addr.arpa name = crawl-66-249-64-0.googlebot.com
```

---

## Robots.txt Configuration for Different Bots

### Current Configuration

Your `/src/app/robots.ts` already has:

```typescript
// Allow all beneficial bots
{
  userAgent: 'Googlebot',
  allow: '/',
  disallow: ['/_next/', '/api/', '/assets/'],
}

// Block bad bots
{
  userAgent: 'MJ12bot',
  disallow: '/',
}
```

### Optimize for Specific Bots

```typescript
// Slow down aggressive crawlers
{
  userAgent: 'AhrefsBot',
  crawlDelay: 10, // 10 seconds between requests
}

// Allow AI crawlers
{
  userAgent: 'GPTBot',
  allow: '/',
}

// Block specific paths for certain bots
{
  userAgent: 'AdsBot-Google',
  disallow: ['/admin/', '/private/'],
}
```

---

## Rate Limiting by Bot Type

### Using Middleware

```typescript
// src/middleware.ts

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Rate limit aggressive bots
  if (userAgent.includes('AhrefsBot') || userAgent.includes('SemrushBot')) {
    // Add rate limiting logic
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  
  // Allow beneficial bots
  if (userAgent.includes('Googlebot') || userAgent.includes('PerplexityBot')) {
    // No rate limiting
  }
  
  return NextResponse.next()
}
```

### Using Nginx

```nginx
# /etc/nginx/conf.d/rate_limit.conf

# Define rate limit zones
limit_req_zone $http_user_agent zone=aggressive:10m rate=1r/s;
limit_req_zone $http_user_agent zone=normal:10m rate=10r/s;

# Apply rate limits
location / {
  # Block bad bots
  if ($http_user_agent ~* (MJ12bot|AhrefsBot|SemrushBot|DotBot)) {
    return 403;
  }
  
  # Rate limit aggressive bots
  if ($http_user_agent ~* (AhrefsBot|SemrushBot)) {
    limit_req zone=aggressive burst=5 nodelay;
  }
  
  # Normal rate limit
  limit_req zone=normal burst=20 nodelay;
  
  proxy_pass http://backend;
}
```

---

## Analyzing Crawl Patterns

### Identify Crawl Behavior

```bash
# Get crawl times
grep "Googlebot" /var/log/nginx/access.log | cut -d'[' -f2 | cut -d']' -f1 | sort | uniq -c

# Get most crawled paths
grep "Googlebot" /var/log/nginx/access.log | grep "GET" | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Get response times for Googlebot
grep "Googlebot" /var/log/nginx/access.log | awk '{print $10}' | sort -n | tail -20
```

### Expected Patterns

**Normal Googlebot Behavior**:
- Crawls during off-peak hours
- Respects robots.txt
- Follows crawl-delay
- Consistent user-agent string
- Verifiable reverse DNS

**Suspicious Behavior**:
- Crawls at all hours (might be fake)
- Ignores robots.txt
- Very fast crawl rate
- Changing user-agent
- No reverse DNS match

---

## Monitoring Dashboard

### Create Monitoring Dashboard

```html
<!-- crawler-dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Crawler Activity Dashboard</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    .metric { display: inline-block; margin: 20px; padding: 20px; border: 1px solid #ccc; }
    .good { color: green; }
    .bad { color: red; }
    .neutral { color: orange; }
  </style>
</head>
<body>
  <h1>Crawler Activity Dashboard</h1>
  
  <div class="metric">
    <h3>Googlebot</h3>
    <p class="good">Requests: <span id="googlebot">0</span></p>
  </div>
  
  <div class="metric">
    <h3>AdsBot</h3>
    <p class="neutral">Requests: <span id="adsbot">0</span></p>
  </div>
  
  <div class="metric">
    <h3>Bad Bots</h3>
    <p class="bad">Requests: <span id="badbots">0</span></p>
  </div>
  
  <div class="metric">
    <h3>AI Crawlers</h3>
    <p class="good">Requests: <span id="aicrawlers">0</span></p>
  </div>
  
  <script>
    // Fetch and update metrics
    async function updateMetrics() {
      // This would call your API endpoint that analyzes logs
      const response = await fetch('/api/crawler-stats');
      const data = await response.json();
      
      document.getElementById('googlebot').textContent = data.googlebot;
      document.getElementById('adsbot').textContent = data.adsbot;
      document.getElementById('badbots').textContent = data.badbots;
      document.getElementById('aicrawlers').textContent = data.aicrawlers;
    }
    
    // Update every 5 minutes
    updateMetrics();
    setInterval(updateMetrics, 5 * 60 * 1000);
  </script>
</body>
</html>
```

---

## Google Search Console Integration

### Check Crawl Stats

1. Go to Google Search Console
2. Select your property
3. Go to Settings → Crawl Stats
4. View:
   - Requests per day
   - Kilobytes downloaded
   - Response time

### Identify Issues

**High crawl rate**:
- Might indicate duplicate content
- Check for redirect loops
- Verify sitemap accuracy

**Low crawl rate**:
- Might indicate crawl budget issues
- Check for 404s
- Verify robots.txt isn't blocking

**High response time**:
- Server might be slow
- Check server resources
- Optimize database queries

---

## Best Practices

### Do's ✅
- ✅ Allow Google crawlers
- ✅ Allow beneficial AI crawlers
- ✅ Monitor crawl patterns
- ✅ Block bad bots
- ✅ Respect crawl-delay in robots.txt
- ✅ Verify bot identity with reverse DNS

### Don'ts ❌
- ❌ Block all bots
- ❌ Block Google crawlers
- ❌ Ignore bad bots
- ❌ Trust user-agent alone
- ❌ Set crawl-delay too high
- ❌ Change robots.txt frequently

---

## Troubleshooting

### Issue: No Googlebot Activity

**Causes**:
- Site is new (needs time to be discovered)
- robots.txt blocks Googlebot
- Site is blocked in Google Search Console
- Server returns 5xx errors

**Solutions**:
1. Check robots.txt allows Googlebot
2. Submit sitemap to Google Search Console
3. Check for server errors
4. Request indexing in Google Search Console

### Issue: Too Much Bot Activity

**Causes**:
- Bad bots crawling site
- Duplicate content (Google crawls more)
- Redirect loops
- Sitemap has too many URLs

**Solutions**:
1. Block bad bots in robots.txt
2. Fix duplicate content
3. Fix redirect loops
4. Audit sitemap

### Issue: Slow Response Times

**Causes**:
- Server overloaded
- Database queries slow
- Large page size
- Too many external requests

**Solutions**:
1. Optimize database queries
2. Reduce page size
3. Cache responses
4. Use CDN

---

## Summary

### Key Takeaways

1. **Identify bots** by User-Agent string
2. **Verify identity** with reverse DNS
3. **Monitor patterns** in server logs
4. **Block bad bots** in robots.txt
5. **Allow beneficial bots** for SEO
6. **Track metrics** in Google Search Console
7. **Optimize** based on crawl patterns

### Next Steps

1. Review your server logs
2. Identify current crawler activity
3. Block bad bots
4. Monitor crawl patterns
5. Optimize based on insights

---

**Status**: ✅ COMPLETE

**Last Updated**: 2025-11-08  
**Version**: 1.0
