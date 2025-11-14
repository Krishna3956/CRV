import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { results: [] },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    const supabase = createClient()

    // Search across all tools with batch fetching for free plan
    let allResults: any[] = []
    let offset = 0
    const batchSize = 1000

    while (allResults.length < 100) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('id, repo_name, description, stars, category, last_updated')
        .in('status', ['approved', 'pending'])
        .or(`repo_name.ilike.%${q}%,description.ilike.%${q}%`)
        .order('stars', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error('Search error:', error)
        break
      }

      if (!data || data.length === 0) {
        break
      }

      allResults = [...allResults, ...data]
      offset += batchSize

      if (data.length < batchSize) {
        break
      }
    }

    return NextResponse.json(
      {
        results: allResults.slice(0, 100),
        total: allResults.length,
        query: q
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
    console.error('Search API error:', err)
    return NextResponse.json(
      { error: 'Search failed' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  }
}
