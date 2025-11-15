# Clickjacking & X-Frame-Options Security Guide

## 📋 What is Clickjacking?

Clickjacking is an attack where an attacker tricks users into clicking on hidden elements by overlaying transparent iframes on top of legitimate content.

### Classic Clickjacking Attack:
```html
<!-- Attacker's malicious page -->
<html>
  <head>
    <style>
      #victim-site {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.01;  <!-- Nearly invisible -->
        z-index: 1;
      }
      
      #fake-button {
        position: absolute;
        top: 300px;
        left: 500px;
        z-index: 0;
      }
    </style>
  </head>
  <body>
    <!-- Fake button where user thinks they're clicking -->
    <button id="fake-button">Click to claim prize!</button>
    
    <!-- Hidden iframe of victim site -->
    <iframe id="victim-site" src="https://www.trackmcp.com/delete-account"></iframe>
  </body>
</html>
```

**Result:**
- User clicks "Click to claim prize!"
- Actually clicks hidden button on trackmcp.com
- Deletes their account without knowing! ❌

---

## 🔒 X-Frame-Options Header

### Current Configuration:
```
X-Frame-Options: DENY
```

### What `DENY` Does:
- ✅ Prevents site from being framed anywhere
- ✅ Blocks all iframe embedding
- ✅ Protects against clickjacking
- ✅ Most restrictive (safest) option

### Alternative: `SAMEORIGIN`
```
X-Frame-Options: SAMEORIGIN
```

**Use `SAMEORIGIN` if:**
- You need to embed your own site in iframes
- You have subdomains that need to frame each other
- Example: `app.trackmcp.com` frames `www.trackmcp.com`

**Use `DENY` if:**
- You don't need iframe embedding (recommended)
- Maximum security is priority
- No legitimate use case for framing

---

## 🎯 X-Frame-Options vs CSP frame-ancestors

### X-Frame-Options (Legacy):
```
X-Frame-Options: DENY
```
- Older standard (still widely used)
- Simple and straightforward
- Limited flexibility

### CSP frame-ancestors (Modern):
```
Content-Security-Policy: frame-ancestors 'none'
```
- Modern standard (preferred)
- More flexible
- Better integration with CSP

### Current Implementation:
```typescript
// middleware.ts
response.headers.append('X-Frame-Options', 'DENY')

// CSP already includes:
frame-ancestors 'none'
```

**Both are set for maximum compatibility!**

---

## 📊 Comparison: DENY vs SAMEORIGIN

| Feature | DENY | SAMEORIGIN |
|---------|------|-----------|
| Can be framed by any site | ❌ No | ❌ No |
| Can be framed by same domain | ❌ No | ✅ Yes |
| Can be framed by subdomains | ❌ No | ✅ Yes |
| Clickjacking protection | ✅ Full | ✅ Full |
| Use case | General sites | Apps with iframes |
| Recommended | ✅ Yes | For specific needs |

---

## 🛡️ Clickjacking Attack Scenarios

### Scenario 1: Delete Account Attack
```
Attacker's page:
  - Shows: "Click to win $1000!"
  - Hidden: iframe to trackmcp.com/settings/delete-account
  
User clicks → Deletes account unknowingly ❌
```

**Protection:** X-Frame-Options: DENY
- Iframe blocked
- User sees error
- Account safe ✅

### Scenario 2: Permission Grant Attack
```
Attacker's page:
  - Shows: "Click to continue"
  - Hidden: iframe to trackmcp.com/grant-permissions
  
User clicks → Grants permissions unknowingly ❌
```

**Protection:** X-Frame-Options: DENY
- Iframe blocked
- Permissions safe ✅

### Scenario 3: Payment Confirmation Attack
```
Attacker's page:
  - Shows: "Click to claim reward"
  - Hidden: iframe to trackmcp.com/confirm-payment
  
User clicks → Confirms payment unknowingly ❌
```

**Protection:** X-Frame-Options: DENY
- Iframe blocked
- Payment safe ✅

### Scenario 4: Credential Theft (UI Redressing)
```
Attacker's page:
  - Shows: Fake login form
  - Hidden: Real trackmcp.com login in iframe
  - Transparent overlay on top
  
User types credentials → Attacker captures them ❌
```

**Protection:** X-Frame-Options: DENY
- Real iframe blocked
- Credentials safe ✅

---

## 🔍 How Browsers Enforce X-Frame-Options

### With `DENY`:
```
Browser receives:
  X-Frame-Options: DENY
  
When iframe tries to load:
  1. Browser reads X-Frame-Options: DENY
  2. Checks if page is being framed
  3. Sees DENY directive
  4. Blocks iframe ✅
  5. Shows error in console
```

### Without X-Frame-Options (Vulnerable):
```
Browser receives:
  (no X-Frame-Options header)
  
When iframe tries to load:
  1. Browser has no restrictions
  2. Allows iframe to load ❌
  3. Page can be framed
  4. Clickjacking possible ❌
```

---

## 📈 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Safari | ✅ Yes | Full support |
| Edge | ✅ Yes | Full support |
| IE 8+ | ✅ Yes | Full support |

