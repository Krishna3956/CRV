# Quick Start: Admin Dashboard 🚀

## 3-Minute Setup

### 1. Add Password to `.env.local`
```env
ADMIN_PASSWORD=MySecurePassword123!
NEXT_PUBLIC_ADMIN_PASSWORD=MySecurePassword123!
```

### 2. Create Table in Supabase
Go to **SQL Editor** and run:
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

### 3. Restart Dev Server
```bash
# Stop: Ctrl + C
# Start: npm run dev
```

---

## Done! 🎉

Now you have:

| Page | URL | Purpose |
|------|-----|---------|
| **Submit Blog** | `/new/featured-blogs/request` | Users submit here |
| **Featured Blogs** | `/new/featured-blogs` | Shows approved blogs |
| **Admin Dashboard** | `/admin/blogs` | You approve/reject here |

---

## How to Use

1. **Go to** `http://localhost:3000/admin/blogs`
2. **Enter password** (the one you set in `.env.local`)
3. **See pending submissions** with all details
4. **Click "Confirm"** to approve → Blog appears on featured page ✅
5. **Click "Reject"** to reject

---

## Test It

1. Go to `/new/featured-blogs/request`
2. Submit a test blog
3. Go to `/admin/blogs`
4. Enter your password
5. Click "Confirm"
6. Go to `/new/featured-blogs` → Blog appears! ✅

---

## That's It!

You now have a complete blog submission and approval system with:
- ✅ User submission form
- ✅ Password-protected admin dashboard
- ✅ One-click approval
- ✅ Auto-creates featured blog card
- ✅ Auto-rejects blogs

Enjoy! 🎊
