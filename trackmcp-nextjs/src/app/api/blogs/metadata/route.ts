import { fetchBlogMetadata } from '@/utils/blog-metadata'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { blogs } = await request.json()

    if (!Array.isArray(blogs)) {
      return NextResponse.json(
        { error: 'Invalid request: blogs must be an array' },
        { status: 400 }
      )
    }

    // Limit to 20 blogs per request
    const limitedBlogs = blogs.slice(0, 20)

    // Fetch metadata for all blogs in parallel
    const blogMetadata = await Promise.all(
      limitedBlogs.map(async (blog) => {
        const metadata = await fetchBlogMetadata(blog.url)
        return {
          ...metadata,
          isFeatured: blog.isFeatured,
        }
      })
    )

    return NextResponse.json(
      { blogs: blogMetadata },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Error in blog metadata API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog metadata' },
      { status: 500 }
    )
  }
}
