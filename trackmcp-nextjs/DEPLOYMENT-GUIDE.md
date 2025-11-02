# Deployment Guide - Track MCP Next.js

## 🚀 Quick Deployment Steps

### Step 1: Prepare Environment Variables

You need these from your current `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_GITHUB_TOKEN=your-github-token (optional)
```

### Step 2: Test Locally First

```bash
cd trackmcp-nextjs
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Visit http://localhost:3000 and verify everything works.

### Step 3: Test SSR Output

**Critical:** Verify crawlers can see content:

```bash
# Test homepage
curl http://localhost:3000 | grep "Model Context Protocol"

# Test tool page
curl http://localhost:3000/tool/github-mcp-server | grep "github"
```

✅ **Success:** You see actual content in the HTML
❌ **Failure:** You only see `<div id="root"></div>`

### Step 4: Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. Push `trackmcp-nextjs` folder to your Git repository
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel auto-detects Next.js
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GITHUB_TOKEN`
6. Click "Deploy"

#### Option B: Vercel CLI

```bash
npm i -g vercel
cd trackmcp-nextjs
vercel
```

Follow prompts and add environment variables when asked.

### Step 5: Configure Custom Domain

In Vercel dashboard:
1. Go to Project Settings → Domains
2. Add `www.trackmcp.com`
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

### Step 6: Verify Production Deployment

```bash
# Test with Perplexity user agent
curl -A "PerplexityBot" https://www.trackmcp.com/tool/github-mcp-server

# Test with ChatGPT user agent
curl -A "ChatGPT-User" https://www.trackmcp.com/tool/github-mcp-server

# Test with Google bot
curl -A "Googlebot" https://www.trackmcp.com/
```

All should return full HTML with content!

## 🔄 Migration Strategy

### Zero-Downtime Deployment

**Option 1: Preview URL First**
1. Deploy to Vercel (gets preview URL like `trackmcp-nextjs.vercel.app`)
2. Test thoroughly on preview URL
3. When ready, point your domain to new deployment
4. Old site stays live until you switch DNS

**Option 2: Subdomain Testing**
1. Deploy to `beta.trackmcp.com` first
2. Test for a few days
3. Switch main domain when confident

### Rollback Plan

If something goes wrong:
1. Vercel keeps all previous deployments
2. Click "Promote to Production" on previous deployment
3. Or revert DNS to old site

## 📊 Post-Deployment Checklist

### Immediate (Day 1)

- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Search works
- [ ] Tool submission works
- [ ] Mobile responsive
- [ ] Dark mode works

### SEO Verification (Day 1-2)

- [ ] View page source shows full content
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] Test with curl + bot user agents
- [ ] Google Rich Results Test passes
- [ ] Submit new sitemap to Google Search Console

### Monitoring (Week 1)

- [ ] Check Vercel Analytics
- [ ] Monitor error rates
- [ ] Check Google Search Console for crawl errors
- [ ] Test Perplexity citations (search for your tools)
- [ ] Monitor page load times

## 🐛 Common Issues & Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Issue: Supabase connection fails

**Solution:**
1. Verify environment variables in Vercel dashboard
2. Check Supabase project is active
3. Verify API keys are correct
4. Test connection locally first

### Issue: Build fails on Vercel

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Try building locally: `npm run build`
4. Check Node.js version (18+ required)

### Issue: Pages show 404

**Solution:**
1. Verify dynamic routes are correct
2. Check Supabase has data
3. Test locally first
4. Check Vercel function logs

### Issue: Slow page loads

**Solution:**
1. Enable ISR (already configured)
2. Check Supabase query performance
3. Consider caching strategies
4. Monitor Vercel Analytics

## 🔐 Security Checklist

- [ ] Environment variables are in Vercel (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] Supabase RLS policies are enabled
- [ ] API keys are not exposed in client code
- [ ] CORS is properly configured

## 📈 Performance Optimization

### Already Implemented

- ✅ Server-Side Rendering (SSR)
- ✅ Incremental Static Regeneration (ISR)
- ✅ Automatic code splitting
- ✅ Image optimization (Next.js Image)
- ✅ Font optimization (next/font)

### Optional Improvements

1. **Enable Edge Runtime** (faster global performance)
2. **Add Redis caching** (for frequently accessed data)
3. **Implement CDN** (Vercel includes this)
4. **Optimize images** (compress before upload)

## 🎯 Success Metrics

### Before Migration (Vite)
- SEO Score: ~60
- Lighthouse Performance: ~75
- Crawlers see: Empty HTML shell
- Initial load: ~2-3s

### After Migration (Next.js)
- SEO Score: 95+
- Lighthouse Performance: 90+
- Crawlers see: Full HTML content
- Initial load: ~1-1.5s

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Test locally to isolate issue
4. Review Next.js documentation
5. Check Supabase status page

## 🎉 Launch Announcement

After successful deployment:

1. **Update social media**
   - Announce improved SEO
   - Mention AI crawler support

2. **Submit to search engines**
   - Google Search Console
   - Bing Webmaster Tools

3. **Test AI citations**
   - Search Perplexity for your tools
   - Try ChatGPT with your domain

4. **Monitor results**
   - Track organic traffic increase
   - Monitor crawler activity
   - Check for AI citations

---

**Ready to deploy? Follow the steps above and your site will be live with full SSR support!**
