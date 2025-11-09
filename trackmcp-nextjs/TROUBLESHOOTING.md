# Troubleshooting Guide 🔧

## Form Submission Error: "An error occurred. Please try again."

If you see this error when submitting the blog form, here's how to debug:

### Step 1: Check Browser Console
1. Open DevTools: `Cmd + Option + I` (Mac) or `F12` (Windows)
2. Go to **Console** tab
3. Try submitting the form again
4. Look for error messages in red

### Step 2: Common Issues & Solutions

#### ❌ **Error: "Upload failed: Bucket not found"**
**Problem:** The `blog-images` storage bucket doesn't exist in Supabase

**Solution:**
1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create a new bucket**
3. Name it: `blog-images`
4. Set to **Public**
5. Click **Create bucket**
6. Try submitting again

---

#### ❌ **Error: "Upload failed: Unauthorized"**
**Problem:** Supabase credentials are wrong or permissions are missing

**Solution:**
1. Check `.env.local` has:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```
2. Go to Supabase → Settings → API Keys
3. Copy the correct keys
4. Update `.env.local`
5. Restart dev server: `npm run dev`

---

#### ❌ **Error: "Upload failed: File too large"**
**Problem:** Image is larger than 5MB

**Solution:**
- Compress your image to less than 5MB
- Use tools like: tinypng.com or imagecompressor.com

---

#### ❌ **Error: "Upload failed: Invalid file type"**
**Problem:** File is not an image

**Solution:**
- Make sure you're uploading an image (JPG, PNG, GIF, etc.)
- Not a PDF, document, or other file type

---

#### ❌ **Error: "Failed to submit blog"**
**Problem:** The form submission API failed

**Solution:**
1. Check browser console for more details
2. Make sure `blog_submissions` table exists in Supabase
3. Check Supabase → Table Editor → blog_submissions exists
4. If not, run the SQL migration:
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
   ```

---

### Step 3: Check Network Tab
1. Open DevTools → **Network** tab
2. Try submitting the form
3. Look for requests to:
   - `/api/blogs/upload` - Should be 200 OK
   - `/api/blogs/submit` - Should be 200 OK
4. Click on each request to see response details

---

### Step 4: Check Server Logs
1. Look at terminal where you ran `npm run dev`
2. Look for error messages
3. Copy the error and search online

---

## Admin Dashboard Issues

### ❌ **"Invalid password" error**
**Solution:**
1. Check `.env.local` has:
   ```env
   ADMIN_PASSWORD=your_password
   NEXT_PUBLIC_ADMIN_PASSWORD=your_password
   ```
2. Make sure both are the same
3. Restart dev server

---

### ❌ **Dashboard shows "No pending submissions"**
**Solution:**
1. Make sure you submitted a blog first
2. Check Supabase → Table Editor → blog_submissions
3. Verify the row exists with `status = 'pending'`

---

### ❌ **"Confirm" button doesn't work**
**Solution:**
1. Check browser console for errors
2. Make sure `featured_blogs` table exists
3. Check Supabase → Table Editor → featured_blogs
4. If not, create it:
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
   ```

---

## Quick Checklist

- [ ] `blog-images` bucket exists in Supabase (PUBLIC)
- [ ] `blog_submissions` table exists in Supabase
- [ ] `featured_blogs` table exists in Supabase
- [ ] `.env.local` has correct Supabase credentials
- [ ] `.env.local` has `ADMIN_PASSWORD` set
- [ ] Dev server restarted after env changes
- [ ] Browser console shows no errors
- [ ] Network requests show 200 OK

---

## Still Having Issues?

1. **Check the error message carefully** - It now shows the actual error
2. **Look at browser console** - More details there
3. **Check Supabase logs** - Go to Supabase Dashboard → Logs
4. **Restart everything:**
   ```bash
   # Stop dev server (Ctrl + C)
   # Clear cache
   rm -rf .next
   # Restart
   npm run dev
   ```

---

## Getting Help

When asking for help, provide:
1. The exact error message
2. Screenshot of browser console
3. Screenshot of network tab
4. What you were trying to do
