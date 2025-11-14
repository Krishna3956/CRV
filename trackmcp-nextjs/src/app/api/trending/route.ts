import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, category, last_updated')
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Trending error:', error)
      return NextResponse.json(
        { trending: [] },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    return NextResponse.json(
      {
        trending: data || []
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  } catch (err) {
    console.error('Trending API error:', err)
    return NextResponse.json(
      { trending: [] },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  }
}
