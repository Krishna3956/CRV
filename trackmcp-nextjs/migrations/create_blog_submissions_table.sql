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

-- Create policy for authenticated users to view their own submissions
CREATE POLICY "Allow users to view submissions" ON blog_submissions
  FOR SELECT
  USING (true);

-- Create policy for admin to update submissions
CREATE POLICY "Allow admin to update submissions" ON blog_submissions
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
