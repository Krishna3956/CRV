# X-Content-Type-Options & MIME Type Security Guide

## 📋 What is MIME Type Sniffing?

MIME type sniffing is when a browser ignores the declared `Content-Type` header and tries to guess the actual file type by examining the file contents.

### Attack Example:
```
Attacker uploads a file with:
- Filename: image.jpg
- Content-Type: image/jpeg (declared)
- Actual content: JavaScript code

Without X-Content-Type-Options: nosniff
→ Browser sniffs the content
→ Detects JavaScript
→ Executes it as script
→ XSS vulnerability!

With X-Content-Type-Options: nosniff
→ Browser trusts Content-Type: image/jpeg
→ Treats it as image
→ Doesn't execute
→ Safe!
```

---

## 🔒 X-Content-Type-Options Header

### Current Configuration:
```
X-Content-Type-Options: nosniff
```

### What `nosniff` Does:
- ✅ Disables MIME type sniffing
- ✅ Forces browser to trust `Content-Type` header
- ✅ Prevents script execution from mistyped files
- ✅ Blocks execution of scripts disguised as images/documents
- ✅ Protects against polyglot file attacks

### Why This Matters:
1. **File Upload Protection**: Prevents uploaded files from being executed
2. **XSS Prevention**: Stops malicious scripts disguised as other types
3. **Data Exfiltration**: Prevents scripts from stealing data
4. **Malware Prevention**: Blocks drive-by downloads

---

## 🎯 How It Works

### Without `nosniff` (Vulnerable):
```
Server sends:
  Content-Type: image/png
  Content: [JavaScript code]

Browser behavior:
  1. Reads Content-Type: image/png
  2. Sniffs content (reads first bytes)
  3. Detects JavaScript pattern
  4. Overrides Content-Type
  5. Executes as script ❌ VULNERABLE
```

### With `nosniff` (Secure):
```
Server sends:
  X-Content-Type-Options: nosniff
  Content-Type: image/png
  Content: [JavaScript code]

Browser behavior:
  1. Reads X-Content-Type-Options: nosniff
  2. Trusts Content-Type: image/png
  3. Ignores content sniffing
  4. Treats as image
  5. Doesn't execute ✅ SECURE
```

---

## 📊 MIME Type Security Best Practices

### 1. Always Set Correct Content-Type

**For different file types:**
```
JavaScript:     Content-Type: application/javascript
CSS:            Content-Type: text/css
HTML:           Content-Type: text/html; charset=utf-8
JSON:           Content-Type: application/json
Images:         Content-Type: image/png (or jpeg, gif, webp, svg+xml)
Documents:      Content-Type: application/pdf
Archives:       Content-Type: application/zip
Videos:         Content-Type: video/mp4
Fonts:          Content-Type: font/woff2
```

### 2. Set X-Content-Type-Options on All Responses

**In middleware (already done):**
```typescript
response.headers.append('X-Content-Type-Options', 'nosniff')
```

This applies to ALL responses automatically.

### 3. Validate File Uploads

**Server-side validation:**
```typescript
// Check file extension
const allowedExtensions = ['.jpg', '.png', '.gif', '.pdf']
if (!allowedExtensions.includes(path.extname(filename))) {
  return error('Invalid file type')
}

// Check MIME type
const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
if (!allowedMimes.includes(mimeType)) {
  return error('Invalid MIME type')
}

// Check file magic bytes (file signature)
const buffer = await file.arrayBuffer()
if (!isValidPNG(buffer) && !isValidJPEG(buffer)) {
  return error('File content does not match declared type')
}
```

### 4. Use Correct Charset

**For text files:**
```
Content-Type: text/html; charset=utf-8
Content-Type: text/css; charset=utf-8
Content-Type: application/javascript; charset=utf-8
```

---

## 🛡️ Related Security Headers

### X-Frame-Options (Already Implemented)
```
X-Frame-Options: DENY
```
Prevents clickjacking by blocking iframe embedding.

### X-XSS-Protection (Already Implemented)
```
X-XSS-Protection: 1; mode=block
```
Enables browser's built-in XSS protection.

### Content-Security-Policy (Already Implemented)
```
Content-Security-Policy-Report-Only: default-src 'self'; ...
```
Defines allowed content sources (most powerful).

