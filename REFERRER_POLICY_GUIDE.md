# Referrer-Policy Security & Privacy Guide

## 📋 What is Referrer-Policy?

Referrer-Policy is an HTTP header that controls how much referrer information is sent when users navigate away from your site or load resources from other origins.

### The Referer Header:
```
When user clicks link from trackmcp.com to example.com:
Browser sends:
  Referer: https://www.trackmcp.com/search?q=sensitive-query

This reveals:
- Your domain
- The page they came from
- Query parameters (potentially sensitive)
- Full URL path
```

---

## 🔒 Current Configuration

### Recommended Value:
```
Referrer-Policy: strict-origin-when-cross-origin
```

### What It Does:
- ✅ Sends full URL for same-origin requests
- ✅ Sends only origin for cross-origin requests
- ✅ Blocks referrer for HTTP→HTTPS downgrade
- ✅ Balances privacy and functionality
- ✅ Preserves analytics capability

---

## 📊 Referrer-Policy Options

| Policy | Same-Origin | Cross-Origin | HTTP→HTTPS | Use Case |
|--------|-------------|--------------|-----------|----------|
| `no-referrer` | ❌ None | ❌ None | ❌ None | Maximum privacy |
| `no-referrer-when-downgrade` | ✅ Full | ✅ Full | ❌ None | Legacy (outdated) |
| `same-origin` | ✅ Full | ❌ None | ❌ None | Internal only |
| `origin` | ⚠️ Origin | ⚠️ Origin | ⚠️ Origin | Minimal info |
| `origin-when-cross-origin` | ✅ Full | ⚠️ Origin | ✅ Full | Balanced |
| `strict-origin` | ⚠️ Origin | ⚠️ Origin | ❌ None | Privacy-focused |
| `strict-origin-when-cross-origin` | ✅ Full | ⚠️ Origin | ❌ None | **RECOMMENDED** ✅ |
| `unsafe-url` | ✅ Full | ✅ Full | ✅ Full | ❌ NEVER USE |

---

## 🎯 Why `strict-origin-when-cross-origin`?

### Best Balance:
```
✅ Same-origin: Full referrer (needed for analytics)
✅ Cross-origin: Only origin (privacy protection)
✅ Downgrade: No referrer (security)
✅ Analytics: Works properly
✅ Privacy: Protected
```

### Example Scenarios:

#### Scenario 1: Internal Navigation
```
User on: https://www.trackmcp.com/search?q=claude
Clicks link to: https://www.trackmcp.com/tool/claude

Referrer sent: https://www.trackmcp.com/search?q=claude
(Full URL - needed for internal analytics)
```

#### Scenario 2: External Link
```
User on: https://www.trackmcp.com/search?q=sensitive-data
Clicks link to: https://example.com

Referrer sent: https://www.trackmcp.com
(Only origin - privacy protection)
(Query string NOT sent - sensitive data protected)
```

#### Scenario 3: HTTPS→HTTP Downgrade
```
User on: https://www.trackmcp.com
Clicks link to: http://insecure-site.com

Referrer sent: (none)
(No referrer - security protection)
(Prevents HTTPS URLs leaking to HTTP sites)
```

---

## 🔍 Referrer Information Leakage

### What Can Be Leaked:

#### 1. Query Parameters
```
URL: https://www.trackmcp.com/search?q=medical-condition
Referrer: https://www.trackmcp.com/search?q=medical-condition
Leaked: Medical condition (privacy issue!)
```

#### 2. Internal Paths
```
URL: https://www.trackmcp.com/admin/users/delete
Referrer: https://www.trackmcp.com/admin/users/delete
Leaked: Admin panel exists (security issue!)
```

#### 3. Session Tokens
```
URL: https://www.trackmcp.com/account?token=abc123xyz
Referrer: https://www.trackmcp.com/account?token=abc123xyz
Leaked: Session token (security issue!)
```

