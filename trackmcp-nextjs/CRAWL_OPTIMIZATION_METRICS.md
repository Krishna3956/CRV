# Crawl Optimization - Metrics & Tracking

**Status**: ✅ READY FOR TRACKING  
**Date**: 2025-11-08  
**Purpose**: Track improvements from crawl optimization

---

## Key Performance Indicators (KPIs)

### KPI 1: 200 OK Response Rate

**Current**: 61%  
**Target**: 80%+  
**Improvement**: +19%

**How to Calculate**:
```bash
TOTAL=$(grep -E ' [0-9]{3} ' /var/log/nginx/access.log | wc -l)
OK=$(grep ' 200 ' /var/log/nginx/access.log | wc -l)
PERCENT=$((OK * 100 / TOTAL))
echo "200 OK Rate: $PERCENT%"
```

**Tracking Timeline**:
- Week 1: Baseline (61%)
- Week 2-4: Monitor (target 70%+)
- Month 2: Verify (target 75%+)
- Month 3: Confirm (target 80%+)

---

### KPI 2: HTML Content Share

**Current**: 56%  
**Target**: 75%+  
**Improvement**: +19%

**How to Calculate**:
```bash
TOTAL=$(grep -E '\.(html|json|pdf|xml|js|css)' /var/log/nginx/access.log | wc -l)
HTML=$(grep -E '\.(html|php)' /var/log/nginx/access.log | wc -l)
PERCENT=$((HTML * 100 / TOTAL))
echo "HTML Share: $PERCENT%"
```

**Tracking Timeline**:
- Week 1: Baseline (56%)
- Week 2-4: Monitor (target 65%+)
- Month 2: Verify (target 70%+)
- Month 3: Confirm (target 75%+)

---

### KPI 3: 302 Redirect Count

**Current**: Unknown (should be 0)  
**Target**: 0  
**Status**: Eliminated

**How to Calculate**:
```bash
grep ' 302 ' /var/log/nginx/access.log | wc -l
```

**Expected**: 0 (all converted to 301)

---

### KPI 4: 404 Error Rate

**Current**: Unknown  
**Target**: <5%  
**Status**: Decreasing

**How to Calculate**:
```bash
TOTAL=$(grep -E ' [0-9]{3} ' /var/log/nginx/access.log | wc -l)
ERRORS=$(grep ' 404 ' /var/log/nginx/access.log | wc -l)
PERCENT=$((ERRORS * 100 / TOTAL))
echo "404 Error Rate: $PERCENT%"
```

**Tracking Timeline**:
- Week 1: Baseline
- Week 2-4: Monitor (should decrease)
- Month 2: Verify (target <5%)
- Month 3: Confirm (target <3%)

---

### KPI 5: Crawl Budget Efficiency

**Current**: ~40% waste  
**Target**: <20% waste  
**Improvement**: 50% reduction

**How to Calculate**:
```bash
# Count valuable requests (HTML, redirects)
VALUABLE=$(grep -E ' (200|301) ' /var/log/nginx/access.log | wc -l)

# Count total requests
TOTAL=$(grep -E ' [0-9]{3} ' /var/log/nginx/access.log | wc -l)

# Calculate efficiency
EFFICIENCY=$((VALUABLE * 100 / TOTAL))
WASTE=$((100 - EFFICIENCY))
echo "Crawl Efficiency: $EFFICIENCY%"
echo "Crawl Waste: $WASTE%"
```

**Tracking Timeline**:
- Week 1: Baseline (~40% waste)
- Week 2-4: Monitor (target 30% waste)
- Month 2: Verify (target 25% waste)
- Month 3: Confirm (target <20% waste)

---

## Detailed Metrics Dashboard

### Weekly Metrics Report

