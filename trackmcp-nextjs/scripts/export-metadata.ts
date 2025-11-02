import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
const envPath = join(process.cwd(), '.env.local')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      process.env[key.trim()] = value
    }
  })
} catch (error) {
  console.error('⚠️  Could not load .env.local file')
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('   Please ensure .env.local has:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

type McpTool = {
  id: string
  repo_name: string | null
  description: string | null
  stars: number | null
  language: string | null
  topics: string[] | null
  github_url: string | null
}

// Smart metadata generator (same logic as in page.tsx)
function generateSmartMetadata(tool: McpTool) {
  const toolName = tool.repo_name || 'Unknown Tool'
  const stars = tool.stars || 0
  const language = tool.language || ''
  const topics = tool.topics || []
  const description = tool.description || 'Model Context Protocol tool'
  
  // Generate smart, SEO-optimized title (50-60 chars ideal)
  const smartTitle = stars > 1000 
    ? `${toolName} - ${stars.toLocaleString()}⭐ MCP Tool`
    : stars > 100
    ? `${toolName} - Popular MCP Tool (${stars.toLocaleString()}⭐)`
    : `${toolName} - MCP Tool for ${language || 'Developers'}`
  
  // Generate targeted description (150-160 chars ideal)
  let smartDescription = description
  
  if (description.length > 155) {
    smartDescription = `${description.slice(0, 152)}...`
  } else if (description.length < 120) {
    const contextParts = []
    
    if (stars > 100) {
      contextParts.push(`⭐ ${stars.toLocaleString()} stars`)
    }
    
    if (language && !description.toLowerCase().includes(language.toLowerCase())) {
      contextParts.push(`${language} implementation`)
    }
    
    if (!description.toLowerCase().includes('mcp') && !description.toLowerCase().includes('model context protocol')) {
      contextParts.push('MCP tool for AI development')
    }
    
    const context = contextParts.length > 0 ? `. ${contextParts.join('. ')}.` : ''
    smartDescription = `${description}${context}`.slice(0, 160)
  }
  
  // Generate smart keywords
  const smartKeywords = [
    toolName,
    `${toolName} MCP`,
    'MCP tool',
    'Model Context Protocol',
    language ? `${language} MCP` : '',
    ...topics.slice(0, 5),
    stars > 1000 ? 'popular MCP tool' : '',
    stars > 100 ? 'trending MCP tool' : '',
  ].filter(Boolean).join(', ')
  
  return { smartTitle, smartDescription, smartKeywords }
}

async function exportMetadata() {
  console.log('🚀 Starting metadata export...\n')
  
  // Fetch all tools
  let allTools: McpTool[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  console.log('📥 Fetching tools from database...')
  while (hasMore) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, stars, language, topics, github_url')
      .in('status', ['approved', 'pending'])
      .order('stars', { ascending: false })
      .range(from, from + batchSize - 1)

    if (error || !data || data.length === 0) {
      hasMore = false
    } else {
      allTools = [...allTools, ...data]
      console.log(`   Fetched ${allTools.length} tools...`)
      from += batchSize
      if (data.length < batchSize) {
        hasMore = false
      }
    }
  }

  console.log(`\n✅ Fetched ${allTools.length} tools\n`)
  console.log('🔄 Generating metadata...\n')

  // Generate metadata for all tools
  const metadata = []
  
  // Add homepage
  metadata.push({
    'Page Type': 'Homepage',
    'URL': 'https://www.trackmcp.com',
    'Meta Title': 'Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers',
    'Meta Description': 'Explore the world\'s largest directory of Model Context Protocol (MCP) tools, servers, and connectors. Search 10,000+ GitHub repositories for AI development, LLM integration, and developer tools.',
    'Meta Keywords': 'MCP, Model Context Protocol, AI tools, LLM tools, GitHub MCP, developer tools, MCP servers, MCP connectors, AI development',
    'Stars': '',
    'Language': '',
    'Topics': '',
  })

  // Add tool pages
  let processed = 0
  for (const tool of allTools) {
    const { smartTitle, smartDescription, smartKeywords } = generateSmartMetadata(tool)
    
    metadata.push({
      'Page Type': 'Tool Page',
      'URL': `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`,
      'Meta Title': smartTitle,
      'Meta Description': smartDescription,
      'Meta Keywords': smartKeywords,
      'Stars': tool.stars || 0,
      'Language': tool.language || '',
      'Topics': (tool.topics || []).join(', '),
    })
    
    processed++
    if (processed % 100 === 0) {
      console.log(`   Processed ${processed}/${allTools.length} tools...`)
    }
  }

  console.log(`\n✅ Generated metadata for ${metadata.length} pages\n`)

  // Convert to CSV
  console.log('📝 Creating CSV file...\n')
  const headers = Object.keys(metadata[0])
  const csvRows = [
    headers.join(','),
    ...metadata.map(row => 
      headers.map(header => {
        const value = String(row[header as keyof typeof row] || '')
        // Escape quotes and wrap in quotes if contains comma
        return value.includes(',') || value.includes('"') || value.includes('\n')
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(',')
    )
  ]
  
  const csv = csvRows.join('\n')
  
  // Save to file
  const outputPath = join(process.cwd(), 'metadata-export.csv')
  writeFileSync(outputPath, csv, 'utf-8')
  
  console.log('✅ CSV file created successfully!\n')
  console.log(`📁 Location: ${outputPath}\n`)
  
  // Print summary
  console.log('📊 Summary:')
  console.log(`   Total pages: ${metadata.length}`)
  console.log(`   Homepage: 1`)
  console.log(`   Tool pages: ${allTools.length}`)
  console.log(`   Average title length: ${Math.round(metadata.reduce((sum, m) => sum + m['Meta Title'].length, 0) / metadata.length)} chars`)
  console.log(`   Average description length: ${Math.round(metadata.reduce((sum, m) => sum + m['Meta Description'].length, 0) / metadata.length)} chars`)
  console.log('\n✨ Done!\n')
}

// Run the export
exportMetadata().catch(console.error)