**Compatibility**: 100% (all modern browsers)

---

## ✅ Implementation Checklist

### Current Status (✅ Complete):
- ✅ X-Frame-Options: DENY set globally
- ✅ Applied to all responses via middleware
- ✅ CSP frame-ancestors 'none' also set
- ✅ Defense-in-depth approach

### Verification:
- [ ] Check header with curl
- [ ] Test in browser DevTools
- [ ] Use online security scanner
- [ ] Monitor for iframe attempts

### For Future Needs:
- [ ] If you need iframes, switch to SAMEORIGIN
- [ ] Update CSP frame-ancestors accordingly
- [ ] Test thoroughly before deploying
- [ ] Monitor for clickjacking attempts

---

## 🔧 Switching from DENY to SAMEORIGIN

**If you need to allow iframes from your domain:**

```typescript
// middleware.ts
response.headers.append('X-Frame-Options', 'SAMEORIGIN')

// Also update CSP:
// frame-ancestors 'self'
```

**When to do this:**
- You have subdomains that need to frame each other
- You embed your own site in iframes
- You use iframe-based features

**Be careful:**
- Only allow from trusted origins
- Still vulnerable to same-origin attacks
- Prefer CSP frame-ancestors for more control

---

## 🚀 Defense-in-Depth Strategy

### Layer 1: X-Frame-Options
```
X-Frame-Options: DENY
```
Prevents framing at HTTP level.

### Layer 2: CSP frame-ancestors
```
Content-Security-Policy: frame-ancestors 'none'
```
Prevents framing at CSP level (modern standard).

### Layer 3: JavaScript Detection
```javascript
// Detect if page is being framed
if (window.self !== window.top) {
  // Page is in an iframe
  console.warn('Page is being framed!')
  // Could break out or show warning
}
```

### Layer 4: UI Indicators
```javascript
// Show warning if framed
if (window.self !== window.top) {
  document.body.innerHTML = '<h1>This page cannot be framed</h1>'
}
```

### Layer 5: Sensitive Action Protection
```javascript
// For sensitive actions (delete, payment, etc.)
// Require additional verification
// - CSRF token
// - User confirmation
// - Re-authentication
```

---

## 🔍 Testing & Verification

### Check Header:
```bash
curl -I https://www.trackmcp.com | grep X-Frame-Options
# Should output:
# X-Frame-Options: DENY
```

### Browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Click any response
4. Check Headers section
5. Should see: `X-Frame-Options: DENY`

### Test Framing (Should Fail):
```html
<iframe src="https://www.trackmcp.com"></iframe>
<!-- Should show error in console:
     Refused to display 'https://www.trackmcp.com/' in a frame
     because it set 'X-Frame-Options' to 'deny'. -->
```

### Online Tools:
- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/

---

## 📝 Common Issues & Solutions

### Issue 1: "Refused to display in a frame"
```
Error: Refused to display 'https://www.trackmcp.com/' in a frame
       because it set 'X-Frame-Options' to 'deny'.
```

**Solution:**
- This is expected with `DENY`
- If you need framing, switch to `SAMEORIGIN`
- Or use CSP `frame-ancestors 'self'`

### Issue 2: Subdomains Can't Frame
```
Error: Refused to display 'https://www.trackmcp.com/' in a frame
       because it set 'X-Frame-Options' to 'deny'.
```

**Solution:**
- Change to `SAMEORIGIN`
- Or use CSP `frame-ancestors 'self'`
- Subdomains will then be allowed

### Issue 3: Third-party Embedding
```
Question: Can I embed trackmcp.com on another site?
Answer: No, X-Frame-Options: DENY prevents this.
```

**Solution:**
- This is intentional for security
- If you want to allow embedding, change to `SAMEORIGIN`
- Or use CSP `frame-ancestors 'self' https://trusted-domain.com`

---

## 💡 Key Takeaways

1. **Always set X-Frame-Options**
   - Prevents clickjacking attacks
   - Use `DENY` by default (safest)
   - Use `SAMEORIGIN` only if needed

2. **Combine with CSP**
   - Set both X-Frame-Options and CSP frame-ancestors
   - Defense-in-depth approach
   - Better browser compatibility

3. **Protect Sensitive Actions**
   - Require CSRF tokens
   - Ask for user confirmation
   - Re-authenticate for critical operations

4. **Test Regularly**
   - Use online security scanners
   - Check headers in DevTools
   - Monitor for framing attempts

---

## 🔗 Related Resources

- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [OWASP: Clickjacking](https://owasp.org/www-community/attacks/Clickjacking)
- [MDN: CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [Security Headers](https://securityheaders.com/)

---

## 🎯 Current Status

### ✅ Track MCP Implementation:
- ✅ X-Frame-Options: DENY
- ✅ CSP frame-ancestors 'none'
- ✅ Applied globally via middleware
- ✅ 100% browser compatibility
- ✅ Maximum clickjacking protection

**Your site is fully protected against clickjacking!** 🔒

