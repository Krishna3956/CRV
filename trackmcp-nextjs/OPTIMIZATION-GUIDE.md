# OG Image Optimization Guide

## Current Status
- **File**: `public/og-image.png`
- **Size**: 365KB
- **Dimensions**: 1200x630 ✅
- **Target**: <300KB (ideally <100KB)

## Recommended Approach

### Option 1: TinyPNG (Easiest - 2 minutes)
1. Visit: https://tinypng.com
2. Upload `public/og-image.png`
3. Download optimized version
4. Replace original file
5. Expected reduction: 70-80% (365KB → ~80-120KB)

### Option 2: Squoosh (Google's Tool)
1. Visit: https://squoosh.app
2. Upload `public/og-image.png`
3. Settings:
   - Format: PNG (OxiPNG) or JPEG (MozJPEG)
   - Quality: 80-85
4. Download and replace
5. Expected reduction: 60-75%

### Option 3: ImageOptim (Mac App)
1. Download: https://imageoptim.com/mac
2. Install and open
3. Drag `public/og-image.png` into the app
4. Automatically optimizes
5. Expected reduction: 50-70%

### Option 4: Command Line (Automated)
Run the included script:
```bash
./optimize-og-image.sh
```

This will:
- Install pngquant (via Homebrew)
- Backup original image
- Optimize to 65-80% quality
- Show size savings

## After Optimization

1. Verify the image still looks good:
   ```bash
   open public/og-image.png
   ```

2. Check the new file size:
   ```bash
   ls -lh public/og-image.png
   ```

3. Commit and deploy:
   ```bash
   git add public/og-image.png
   git commit -m "Optimize OG image file size"
   git push
   ```

## Why This Matters

- **Faster Page Load**: Smaller images load faster
- **Better SEO**: Page speed is a ranking factor
- **Social Sharing**: Faster preview generation on Facebook/Twitter/LinkedIn
- **Bandwidth Savings**: Reduces server costs

## Target Sizes

- ✅ **Excellent**: <100KB
- ✅ **Good**: 100-200KB
- ⚠️ **Acceptable**: 200-300KB
- ❌ **Too Large**: >300KB (current: 365KB)

## Testing

After optimization, test your OG image:
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
