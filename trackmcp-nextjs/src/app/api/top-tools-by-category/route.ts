import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch top 100 tools for the specified category, sorted by stars
    const { data: tools, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, category, last_updated')
      .eq('category', category)
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
    }

    return NextResponse.json({ tools: tools || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
