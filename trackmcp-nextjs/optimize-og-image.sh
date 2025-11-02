#!/bin/bash

# OG Image Optimization Script
# This script optimizes the og-image.png file

echo "🖼️  OG Image Optimization Script"
echo "================================"
echo ""

# Check if pngquant is installed
if ! command -v pngquant &> /dev/null; then
    echo "❌ pngquant not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install pngquant
    else
        echo "❌ Homebrew not found. Please install pngquant manually:"
        echo "   Visit: https://pngquant.org"
        echo ""
        echo "Or use online tools:"
        echo "   - TinyPNG: https://tinypng.com"
        echo "   - Squoosh: https://squoosh.app"
        exit 1
    fi
fi

# Backup original
echo "📦 Creating backup..."
cp public/og-image.png public/og-image-original.png

# Get original size
ORIGINAL_SIZE=$(du -h public/og-image.png | cut -f1)
echo "📊 Original size: $ORIGINAL_SIZE"

# Optimize with pngquant
echo "⚙️  Optimizing..."
pngquant --quality=65-80 --speed 1 --force --output public/og-image-optimized.png public/og-image.png

# Replace original
mv public/og-image-optimized.png public/og-image.png

# Get new size
NEW_SIZE=$(du -h public/og-image.png | cut -f1)
echo "✅ Optimized size: $NEW_SIZE"

# Calculate savings
ORIGINAL_BYTES=$(stat -f%z public/og-image-original.png)
NEW_BYTES=$(stat -f%z public/og-image.png)
SAVINGS=$((100 - (NEW_BYTES * 100 / ORIGINAL_BYTES)))

echo "💾 Saved: ${SAVINGS}%"
echo ""
echo "✨ Optimization complete!"
echo "   Original backup: public/og-image-original.png"
echo "   Optimized file: public/og-image.png"
