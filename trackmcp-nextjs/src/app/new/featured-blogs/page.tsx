import { Metadata } from 'next'
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

export default function FeaturedBlogsPage() {
  return (
    <div className="min-h-screen bg-background">
      <MobileNav title="Featured Blogs" showBackButton={true} />
      <main className="container mx-auto px-4 py-8 md:py-12 pt-20 md:pt-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8 md:p-12">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -ml-48 -mb-48" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-primary">Community Content</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                Featured Blogs
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mb-6">
                Top reads and insights from MCP creators and experts.
              </p>
            </div>
          </div>
        </div>

        {/* Blog Cards Grid */}
        <FeaturedBlogsClient blogs={FEATURED_BLOGS} />
      </main>
    </div>
  )
}
