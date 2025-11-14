import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createClient()
  
  try {
    // Search in repo_name, description, and topics
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, github_url, language, topics, last_updated, category')
      .in('status', ['approved', 'pending'])
      .or(`repo_name.ilike.%${query}%,description.ilike.%${query}%,topics.cs.{${query}}`)
      .order('stars', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ results: [] })
    }

    return NextResponse.json({ results: data || [] })
  } catch (err) {
    console.error('Search exception:', err)
    return NextResponse.json({ results: [] })
  }
}
