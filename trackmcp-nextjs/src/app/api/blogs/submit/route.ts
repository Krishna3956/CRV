import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface BlogSubmission {
  title: string
  description: string
  heroImage: string
  authorName: string
  authorImage: string
  blogUrl: string
  submittedAt?: string
  status?: 'pending' | 'approved' | 'rejected'
}

export async function POST(request: NextRequest) {
  try {
    const body: BlogSubmission = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.heroImage || !body.authorName || !body.authorImage || !body.blogUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate URLs
    try {
      new URL(body.heroImage)
      new URL(body.authorImage)
      new URL(body.blogUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate text lengths
    if (body.title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 100 characters or less' },
        { status: 400 }
      )
    }

    if (body.description.length > 300) {
      return NextResponse.json(
        { error: 'Description must be 300 characters or less' },
        { status: 400 }
      )
    }

    if (body.authorName.length > 50) {
      return NextResponse.json(
        { error: 'Author name must be 50 characters or less' },
        { status: 400 }
      )
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('blog_submissions')
      .insert([
        {
          title: body.title,
          description: body.description,
          hero_image: body.heroImage,
          author_name: body.authorName,
          author_image: body.authorImage,
          blog_url: body.blogUrl,
          submitted_at: new Date().toISOString(),
          status: 'pending',
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      const errorMessage = error.message || 'Failed to submit blog'
      return NextResponse.json(
        { error: `Database error: ${errorMessage}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Blog submitted successfully! We will review it and add it to our featured blogs.',
        data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch pending submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check for admin token
    const authHeader = request.headers.get('authorization')
    const adminToken = process.env.ADMIN_TOKEN

    if (!authHeader || !adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('blog_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
