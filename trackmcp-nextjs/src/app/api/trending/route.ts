import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    // Get trending MCPs sorted by stars (most popular)
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, github_url, language, topics, last_updated, category')
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Trending error:', error)
      return NextResponse.json({ trending: [] })
    }

    return NextResponse.json({ trending: data || [] })
  } catch (err) {
    console.error('Trending exception:', err)
    return NextResponse.json({ trending: [] })
  }
}