```bash
#!/bin/bash
# weekly_metrics.sh

DATE=$(date +%Y-%m-%d)
REPORT="metrics_$DATE.txt"

echo "=== Crawl Optimization Metrics Report ===" > $REPORT
echo "Date: $DATE" >> $REPORT
echo "Week: $(date +%U)" >> $REPORT
echo "" >> $REPORT

# 1. Response Code Distribution
echo "=== 1. Response Code Distribution ===" >> $REPORT
TOTAL=$(grep -E ' [0-9]{3} ' /var/log/nginx/access.log | wc -l)
OK=$(grep ' 200 ' /var/log/nginx/access.log | wc -l)
REDIRECT301=$(grep ' 301 ' /var/log/nginx/access.log | wc -l)
REDIRECT302=$(grep ' 302 ' /var/log/nginx/access.log | wc -l)
ERROR404=$(grep ' 404 ' /var/log/nginx/access.log | wc -l)
ERROR500=$(grep ' 500 ' /var/log/nginx/access.log | wc -l)

OK_PERCENT=$((OK * 100 / TOTAL))
REDIRECT301_PERCENT=$((REDIRECT301 * 100 / TOTAL))
REDIRECT302_PERCENT=$((REDIRECT302 * 100 / TOTAL))
ERROR404_PERCENT=$((ERROR404 * 100 / TOTAL))
ERROR500_PERCENT=$((ERROR500 * 100 / TOTAL))

echo "Total Requests: $TOTAL" >> $REPORT
echo "200 OK: $OK ($OK_PERCENT%)" >> $REPORT
echo "301 Redirect: $REDIRECT301 ($REDIRECT301_PERCENT%)" >> $REPORT
echo "302 Redirect: $REDIRECT302 ($REDIRECT302_PERCENT%)" >> $REPORT
echo "404 Not Found: $ERROR404 ($ERROR404_PERCENT%)" >> $REPORT
echo "500 Error: $ERROR500 ($ERROR500_PERCENT%)" >> $REPORT
echo "" >> $REPORT

# 2. File Type Distribution
echo "=== 2. File Type Distribution ===" >> $REPORT
HTML=$(grep -E '\.(html|php)' /var/log/nginx/access.log | wc -l)
JSON=$(grep '\.json' /var/log/nginx/access.log | wc -l)
PDF=$(grep '\.pdf' /var/log/nginx/access.log | wc -l)
XML=$(grep '\.xml' /var/log/nginx/access.log | wc -l)
JS=$(grep '\.js' /var/log/nginx/access.log | wc -l)
CSS=$(grep '\.css' /var/log/nginx/access.log | wc -l)
API=$(grep '/api/' /var/log/nginx/access.log | wc -l)

TOTAL_FILES=$((HTML + JSON + PDF + XML + JS + CSS + API))
HTML_PERCENT=$((HTML * 100 / TOTAL_FILES))

echo "HTML: $HTML ($HTML_PERCENT%)" >> $REPORT
echo "JSON: $JSON" >> $REPORT
echo "PDF: $PDF" >> $REPORT
echo "XML: $XML" >> $REPORT
echo "JavaScript: $JS" >> $REPORT
echo "CSS: $CSS" >> $REPORT
echo "API: $API" >> $REPORT
echo "" >> $REPORT

# 3. Crawler Activity
echo "=== 3. Crawler Activity ===" >> $REPORT
GOOGLEBOT=$(grep 'Googlebot' /var/log/nginx/access.log | wc -l)
ADSBOT=$(grep 'AdsBot' /var/log/nginx/access.log | wc -l)
BINGBOT=$(grep 'Bingbot' /var/log/nginx/access.log | wc -l)
BADBOTS=$(grep -E 'MJ12bot|AhrefsBot|SemrushBot' /var/log/nginx/access.log | wc -l)

echo "Googlebot: $GOOGLEBOT" >> $REPORT
echo "AdsBot: $ADSBOT" >> $REPORT
echo "Bingbot: $BINGBOT" >> $REPORT
echo "Bad Bots: $BADBOTS" >> $REPORT
echo "" >> $REPORT

# 4. Top Crawled Paths
echo "=== 4. Top Crawled Paths ===" >> $REPORT
echo "Top 10 paths:" >> $REPORT
grep "GET" /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10 >> $REPORT
echo "" >> $REPORT

# 5. Top 404 Paths
echo "=== 5. Top 404 Paths ===" >> $REPORT
echo "Top 10 404'd paths:" >> $REPORT
grep " 404 " /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10 >> $REPORT

cat $REPORT
```

---

## Google Search Console Metrics

### Coverage Metrics

**Track These**:
1. **Indexed Pages**
   - Target: Increasing
   - Baseline: ___
   - Week 1: ___
   - Week 2: ___
   - Week 3: ___
   - Week 4: ___

2. **Excluded Pages**
   - Target: Increasing (blocked file types)
   - Baseline: ___
   - Week 1: ___
   - Week 2: ___
   - Week 3: ___
   - Week 4: ___

3. **404 Errors**
   - Target: Decreasing
   - Baseline: ___
   - Week 1: ___
   - Week 2: ___
   - Week 3: ___
   - Week 4: ___

### Crawl Stats Metrics

**Track These**:
1. **Requests per Day**
   - Target: Decreasing
   - Baseline: ___
   - Week 1: ___
   - Week 2: ___
   - Week 3: ___
   - Week 4: ___

2. **Kilobytes Downloaded**
   - Target: Decreasing
   - Baseline: ___
   - Week 1: ___
   - Week 2: ___
   - Week 3: ___
   - Week 4: ___