#### 4. User IDs
```
URL: https://www.trackmcp.com/user/12345/profile
Referrer: https://www.trackmcp.com/user/12345/profile
Leaked: User ID (privacy issue!)
```

### Protection with `strict-origin-when-cross-origin`:
```
URL: https://www.trackmcp.com/search?q=medical-condition
External link to: https://example.com

Referrer sent: https://www.trackmcp.com
(Query string removed - protected!)
(Only domain sent - safe!)
```

---

## 🛡️ Privacy vs Analytics Trade-off

### Maximum Privacy (`no-referrer`):
```
Referrer-Policy: no-referrer
```

**Pros:**
- ✅ Maximum privacy
- ✅ No information leaked
- ✅ Protects sensitive queries

**Cons:**
- ❌ Breaks referral analytics
- ❌ Can't track traffic sources
- ❌ Reduces marketing insights

### Balanced (`strict-origin-when-cross-origin`):
```
Referrer-Policy: strict-origin-when-cross-origin
```

**Pros:**
- ✅ Good privacy (cross-origin)
- ✅ Analytics still work (same-origin)
- ✅ Security (no downgrade)
- ✅ Industry standard

**Cons:**
- ⚠️ Some information sent (origin)
- ⚠️ Not maximum privacy

### No Protection (`unsafe-url`):
```
Referrer-Policy: unsafe-url
```

**Pros:**
- ✅ Full analytics data

**Cons:**
- ❌ Maximum privacy risk
- ❌ Leaks sensitive data
- ❌ Security risk
- ❌ NEVER USE

---

## 📊 Use Cases by Policy

### `no-referrer` - Maximum Privacy
```
Use if:
- Handling very sensitive data
- Medical/financial information
- User privacy is top priority
- Analytics not important

Example: Healthcare site
```

### `same-origin` - Internal Only
```
Use if:
- Only internal navigation matters
- Don't care about external referrals
- Privacy is priority

Example: Internal tools
```

### `origin` - Minimal Information
```
Use if:
- Want to share origin only
- Don't need full URLs
- Privacy-focused

Example: Privacy-conscious site
```

### `strict-origin-when-cross-origin` - Balanced ✅
```
Use if:
- Need analytics
- Want privacy protection
- Standard security
- Most sites use this

Example: Track MCP (recommended)
```

### `unsafe-url` - NEVER USE ❌
```
Never use if:
- Handling any sensitive data
- Care about user privacy
- Want security

This leaks everything!
```

---

## 🔧 Implementation Details

### Current Configuration:
```typescript
// middleware.ts
response.headers.append('Referrer-Policy', 'strict-origin-when-cross-origin')
```

### Applied To:
- ✅ All HTTP responses
- ✅ All pages
- ✅ All resources
- ✅ All external links

### Behavior:

#### Same-Origin Request:
```
From: https://www.trackmcp.com/search?q=claude
To: https://www.trackmcp.com/tool/claude

Referrer: https://www.trackmcp.com/search?q=claude
(Full URL sent)
```

#### Cross-Origin Request:
```
From: https://www.trackmcp.com/search?q=claude
To: https://example.com

Referrer: https://www.trackmcp.com
(Only origin sent, query removed)
```

#### HTTPS→HTTP Downgrade:
```
From: https://www.trackmcp.com
To: http://insecure.com

Referrer: (none)
(No referrer sent for security)
```

---

## 📈 Analytics Impact

### Google Analytics:
```
With strict-origin-when-cross-origin:
✅ Internal traffic tracked
✅ Referral sources tracked (origin only)
✅ Query parameters visible (same-origin)
✅ Cross-origin referrers shown (origin only)
```

### Referral Tracking:
```
User comes from: google.com
Referrer sent: https://google.com
(Origin only, no query)

Analytics shows:
✅ Traffic from Google
✅ No search query (privacy)
```

### Internal Analytics:
```
User navigates internally
Referrer sent: Full URL with query
(Same-origin, full information)

Analytics shows:
✅ User journey
✅ Search queries
✅ Page flow
```

