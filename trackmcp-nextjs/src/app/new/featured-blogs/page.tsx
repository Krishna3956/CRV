import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { MobileNav } from '@/components/mobile-nav'
import { FeaturedBlogsClient } from '@/components/featured-blogs-client'
import { FEATURED_BLOGS } from '@/data/featured-blogs'
import { FileText } from 'lucide-react'

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Featured Blogs – MCP Insights & Guides on Track MCP',
    description: 'Top reads and insights from MCP creators and experts. Discover in-depth guides, tutorials, and community perspectives on Model Context Protocol.',
    openGraph: {
      title: 'Featured Blogs – MCP Insights & Guides on Track MCP',
      description: 'Top reads and insights from MCP creators and experts. Discover in-depth guides, tutorials, and community perspectives on Model Context Protocol.',
      url: 'https://www.trackmcp.com/new/featured-blogs',
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.trackmcp.com/new/featured-blogs',
    },
  }
}

async function getFeaturedBlogs() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    // Fetch approved blogs from featured_blogs table with all metadata
    const { data, error } = await supabase
      .from('featured_blogs')
      .select('*')
      .eq('is_featured', true)
      .order('approved_at', { ascending: false })

    if (error) {
      console.error('Error fetching featured blogs:', error)
      return FEATURED_BLOGS
    }

    // Convert database format to BlogMetadata format
    const dbBlogs = (data || []).map((blog) => ({
      title: blog.title,
      excerpt: blog.description,
      featuredImage: blog.hero_image,
      author: blog.author_name,
      authorAvatar: blog.author_image,
      url: blog.blog_url,
      domain: new URL(blog.blog_url).hostname.replace('www.', ''),
      isFeatured: blog.is_featured,
    }))

    // Combine with static blogs (static blogs still need metadata fetching)
    return [...dbBlogs, ...FEATURED_BLOGS]
  } catch (error) {
    console.error('Error fetching featured blogs:', error)
    return FEATURED_BLOGS
  }
}

export default async function FeaturedBlogsPage() {
  const blogs = await getFeaturedBlogs()

  return (
    <div className="min-h-screen bg-background">
      <MobileNav title="Featured Blogs" showBackButton={true} />
      <main className="container mx-auto px-4 py-12 md:py-16 pt-20 md:pt-12">
        {/* Hero Section - Enhanced */}
        <div className="mb-16">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8 md:p-16">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -ml-48 -mb-48" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Community Content</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text leading-tight">
                Featured Blogs
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                Discover top reads and insights from MCP creators and experts. Curated articles, in-depth guides, and community perspectives on Model Context Protocol.
              </p>
            </div>
          </div>
        </div>

        {/* Blog Cards Grid - With Better Spacing */}
        <div className="space-y-8">
          <FeaturedBlogsClient blogs={blogs} />
        </div>
      </main>
    </div>
  )
}
