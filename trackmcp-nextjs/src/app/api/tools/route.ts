import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, github_url, language, topics, last_updated, category')
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tools: data || [], count: data?.length || 0 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }
}