---

## 🔍 Testing & Verification

### Check Header:
```bash
curl -I https://www.trackmcp.com | grep Referrer-Policy
# Should output:
# Referrer-Policy: strict-origin-when-cross-origin
```

### Browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Click any response
4. Check Headers section
5. Should see: `Referrer-Policy: strict-origin-when-cross-origin`

### Test Referrer Behavior:
```html
<!-- Create test page -->
<a href="https://example.com" target="_blank">Test Link</a>

<!-- Open DevTools on example.com -->
<!-- Check Referer header in Network tab -->
<!-- Should see: https://www.trackmcp.com (origin only) -->
```

### Online Tools:
- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/

---

## 📝 Common Issues & Solutions

### Issue 1: Analytics Not Working
```
Problem: Referral analytics showing no data
Cause: Referrer-Policy: no-referrer
Solution: Use strict-origin-when-cross-origin
```

### Issue 2: Query Parameters Missing
```
Problem: Internal analytics missing query strings
Cause: Cross-origin policy too restrictive
Solution: Use strict-origin-when-cross-origin (allows same-origin full URL)
```

### Issue 3: Referrer Leaked to HTTP
```
Problem: HTTPS URLs sent to HTTP sites
Cause: Referrer-Policy: unsafe-url or no-referrer-when-downgrade
Solution: Use strict-origin-when-cross-origin (blocks downgrade)
```

### Issue 4: Too Much Information Leaked
```
Problem: Sensitive data in referrer
Cause: Referrer-Policy: unsafe-url
Solution: Use strict-origin-when-cross-origin (removes query for cross-origin)
```

---

## 🎯 Referrer-Policy by Site Type

### E-Commerce Site:
```
Referrer-Policy: strict-origin-when-cross-origin
Reason: Need analytics, protect customer data
```

### Healthcare Site:
```
Referrer-Policy: no-referrer
Reason: Maximum privacy, sensitive data
```

### SaaS App:
```
Referrer-Policy: strict-origin-when-cross-origin
Reason: Need analytics, balance privacy
```

### News Site:
```
Referrer-Policy: strict-origin-when-cross-origin
Reason: Track referral traffic, protect readers
```

### Social Network:
```
Referrer-Policy: strict-origin-when-cross-origin
Reason: Analytics important, privacy important
```

---

## 🔗 Related Headers

### Referrer-Policy + CSP:
```
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: connect-src 'self' https:
```

### Referrer-Policy + X-Frame-Options:
```
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
```

### Referrer-Policy + HSTS:
```
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

---

## 💡 Key Takeaways

1. **Use `strict-origin-when-cross-origin`**
   - Balances privacy and analytics
   - Industry standard
   - Recommended by OWASP

2. **Understand the Trade-offs**
   - More privacy = less analytics
   - More analytics = less privacy
   - Find the right balance

3. **Protect Sensitive Data**
   - Remove query parameters for cross-origin
   - Block HTTPS→HTTP downgrade
   - Use HTTPS everywhere

4. **Test Regularly**
   - Check headers with curl
   - Verify analytics working
   - Monitor referrer data

---

## 📊 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Safari | ✅ Yes | Full support |
| Edge | ✅ Yes | Full support |
| IE 11 | ⚠️ Partial | Limited support |

**Compatibility**: 95%+ (all modern browsers)

---

## 🔗 Related Resources

- [MDN: Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
- [OWASP: Referrer Policy](https://owasp.org/www-project-secure-headers/#referrer-policy)
- [W3C: Referrer Policy](https://w3c.github.io/webappsec-referrer-policy/)
- [Security Headers](https://securityheaders.com/)

---

## 🎯 Current Status

### ✅ Track MCP Implementation:
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Applied globally via middleware
- ✅ Balances privacy and analytics
- ✅ Industry standard
- ✅ 95%+ browser compatibility

**Your site has proper referrer privacy protection!** 🔒

