'use client'

import { useEffect, useState } from 'react'
import { BlogCard } from './blog-card'
import { BlogMetadata } from '@/utils/blog-metadata'
import { Loader2 } from 'lucide-react'

interface FeaturedBlogsClientProps {
  blogs: {
    url: string
    isFeatured?: boolean
  }[]
}

export function FeaturedBlogsClient({ blogs }: FeaturedBlogsClientProps) {
  const [blogMetadata, setBlogMetadata] = useState<(BlogMetadata & { isFeatured?: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch metadata for all blogs
        const response = await fetch('/api/blogs/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ blogs }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch blog metadata')
        }

        const data = await response.json()
        setBlogMetadata(data.blogs || [])
      } catch (err) {
        console.error('Error fetching blogs:', err)
        setError('Failed to load blogs. Please try again later.')
        // Still show basic info even if metadata fetch fails
        setBlogMetadata(
          blogs.map((blog) => ({
            title: 'Blog Post',
            url: blog.url,
            isFeatured: blog.isFeatured,
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [blogs])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading featured blogs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (blogMetadata.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No blogs available at the moment.</p>
      </div>
    )
  }

  // Sort featured blogs first
  const sortedBlogs = [
    ...blogMetadata.filter((b) => b.isFeatured),
    ...blogMetadata.filter((b) => !b.isFeatured),
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedBlogs.map((blog) => (
        <BlogCard key={blog.url} blog={blog} isFeatured={blog.isFeatured} />
      ))}
    </div>
  )
}
