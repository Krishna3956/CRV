# Google Search Console Setup

## How to Verify Your Site

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property" and enter your domain: `www.trackmcp.com`
3. Choose verification method:

### Option 1: HTML File Upload (Recommended)
- Download the verification file from Google Search Console
- Place it in the `/public` folder
- Deploy your site
- Click "Verify" in Google Search Console

### Option 2: HTML Meta Tag
- Copy the meta tag provided by Google
- Add it to `/index.html` in the `<head>` section
- Deploy your site
- Click "Verify" in Google Search Console

## Submit Your Sitemap

After verification:
1. In Google Search Console, go to "Sitemaps" in the left menu
2. Enter: `https://www.trackmcp.com/sitemap.xml`
3. Click "Submit"

## Monitor Performance

Check these sections regularly:
- **Performance**: See search queries, clicks, and impressions
- **Coverage**: Monitor indexed pages and errors
- **Core Web Vitals**: Track LCP, FID, and CLS metrics
- **Mobile Usability**: Ensure mobile-friendly pages

## Sitemap Updates

The sitemap is automatically generated during build:
```bash
npm run generate-sitemap
```

This runs before every production build to ensure it's up-to-date.
