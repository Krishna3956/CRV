import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Map site names to categories (must match actual database categories)
const SITE_NAME_CATEGORY_MAP: { [key: string]: string } = {
  'GitHub': 'Developer Kits',
  'Stack Overflow': 'Developer Kits',
  'Medium': 'Web & Internet Tools',
  'Dev.to': 'Developer Kits',
  'Twitter': 'Communication',
  'LinkedIn': 'Communication',
  'Reddit': 'Communication',
  'Hacker News': 'Web & Internet Tools',
  'Product Hunt': 'Web & Internet Tools',
  'OpenAI': 'AI & Machine Learning',
  'Anthropic': 'AI & Machine Learning',
  'Google': 'AI & Machine Learning',
  'Hugging Face': 'AI & Machine Learning',
  'Kaggle': 'File & Data Management',
  'Jupyter': 'Developer Kits',
  'Google Colab': 'Developer Kits',
  'localhost': 'AI & Machine Learning',
}

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
    const siteName = searchParams.get('siteName')
    const url = searchParams.get('url')

    if (!siteName) {
      return NextResponse.json(
        {
          siteName: '',
          category: '',
          mcps: []
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    // Determine category from site name
    // If site name is not in our map, use a smart default based on common patterns
    let category = SITE_NAME_CATEGORY_MAP[siteName]
    
    if (!category) {
      // Smart defaults for unmapped sites
      if (siteName.includes('github') || siteName.includes('gitlab') || siteName.includes('dev')) {
        category = 'Developer Kits'
      } else if (siteName.includes('ai') || siteName.includes('llm') || siteName.includes('claude') || siteName.includes('gpt')) {
        category = 'AI & Machine Learning'
      } else if (siteName.includes('search') || siteName.includes('data')) {
        category = 'Search & Data Retrieval'
      } else {
        // Default to AI & Machine Learning for most sites
        category = 'AI & Machine Learning'
      }
    }

    const supabase = createClient()

    // Fetch MCPs for this category
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, category')
      .eq('category', category)
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .limit(10)

    if (error) {
      console.error('MCP lookup error:', error)
      return NextResponse.json(
        {
          siteName,
          category,
          mcps: []
        },
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
        siteName,
        category,
        mcps: data || []
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
    console.error('MCP lookup API error:', err)
    return NextResponse.json(
      {
        siteName: '',
        category: '',
        mcps: []
      },
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