3. **Response Time**
   - Target: Stable or improving
   - Baseline: ___
   - Week 1: ___
   - Week 2: ___
   - Week 3: ___
   - Week 4: ___

---

## Indexing Metrics

### Indexing Speed

**How to Measure**:
1. Submit new page to Google Search Console
2. Record submission date/time
3. Track when indexed
4. Calculate days to index

**Tracking**:
- Page 1: Submitted ___, Indexed ___ (__ days)
- Page 2: Submitted ___, Indexed ___ (__ days)
- Page 3: Submitted ___, Indexed ___ (__ days)

**Target**: 1-2 days (50% improvement from 2-3 days)

### Indexing Coverage

**How to Measure**:
1. Go to Google Search Console
2. Check Coverage report
3. Calculate: Indexed / Total Pages

**Tracking**:
- Baseline: __% indexed
- Week 2: __% indexed
- Week 4: __% indexed
- Month 2: __% indexed

**Target**: 90%+ indexed

---

## Performance Metrics

### Page Load Time

**How to Measure**:
```bash
# Test page load time
time curl -s https://trackmcp.com/tool/example-tool > /dev/null
```

**Tracking**:
- Baseline: ___ seconds
- Week 2: ___ seconds
- Week 4: ___ seconds
- Month 2: ___ seconds

**Target**: Stable or faster

### Server Response Time

**How to Measure**:
```bash
# Get response times from logs
awk '{print $10}' /var/log/nginx/access.log | sort -n | tail -20
```

**Tracking**:
- Baseline: ___ ms average
- Week 2: ___ ms average
- Week 4: ___ ms average
- Month 2: ___ ms average

**Target**: <500ms average

---

## Ranking Metrics

### Keyword Rankings

**Track Top Keywords**:

| Keyword | Baseline | Week 2 | Week 4 | Month 2 | Target |
|---------|----------|--------|--------|---------|--------|
| MCP tools | ___ | ___ | ___ | ___ | Top 10 |
| AI MCP | ___ | ___ | ___ | ___ | Top 10 |
| Tool tracker | ___ | ___ | ___ | ___ | Top 10 |

### Organic Traffic

**How to Measure**:
1. Go to Google Analytics
2. Check Organic Search traffic
3. Compare week-over-week

**Tracking**:
- Baseline: ___ sessions
- Week 2: ___ sessions
- Week 4: ___ sessions
- Month 2: ___ sessions

**Target**: +10-20% increase

---

## Comparison Report Template

### Before vs After

```
METRIC                  BEFORE    AFTER     IMPROVEMENT
200 OK Rate             61%       ___%      +___%
HTML Share              56%       ___%      +___%
302 Redirects           ?         0         -100%
404 Error Rate          ___%      ___%      -___%
Crawl Efficiency        60%       ___%      +___%
Indexed Pages           ___       ___       +___
Crawl Requests/Day      ___       ___       -___
Indexing Speed          2-3 days  __ days   -___%
Organic Traffic         ___       ___       +___%
```

---

## Monthly Review Checklist

### Month 1 Review
- [ ] 200 OK rate improved to 70%+
- [ ] HTML share improved to 65%+
- [ ] No 302 redirects found
- [ ] 404 errors decreased
- [ ] Crawl budget waste reduced
- [ ] Google Search Console shows improvements
- [ ] Indexing speed improved
- [ ] No new issues introduced

### Month 2 Review
- [ ] 200 OK rate improved to 75%+
- [ ] HTML share improved to 70%+
- [ ] Indexed pages increasing
- [ ] Crawl stats showing improvement
- [ ] Organic traffic stable or increasing
- [ ] Rankings stable or improving
- [ ] Server performance stable

### Month 3 Review
- [ ] 200 OK rate reached 80%+
- [ ] HTML share reached 75%+
- [ ] All targets achieved
- [ ] Sustained improvements
- [ ] Plan next optimizations

---

## Summary Dashboard

### Current Status
- **200 OK Rate**: 61% → Target: 80%+ (Progress: __%)
- **HTML Share**: 56% → Target: 75%+ (Progress: __%)
- **Crawl Efficiency**: 60% → Target: 80%+ (Progress: __%)
- **Indexed Pages**: ___ → Target: 90%+ (Progress: __%)
- **Organic Traffic**: ___ → Target: +10-20% (Progress: __%)

### Overall Progress
- **Week 1**: ___% complete
- **Week 2**: ___% complete
- **Week 3**: ___% complete
- **Week 4**: ___% complete
- **Month 2**: ___% complete
- **Month 3**: ___% complete

### Status
- ✅ On Track
- ⚠️ Needs Attention
- ❌ Off Track

---

**Status**: ✅ READY FOR TRACKING

**Last Updated**: 2025-11-08  
**Version**: 1.0
