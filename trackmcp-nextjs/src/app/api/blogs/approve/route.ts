import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const { submissionId, action, adminPassword } = await request.json()

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid password' },
        { status: 401 }
      )
    }

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: 'Missing submissionId or action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get the submission
    const { data: submission, error: fetchError } = await supabase
      .from('blog_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Update submission status to approved
      const { error: updateError } = await supabase
        .from('blog_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to approve submission' },
          { status: 500 }
        )
      }

      // Add to featured_blogs table (auto-create card)
      const { error: insertError } = await supabase
        .from('featured_blogs')
        .insert([
          {
            blog_url: submission.blog_url,
            title: submission.title,
            description: submission.description,
            hero_image: submission.hero_image,
            author_name: submission.author_name,
            author_image: submission.author_image,
            is_featured: true,
            submission_id: submissionId,
            approved_at: new Date().toISOString(),
          },
        ])

      if (insertError) {
        console.error('Error adding to featured blogs:', insertError)
        // Still mark as approved even if featured_blogs insert fails
      }

      return NextResponse.json({
        success: true,
        message: 'Blog approved and added to featured list!',
      })
    } else if (action === 'reject') {
      // Update submission status to rejected
      const { error: updateError } = await supabase
        .from('blog_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reject submission' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Blog rejected.',
      })
    } else if (action === 'delete') {
      // Delete from featured_blogs table
      const { error: deleteError } = await supabase
        .from('featured_blogs')
        .delete()
        .eq('submission_id', submissionId)

      if (deleteError) {
        console.error('Error deleting from featured blogs:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete blog from featured list' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Blog deleted from featured list.',
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
