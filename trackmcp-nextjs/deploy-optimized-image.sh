#!/bin/bash

# After you've optimized the OG image with TinyPNG, run this script to deploy

echo "🚀 Deploying Optimized OG Image"
echo "================================"
echo ""

# Check file size
CURRENT_SIZE=$(du -h public/og-image.png | cut -f1)
echo "📊 Current og-image.png size: $CURRENT_SIZE"
echo ""

# Verify it's optimized
BYTES=$(stat -f%z public/og-image.png)
if [ $BYTES -gt 307200 ]; then  # 300KB in bytes
    echo "⚠️  Warning: Image is still larger than 300KB"
    echo "   Consider optimizing further with TinyPNG"
    echo ""
fi

# Add to git
echo "📦 Adding to git..."
git add public/og-image.png

# Commit
echo "💾 Committing..."
git commit -m "Optimize OG image file size for better performance"

# Push
echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Done! Vercel will auto-deploy in ~2-3 minutes"
echo "   Check your deployment at: https://vercel.com"
