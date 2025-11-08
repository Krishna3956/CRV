# Crawler Monitoring - Quick Reference

**Status**: ✅ READY TO USE  
**Date**: 2025-11-08

---

## Quick Commands

### View Logs

```bash
# Vercel
vercel logs

# Nginx
tail -f /var/log/nginx/access.log

# Apache
tail -f /var/log/apache2/access.log
```

### Count Crawler Requests

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

### Analyze Crawlers

```bash
# All unique user-agents
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | sort | uniq

# Count by user-agent
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Only bots
grep -oP '(?<=")([^"]+)$' /var/log/nginx/access.log | grep -i "bot\|crawler" | sort | uniq -c | sort -rn
```

### Find Issues

```bash
# 404 errors from bots
grep -i "bot\|crawler" /var/log/nginx/access.log | grep " 404 " | head -20

# Most 404'd paths
grep -i "bot\|crawler" /var/log/nginx/access.log | grep " 404 " | awk '{print $7}' | sort | uniq -c | sort -rn

# Bad bot requests
grep -E "MJ12bot|AhrefsBot|SemrushBot" /var/log/nginx/access.log | head -20

# Slow responses (> 1 second)
awk '$10 > 1000 {print $0}' /var/log/nginx/access.log | head -20
```

### Verify Bot Identity

```bash
# Reverse DNS lookup
nslookup 66.249.64.0
# Should return: crawl-66-249-64-0.googlebot.com

# Get IPs from logs
grep "Googlebot" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq
```

---

## Crawler Types

### Beneficial (Allow)
- **Googlebot** - Google Search
- **AdsBot-Google** - Google Ads
- **Bingbot** - Bing Search
- **PerplexityBot** - Perplexity AI
- **GPTBot** - OpenAI
- **Claude-Web** - Anthropic
- **DuckDuckBot** - DuckDuckGo

### Strategic (Allow for AI Visibility)
- **Google-Extended** - Google AI models
- **OAI-SearchBot** - OpenAI Search
- **anthropic-ai** - Claude training
- **MistralAI-User** - Mistral AI
- **cohere-ai** - Cohere AI

### Archive/Research (Allow)
- **ia_archiver** - Internet Archive
- **CCBot** - Common Crawl

### Social Media (Allow)
- **facebookexternalhit** - Facebook
- **Twitterbot** - Twitter
- **LinkedInBot** - LinkedIn

### Bad/Aggressive (Block)
- **MJ12bot** - Majestic
- **AhrefsBot** - Ahrefs
- **SemrushBot** - Semrush
- **DotBot** - Moz

---

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Good - page served |
| 301 | Moved Permanently | Good - permanent redirect |
| 302 | Moved Temporarily | Okay - temporary redirect |
| 404 | Not Found | Bad - broken link |
| 410 | Gone | Okay - page removed |
| 500 | Server Error | Bad - server issue |
| 503 | Service Unavailable | Bad - server down |

---

## What to Monitor

### Daily
- [ ] Googlebot requests (should be consistent)
- [ ] 404 errors (should be low)
- [ ] Bad bot activity (should be 0)

### Weekly
- [ ] Crawl patterns (should be consistent)
- [ ] Response times (should be stable)
- [ ] Most crawled paths (should make sense)

### Monthly
- [ ] Crawl budget trends (should improve)
- [ ] Indexing coverage (should increase)
- [ ] Rankings (should improve or stay stable)

---

## Quick Fixes

### Too Many 404s
```bash
# Find most 404'd paths
grep " 404 " /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10

# Then:
# 1. Create missing pages
# 2. Add redirects
# 3. Update internal links
# 4. Update sitemap
```

### Bad Bot Activity
```bash
# Find bad bot IPs
grep -E "MJ12bot|AhrefsBot|SemrushBot" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq

# Then:
# 1. Block in robots.txt
# 2. Block in firewall (if needed)
# 3. Monitor for continued activity
```

### Slow Response Times
```bash
# Find slow requests
awk '$10 > 1000 {print $0}' /var/log/nginx/access.log | head -20

# Then:
# 1. Optimize database queries
# 2. Reduce page size
# 3. Add caching
# 4. Use CDN
```

---

## Google Search Console

### Check Crawl Stats
1. Go to Google Search Console
2. Select property
3. Settings → Crawl Stats
4. View:
   - Requests per day
   - Kilobytes downloaded
   - Response time

### Identify Issues
- **High requests**: Duplicate content or redirect loops
- **Low requests**: Crawl budget issues or blocked pages
- **High response time**: Server performance issues

---

## Robots.txt Configuration

### Current (Track MCP)
```
User-agent: *
Allow: /
Disallow: [80+ file types]
```

### Block Bad Bots
```
User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Disallow: /
```

### Rate Limit
```
User-agent: AhrefsBot
Crawl-delay: 10
```

---

## Analysis Script

```bash
#!/bin/bash
echo "Googlebot: $(grep 'Googlebot' /var/log/nginx/access.log | wc -l)"
echo "AdsBot: $(grep 'AdsBot' /var/log/nginx/access.log | wc -l)"
echo "Bingbot: $(grep 'Bingbot' /var/log/nginx/access.log | wc -l)"
echo "Bad bots: $(grep -E 'MJ12bot|AhrefsBot|SemrushBot' /var/log/nginx/access.log | wc -l)"
echo "404 errors: $(grep ' 404 ' /var/log/nginx/access.log | wc -l)"
echo "200 OK: $(grep ' 200 ' /var/log/nginx/access.log | wc -l)"
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| No Googlebot | Site not indexed | Submit to GSC |
| High 404s | Broken links | Fix links |
| Bad bot activity | Security issue | Block in robots.txt |
| Slow responses | Server issue | Optimize server |
| Low crawl rate | Crawl budget issue | Fix redirects/404s |

---

## Summary

1. **Monitor** crawler activity daily
2. **Analyze** patterns and issues
3. **Block** bad bots
4. **Fix** 404 errors
5. **Optimize** server performance
6. **Track** improvements

---

**Status**: ✅ READY TO USE

**Last Updated**: 2025-11-08
