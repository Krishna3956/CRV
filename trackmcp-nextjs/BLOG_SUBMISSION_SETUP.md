# Blog Submission System - Setup Guide

## Overview
This system allows anyone to submit their MCP-related blog posts for potential featuring on Track MCP. Submissions are stored in Supabase and can be reviewed and approved by admins.

## Features
- ✅ Public blog submission form at `/new/featured-blogs/request`
- ✅ Form validation with real-time feedback
- ✅ Image preview for hero and author images
- ✅ Character count indicators
- ✅ Supabase database storage
- ✅ Admin dashboard for reviewing submissions
- ✅ One-click copy-to-clipboard for adding blogs to featured list

## Setup Instructions

### Step 1: Create Supabase Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Click **Create a new bucket**
4. Name it: `blog-images`
5. Set it to **Public** (so images are accessible)
6. Click **Create bucket**

### Step 2: Create Supabase Table

Run the SQL migration in your Supabase dashboard:

```sql
-- Create blog_submissions table for tracking blog submission requests
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blog_submissions_status ON blog_submissions(status);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_submitted_at ON blog_submissions(submitted_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE blog_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (anyone can submit)
CREATE POLICY "Allow public inserts" ON blog_submissions
  FOR INSERT
  WITH CHECK (true);

-- Create policy for authenticated users to view submissions
CREATE POLICY "Allow users to view submissions" ON blog_submissions
  FOR SELECT
  USING (true);
```

### Step 3: Environment Variables

Add to your `.env.local` (if not already present):

```env
# Already configured
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For admin access (optional)
ADMIN_TOKEN=your_secret_admin_token
NEXT_PUBLIC_ADMIN_TOKEN=your_secret_admin_token
```

### Step 4: Files Created

#### Frontend Components
- `/src/components/blog-submission-form.tsx` - Main submission form with image upload
- `/src/components/blog-submissions-admin.tsx` - Admin dashboard

#### Pages
- `/src/app/new/featured-blogs/request/page.tsx` - Public submission page

#### API Routes
- `/src/app/api/blogs/submit/route.ts` - Handles form submissions and admin queries
- `/src/app/api/blogs/upload/route.ts` - Handles image uploads to Supabase Storage

#### Database
- `/migrations/create_blog_submissions_table.sql` - Database schema

## Usage

### For Users (Submitting Blogs)

1. Navigate to `https://yourdomain.com/new/featured-blogs/request`
2. Fill out the form with:
   - **Blog Title** (max 100 chars)
   - **Description** (max 300 chars)
   - **Hero Image** (click to upload, max 5MB)
   - **Author Name** (max 50 chars)
   - **Author Image** (click to upload, max 5MB)
   - **Blog Post URL**
3. Images are uploaded to Supabase Storage automatically
4. Click "Submit Blog"
5. Success message confirms submission
6. Admin reviews within 24-48 hours

### For Admins (Approving Blogs)

#### Option 1: Using Admin Dashboard
1. Create a page that imports `BlogSubmissionsAdmin` component
2. Add authentication check
3. Component fetches pending submissions
4. Click "Copy Code" to copy the blog entry
5. Paste into `/src/data/featured-blogs.ts`

#### Option 2: Direct Database Query
1. Go to Supabase dashboard
2. Query `blog_submissions` table
3. Filter by `status = 'pending'`
4. Review submissions
5. Copy blog URL and add to `FEATURED_BLOGS` array

#### Option 3: Using API
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://yourdomain.com/api/blogs/submit
```

### Adding Approved Blogs

Once approved, add to `/src/data/featured-blogs.ts`:

```typescript
export const FEATURED_BLOGS: FeaturedBlog[] = [
  {
    url: 'https://example.com/blog/post',
    isFeatured: true,  // Shows "Community Pick" badge
  },
  // ... more blogs
]
```

## Form Validation

The form validates:
- ✅ All fields are required
- ✅ Title: max 100 characters
- ✅ Description: max 300 characters
- ✅ Author name: max 50 characters
- ✅ All URLs are valid and accessible
- ✅ Real-time error feedback

## Database Schema

```sql
blog_submissions {
  id: UUID (primary key)
  title: VARCHAR(100)
  description: VARCHAR(300)
  hero_image: TEXT (URL)
  author_name: VARCHAR(50)
  author_image: TEXT (URL)
  blog_url: TEXT (URL)
  submitted_at: TIMESTAMP
  status: VARCHAR(20) - 'pending', 'approved', 'rejected'
  reviewed_at: TIMESTAMP (nullable)
  notes: TEXT (nullable)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

## API Endpoints

### POST /api/blogs/submit
Submit a new blog

**Request:**
```json
{
  "title": "Blog Title",
  "description": "Blog description",
  "heroImage": "https://example.com/hero.jpg",
  "authorName": "John Doe",
  "authorImage": "https://example.com/author.jpg",
  "blogUrl": "https://example.com/blog/post"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Blog submitted successfully!",
  "data": { ... }
}
```

### GET /api/blogs/submit
Fetch pending submissions (admin only)

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Blog Title",
      "status": "pending",
      ...
    }
  ]
}
```

## Customization

### Change Character Limits
Edit `/src/components/blog-submission-form.tsx`:
```typescript
// Line 50 - Title limit
maxLength={100}  // Change to desired limit

// Line 59 - Description limit
maxLength={300}  // Change to desired limit

// Line 78 - Author name limit
maxLength={50}   // Change to desired limit
```

### Change Form Fields
1. Update `FormData` interface
2. Add new input field in form
3. Update validation logic
4. Update API route to handle new field

### Customize Styling
- Form uses Tailwind CSS
- Modify className props to match your design
- Update colors in gradient classes

## Troubleshooting

### Submissions not saving
- Check Supabase connection
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check database table exists and RLS policies are set

### Images not loading in preview
- Ensure URLs are publicly accessible
- Check CORS settings
- Verify image URLs are valid

### Admin dashboard not showing submissions
- Verify `ADMIN_TOKEN` is set correctly
- Check authorization header format
- Ensure user has database access

## Security Considerations

- ✅ Form validation on client and server
- ✅ URL validation to prevent XSS
- ✅ Character limits to prevent abuse
- ✅ Admin token required for sensitive operations
- ✅ RLS policies on database table
- ⚠️ Consider adding rate limiting for production
- ⚠️ Consider adding CAPTCHA for spam prevention

## Future Enhancements

- [ ] Email notifications for new submissions
- [ ] Automatic blog metadata fetching
- [ ] Submission status tracking for users
- [ ] Bulk approval/rejection
- [ ] Custom review workflows
- [ ] Analytics on featured blogs
- [ ] Integration with email newsletter
- [ ] Social media sharing suggestions

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set
