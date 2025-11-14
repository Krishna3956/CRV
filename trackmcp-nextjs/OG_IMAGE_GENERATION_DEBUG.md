# OG Image Generation - Comprehensive Debug

**Date**: 2025-11-14  
**Issue**: OG images not generating automatically  

---

## 🔍 INVESTIGATION CHECKLIST

### **1. API Route Status**
- ✅ Route exists: `/src/app/api/og/route.tsx`
- ✅ Runtime: `edge` (correct for image generation)
- ✅ Export: `export async function GET(request: NextRequest)`
- ✅ Returns: `new ImageResponse(...)`
- ✅ Dimensions: 1200x630 (correct)

### **2. Metadata Generation**
- ✅ OG image URL being generated in `generateMetadata()`
- ✅ URL format: `https://www.trackmcp.com/api/og?tool=...&stars=...&description=...`
- ✅ Parameters: tool name, stars, description (all present)
- ✅ URL encoding: Using `encodeURIComponent()` (correct)

### **3. Next.js Version**
- ✅ Next.js: 14.2.18 (supports `next/og`)
- ✅ React: 18.3.1 (compatible)
- ✅ Node: Latest (from devDependencies)

### **4. Potential Issues**

#### **Issue A: Missing @vercel/og Package**
- Status: ❓ UNCLEAR
- Check: Is `@vercel/og` installed?
- Impact: `next/og` might not work without it
- Solution: Add to package.json

#### **Issue B: API Route Not Deployed**
- Status: ❓ UNCLEAR
- Check: Is `/api/og` accessible in production?
- Impact: OG images won't generate if API is unreachable
- Solution: Test API endpoint directly

#### **Issue C: Image Generation Timeout**
- Status: ❓ POSSIBLE
- Check: Is the API timing out?
- Impact: OG images fail silently
- Solution: Add error handling and logging

#### **Issue D: URL Encoding Problem**
- Status: ❓ POSSIBLE
- Check: Are special characters being encoded correctly?
- Impact: API receives malformed parameters
- Solution: Verify URL encoding

#### **Issue E: Metadata Not Being Rendered**
- Status: ❓ POSSIBLE
- Check: Are meta tags actually in HTML?
- Impact: Social platforms don't see OG tags
- Solution: Inspect HTML source

---

## 🔧 DIAGNOSTIC STEPS

### **Step 1: Check if @vercel/og is needed**

The `next/og` module is built-in to Next.js 14+, but it might need `@vercel/og`:

```bash
npm ls @vercel/og
```

If not installed:
```bash
npm install @vercel/og
```

### **Step 2: Test API Endpoint Directly**

```bash
# Test the API route
curl -I "https://www.trackmcp.com/api/og?tool=google-calendar&stars=100&description=A%20calendar%20tool"

# Should return:
# HTTP/1.1 200 OK
# Content-Type: image/png
```

### **Step 3: Check HTML Meta Tags**

Visit a tool page and inspect the HTML source:

```bash
curl https://www.trackmcp.com/tool/google-calendar-mcp | grep -A 5 "og:image"
```

Should show:
```html
<meta property="og:image" content="https://www.trackmcp.com/api/og?tool=google-calendar&stars=...">
```

### **Step 4: Test Social Media Preview**

Use these tools to test OG image generation:

1. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/sharing/
   - Paste tool URL
   - Check if image appears

2. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Paste tool URL
   - Check if image appears

3. **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/
   - Paste tool URL
   - Check if image appears

---

## 📊 LIKELY ROOT CAUSE

Based on investigation, the most likely issue is:

**The API route might not be properly deployed or accessible**

### **Why:**
1. Route exists locally ✅
2. Metadata is being generated ✅
3. URL format is correct ✅
4. But images might not be generating in production

### **Solution:**
1. Add `@vercel/og` to package.json
2. Test API endpoint in production
3. Add error handling and logging
4. Verify Vercel deployment settings

---

## 🔧 RECOMMENDED FIX

### **Step 1: Add @vercel/og to package.json**

```json
{
  "dependencies": {
    "@vercel/og": "^0.6.2",
    ...
  }
}
```

Then run:
```bash
npm install
```

### **Step 2: Add Error Handling to API Route**

Update `/src/app/api/og/route.tsx`:

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const rawToolName = searchParams.get('tool') || 'Track MCP'
    const toolName = formatToolName(rawToolName)
    const stars = searchParams.get('stars') || '0'
    const description = searchParams.get('description')?.slice(0, 120) || 'Model Context Protocol Tools Directory'
    
    console.log('Generating OG image for:', { toolName, stars, description })
    
    return new ImageResponse(
      // ... JSX ...
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error('Error generating OG image:', e)
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    })
  }
}
```

### **Step 3: Test Locally**

```bash
npm run build
npm run start
# Visit http://localhost:3000/tool/test-tool
# Check if OG image appears in meta tags
```

### **Step 4: Deploy and Test**

```bash
git add -A
git commit -m "fix: add @vercel/og dependency for OG image generation"
git push origin main
# Wait for Vercel deployment
# Test with Facebook Sharing Debugger
```

---

## ✅ VERIFICATION

After fix, verify:

1. ✅ `@vercel/og` installed
2. ✅ API route returns 200 OK
3. ✅ Meta tags present in HTML
4. ✅ Social media preview shows image
5. ✅ No console errors
6. ✅ Image loads in 1-2 seconds

---

**Status**: Ready for implementation
