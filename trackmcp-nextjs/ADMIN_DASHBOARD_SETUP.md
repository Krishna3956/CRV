# Admin Dashboard Setup Guide 🔐

## Overview
This guide explains how to set up the password-protected admin dashboard for approving blog submissions.

## How It Works

```
User submits blog
       ↓
Data saved to blog_submissions (status = pending)
       ↓
You go to /admin/blogs
       ↓
Enter password
       ↓
See all pending submissions
       ↓
Click "Confirm" → Auto-added to featured blogs
       ↓
Blog appears on /new/featured-blogs page ✅
```

---

## Setup Instructions

### Step 1: Set Admin Password

Add to your `.env.local`:

```env
ADMIN_PASSWORD=your_super_secret_password_here
NEXT_PUBLIC_ADMIN_PASSWORD=your_super_secret_password_here
```

**Example:**
```env
ADMIN_PASSWORD=MySecureAdminPass123!
NEXT_PUBLIC_ADMIN_PASSWORD=MySecureAdminPass123!
```

⚠️ **IMPORTANT:** Use a strong password! This is your only protection.

### Step 2: Create featured_blogs Table

Go to **Supabase Dashboard** → **SQL Editor** → Run this:

```sql
CREATE TABLE IF NOT EXISTS featured_blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_url TEXT NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(300) NOT NULL,
  hero_image TEXT NOT NULL,
  author_name VARCHAR(50) NOT NULL,
  author_image TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT true,
  submission_id UUID REFERENCES blog_submissions(id) ON DELETE CASCADE,
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_blogs_is_featured ON featured_blogs(is_featured);
CREATE INDEX IF NOT EXISTS idx_featured_blogs_approved_at ON featured_blogs(approved_at DESC);

ALTER TABLE featured_blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON featured_blogs
  FOR SELECT
  USING (true);
```

### Step 3: Verify blog_submissions Table

Make sure you have the `blog_submissions` table from the previous setup. If not, run:

```sql
CREATE TABLE IF NOT EXISTS blog_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(300) NOT NULL,
  hero_image TEXT NOT NULL,
  author_name VARCHAR(50) NOT NULL,
  author_image TEXT NOT NULL,
  blog_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_submissions_status ON blog_submissions(status);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_submitted_at ON blog_submissions(submitted_at DESC);

ALTER TABLE blog_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON blog_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to view submissions" ON blog_submissions
  FOR SELECT
  USING (true);
```

### Step 4: Restart Dev Server

```bash
# Stop the dev server (Ctrl + C)
# Then restart it
npm run dev
```

---

## How to Use

### Access the Admin Dashboard

1. Go to: **`http://localhost:3000/admin/blogs`** (local)
   - Or: **`https://yourdomain.com/admin/blogs`** (production)

2. Enter your admin password

3. You'll see the dashboard with:
   - **⏳ Pending** - Submissions waiting for approval
   - **✅ Approved** - Already approved blogs
   - **❌ Rejected** - Rejected submissions

### Approve a Blog

1. Find the blog in **Pending** section
2. Review the details:
   - Hero image
   - Title & description
   - Author name & image
   - Blog URL
3. Click **"Confirm"** button
4. ✅ Blog is automatically added to featured blogs
5. Blog appears on `/new/featured-blogs` page

### Reject a Blog

1. Find the blog in **Pending** section
2. Click **"Reject"** button
3. ❌ Blog is marked as rejected
4. Blog won't appear anywhere

### View Blog

1. Click **"View Blog"** button
2. Opens the blog in a new tab
3. Review the actual blog content

---

## What Happens When You Click "Confirm"

```
Click "Confirm"
       ↓
Password verified
       ↓
blog_submissions.status = 'approved'
       ↓
New row added to featured_blogs table
       ↓
Blog metadata auto-fetched
       ↓
Card appears on /new/featured-blogs page ✅
```

---

## Dashboard Features

### Stats
- **Pending**: Number of submissions waiting for approval
- **Approved**: Number of approved blogs
- **Rejected**: Number of rejected blogs

### Pending Section
Shows all pending submissions with:
- Hero image preview
- Title & description
- Author name & image
- Submission date
- "View Blog" button
- "Confirm" button (green)
- "Reject" button (red)

### Approved Section
Shows all approved blogs with:
- Title & author
- "View Blog" button
- Read-only (can't change status)

### Rejected Section
Shows all rejected blogs with:
- Title & author
- "View Blog" button
- Read-only (can't change status)

---

## Security

✅ **Password Protected**
- Only you know the password
- URL is not secret, but password is required

✅ **Server-Side Validation**
- Password checked on server
- Can't bypass with client-side hacks

⚠️ **Best Practices**
- Use a strong password (mix of letters, numbers, symbols)
- Don't share the password
- Change password regularly
- Use HTTPS in production

---

## Troubleshooting

### "Invalid password" error
- Check your `.env.local` file
- Make sure `ADMIN_PASSWORD` is set correctly
- Restart dev server after changing env vars

### Dashboard shows no submissions
- Check that `blog_submissions` table exists in Supabase
- Make sure someone has submitted a blog
- Check Supabase table directly

### "Confirm" button doesn't work
- Check browser console for errors
- Make sure `featured_blogs` table exists
- Verify Supabase credentials are correct

### Blog doesn't appear after approval
- Check `featured_blogs` table in Supabase
- Verify blog was added with correct URL
- Check `/new/featured-blogs` page (may need to refresh)

---

## Files Created

- `/src/app/admin/blogs/page.tsx` - Password-protected admin page
- `/src/components/admin-dashboard.tsx` - Admin dashboard component
- `/src/app/api/blogs/approve/route.ts` - Approval API endpoint
- `/migrations/create_featured_blogs_table.sql` - Database schema

---

## Next Steps

1. ✅ Set `ADMIN_PASSWORD` in `.env.local`
2. ✅ Create `featured_blogs` table in Supabase
3. ✅ Restart dev server
4. ✅ Test by going to `/admin/blogs`
5. ✅ Submit a test blog
6. ✅ Approve it from admin dashboard
7. ✅ Verify it appears on `/new/featured-blogs`

---

## Questions?

If you need help:
1. Check the troubleshooting section
2. Review the setup steps again
3. Check Supabase logs for errors
4. Check browser console for errors
