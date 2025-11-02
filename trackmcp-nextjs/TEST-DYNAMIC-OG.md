# Testing Dynamic OG Images

## ✅ Working Platforms (Instant Refresh)

### 1. Facebook Debugger
**URL**: https://developers.facebook.com/tools/debug/

**Steps**:
1. Enter: `https://www.trackmcp.com/tool/awesome-mcp-servers`
2. Click "Scrape Again"
3. See the dynamic image!

### 2. Twitter Card Validator
**URL**: https://cards-dev.twitter.com/validator

**Steps**:
1. Enter any tool URL
2. Click "Preview Card"
3. See the dynamic image!

### 3. LinkedIn Post Inspector
**URL**: https://www.linkedin.com/post-inspector/

**Steps**:
1. Enter tool URL
2. Click "Inspect"
3. See the dynamic image!

### 4. Direct API Test
```bash
# Test the API directly
curl "https://www.trackmcp.com/api/og?tool=awesome-mcp-servers&stars=5234&description=A%20curated%20list"

# Should return image/png
```

---

## ⚠️ WhatsApp Specific Issues

### Problem: Aggressive Caching
WhatsApp caches link previews for **days/weeks** and doesn't provide a way to clear cache.

### Solutions:

#### Option 1: Add Version Parameter (Recommended)
```
https://www.trackmcp.com/tool/awesome-mcp-servers?v=2
```
Change `v=2` to `v=3`, etc. to force new preview.

#### Option 2: Wait 24-48 Hours
WhatsApp cache will eventually expire.

#### Option 3: Test in Fresh Chat
- Delete the old message
- Send link in a NEW chat with someone
- WhatsApp might fetch fresh preview

#### Option 4: Use Different URL Format
If you shared with `www`, try without:
- `https://trackmcp.com/tool/...` (without www)
- Or vice versa

---

## 🧪 Verification Checklist

### Step 1: Verify API Works
```bash
curl -I "https://www.trackmcp.com/api/og?tool=test&stars=100&description=Test"
```
**Expected**: `HTTP/2 200` and `content-type: image/png`

### Step 2: Test with Facebook
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter tool URL
3. Click "Scrape Again"
4. **Expected**: See custom image with tool name and stars

### Step 3: Test with Twitter
1. Go to: https://cards-dev.twitter.com/validator
2. Enter tool URL
3. **Expected**: See custom Twitter card

### Step 4: Check HTML Source
```bash
curl -s "https://www.trackmcp.com/tool/[tool-name]" | grep "og:image"
```
**Expected**: Should show `/api/og?tool=...` URL

---

## 📊 Current Status

### ✅ Working
- API endpoint (`/api/og`) - Returns 200 OK
- Dynamic URL generation in metadata
- Facebook preview
- Twitter preview
- LinkedIn preview

### ⚠️ WhatsApp Issues
- **Cache**: WhatsApp caches aggressively
- **No debug tool**: Can't force refresh
- **Solution**: Use URL parameters or wait

---

## 🎯 Recommended Testing Order

1. **Facebook Debugger** (instant, has refresh)
2. **Twitter Validator** (instant, has refresh)
3. **LinkedIn Inspector** (instant, has refresh)
4. **Slack** (usually updates quickly)
5. **Discord** (usually updates quickly)
6. **WhatsApp** (slowest, no manual refresh)

---

## 💡 Pro Tips

### For WhatsApp:
- Always test with URL parameters first: `?v=1`, `?v=2`, etc.
- Share in a NEW conversation
- Delete old cached messages
- Wait 24-48 hours for cache expiry

### For All Platforms:
- Use Facebook Debugger first (most reliable)
- Check HTML source to verify meta tags
- Test API endpoint directly
- Clear browser cache if testing in browser

---

## 🐛 Troubleshooting

### Issue: "Image not loading"
**Check**:
1. API returns 200: `curl -I https://www.trackmcp.com/api/og?tool=test`
2. Meta tags correct: View page source
3. URL encoding correct: Check for special characters

### Issue: "Showing old image"
**Solution**:
1. Add `?v=1` to URL
2. Use platform's debug/refresh tool
3. Wait for cache expiry

### Issue: "404 error"
**Check**:
1. Tool name is correct
2. Tool exists in database
3. URL encoding is correct

---

## 📝 Example URLs to Test

```
# Popular tools (should work)
https://www.trackmcp.com/tool/mcp-server-sqlite
https://www.trackmcp.com/tool/mcp-server-fetch
https://www.trackmcp.com/tool/mcp-server-filesystem

# With version parameter (for WhatsApp)
https://www.trackmcp.com/tool/mcp-server-sqlite?v=1
https://www.trackmcp.com/tool/mcp-server-fetch?v=1
```

---

## ✅ Success Criteria

Dynamic OG images are working if:
1. ✅ API returns image/png
2. ✅ Facebook shows custom image
3. ✅ Twitter shows custom image
4. ✅ HTML source has `/api/og?tool=...` URL
5. ✅ Each tool has unique image

**Note**: WhatsApp cache is normal behavior and not a bug!