---

## 📈 Attack Scenarios Prevented

### Scenario 1: Polyglot File Attack
```
Attacker creates: image.png
- Valid PNG header (passes magic byte check)
- PNG image data
- Embedded JavaScript code

Without X-Content-Type-Options:
→ Browser sniffs content
→ Finds JavaScript
→ Executes it ❌

With X-Content-Type-Options: nosniff:
→ Browser trusts Content-Type: image/png
→ Treats as image
→ Doesn't execute ✅
```

### Scenario 2: Misnamed File Upload
```
Attacker uploads: malicious.js
- Renamed to: image.jpg
- Content-Type: image/jpeg (spoofed)
- Actual content: JavaScript

Without X-Content-Type-Options:
→ Browser sniffs JavaScript
→ Executes it ❌

With X-Content-Type-Options: nosniff:
→ Browser trusts image/jpeg
→ Doesn't execute ✅
```

### Scenario 3: SVG XSS
```
Attacker uploads: image.svg
- Content-Type: image/svg+xml
- Contains: <script>alert('XSS')</script>

SVG is XML-based and can contain scripts!

Protection:
→ Set Content-Type: image/svg+xml (correct)
→ Use X-Content-Type-Options: nosniff
→ Serve from separate domain (sandbox)
→ Use CSP to restrict inline scripts
```

---

## ✅ Implementation Checklist

### Current Status (✅ Complete):
- ✅ X-Content-Type-Options: nosniff set globally
- ✅ Applied to all responses via middleware
- ✅ Combined with CSP for defense-in-depth

### Additional Recommendations:
- [ ] Validate file uploads server-side
- [ ] Check file magic bytes (not just extension)
- [ ] Use separate domain for user uploads (sandbox)
- [ ] Set correct Content-Type for all responses
- [ ] Use CSP to restrict script execution
- [ ] Monitor CSP violations for bypass attempts

### For File Uploads:
- [ ] Validate file extension
- [ ] Validate MIME type
- [ ] Check file magic bytes
- [ ] Scan with antivirus (optional)
- [ ] Store outside web root
- [ ] Serve with Content-Disposition: attachment
- [ ] Set X-Content-Type-Options: nosniff

---

## 🔍 Testing & Verification

### Check Header:
```bash
curl -I https://www.trackmcp.com | grep X-Content-Type-Options
# Should output:
# X-Content-Type-Options: nosniff
```

### Browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Click any response
4. Check Headers section
5. Should see: `X-Content-Type-Options: nosniff`

### Online Tools:
- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/

---

## 📝 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Safari | ✅ Yes | Full support |
| Edge | ✅ Yes | Full support |
| IE 8+ | ✅ Yes | Full support |

**Compatibility**: 100% (all modern browsers)

---

## 🚀 Defense-in-Depth Strategy

### Layer 1: X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents MIME sniffing.

### Layer 2: Content-Security-Policy
```
script-src 'self' ...
```
Restricts script execution sources.

### Layer 3: File Upload Validation
```
- Check extension
- Check MIME type
- Check magic bytes
- Scan with antivirus
```

### Layer 4: Separate Upload Domain
```
User uploads → uploads.trackmcp.com
Main site → www.trackmcp.com
```
Isolates uploads from main site.

### Layer 5: Content-Disposition
```
Content-Disposition: attachment; filename="file.pdf"
```
Forces download instead of inline viewing.

---

## 💡 Key Takeaways

1. **Always set X-Content-Type-Options: nosniff**
   - Prevents MIME sniffing attacks
   - Protects against polyglot files
   - Zero performance impact

2. **Trust declared Content-Type**
   - Set correct MIME type for all responses
   - Don't rely on file extensions
   - Validate on server-side

3. **Defense-in-Depth**
   - Combine with CSP
   - Validate file uploads
   - Use separate domains for uploads
   - Monitor for violations

4. **Test Regularly**
   - Use online security scanners
   - Check headers in DevTools
   - Monitor CSP violations
   - Review file upload handling

---

## 🔗 Related Resources

- [MDN: X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
- [OWASP: Content Type](https://owasp.org/www-community/attacks/MIME_sniffing)
- [Security Headers: X-Content-Type-Options](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

