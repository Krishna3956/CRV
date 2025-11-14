# OG Image QA Analysis - Current State

**Date**: 2025-11-14  
**Status**: QA Analysis (Before Making Changes)  

---

## 🔍 CURRENT STATE ANALYSIS

### **1. Default OG Image (Non-Tool Pages)**

**Location**: `/src/app/layout.tsx` (Root Layout)

**Current Implementation**:
```typescript
openGraph: {
  images: [
    {
      url: 'https://www.trackmcp.com/og-image.png',
      width: 1200,
      height: 630,
      alt: 'App Store for MCP Servers, Clients, and Tools...',
    },
  ],
}
```

**File Status**: ✅ EXISTS
- `/public/og-image.png` - Main OG image
- `/public/og-image-backup.png` - Backup
- `/public/og-image-original.png` - Original

**Used For**: 
- Homepage
- Category pages
- About page
- Privacy/Terms pages
- All non-tool pages

---

### **2. Tool Page OG Images**

**Location**: `/src/app/tool/[name]/page.tsx`

**Current Implementation**:
```typescript
openGraph: {
  images: [
    {
      url: `https://www.trackmcp.com/api/og?tool=${encodeURIComponent(toolName)}&stars=${tool.stars || 0}&description=${encodeURIComponent(metaDescription.slice(0, 150))}`,
      width: 1200,
      height: 630,
    },
  ],
}
```

**API Route Status**: ❌ **MISSING**
- Route: `/api/og` - **DOES NOT EXIST**
- This is why tool pages show only logo!

**Expected Behavior**:
- Each tool should have a **unique dynamically-generated OG image**
- Image should include:
  - Tool name
  - Star count
  - Description
  - Logo/branding

---

## 🚨 THE PROBLEM

### **What's Broken**:
1. ❌ `/api/og` route doesn't exist
2. ❌ Tool pages can't generate dynamic OG images
3. ❌ Tool pages fall back to default logo only
4. ❌ No unique preview when sharing tool links on WhatsApp/Twitter

### **What Should Happen**:
1. ✅ `/api/og` route should exist
2. ✅ Should generate dynamic images with:
   - Tool name
   - Star count
   - Description
   - Branding
3. ✅ Each tool link shows unique preview
4. ✅ Beautiful WhatsApp/Twitter previews

---

## 📊 COMPARISON TABLE

| Aspect | Current | Should Be |
|--------|---------|-----------|
| Default OG Image | ✅ Works | ✅ Works |
| Tool OG Images | ❌ Broken | ✅ Dynamic |
| API Route | ❌ Missing | ✅ Exists |
| WhatsApp Preview | ❌ Logo only | ✅ Unique |
| Twitter Preview | ❌ Logo only | ✅ Unique |

---

## 🔧 WHAT NEEDS TO BE FIXED

### **Fix #1: Create `/api/og` Route**
- Location: `/src/app/api/og/route.ts`
- Should generate dynamic OG images
- Use `@vercel/og` or similar library
- Include tool name, stars, description

### **Fix #2: Verify Default OG Image**
- Ensure `/public/og-image.png` is correct
- Should be used for all non-tool pages
- Currently working ✅

### **Fix #3: Test Tool OG Images**
- After creating `/api/og` route
- Test with different tools
- Verify WhatsApp/Twitter previews

---

## 📝 QUESTIONS TO ANSWER BEFORE FIXING

1. **Do you have the design for the dynamic OG image?**
   - Should it include tool logo?
   - What colors/fonts?
   - Where should text be positioned?

2. **What information should be on the dynamic OG image?**
   - Tool name? ✅
   - Star count? ✅
   - Description? ✅
   - GitHub URL? 
   - Category?

3. **Should we use a library?**
   - `@vercel/og` (Vercel's solution)
   - `satori` (Vercel's underlying library)
   - Custom image generation?

4. **What about the default OG image?**
   - Is `/public/og-image.png` the correct image you mentioned?
   - Should it be used for all non-tool pages?

---

## ✅ CURRENT STATUS

- ✅ Default OG image exists and works
- ❌ Tool OG image API missing
- ❌ Tool pages show logo only
- ⏳ Waiting for your confirmation before fixing

---

**NEXT STEP**: Please confirm:
1. The design/style for dynamic OG images
2. What information should be included
3. Any specific requirements or preferences

**Then I'll create the `/api/og` route correctly!**
