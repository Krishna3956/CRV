-- Create featured_blogs table to store approved blogs
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_featured_blogs_is_featured ON featured_blogs(is_featured);
CREATE INDEX IF NOT EXISTS idx_featured_blogs_approved_at ON featured_blogs(approved_at DESC);

-- Enable RLS
ALTER TABLE featured_blogs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read" ON featured_blogs
  FOR SELECT
  USING (true);
