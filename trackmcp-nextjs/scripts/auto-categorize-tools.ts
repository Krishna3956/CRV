import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Category keywords mapping
const CATEGORY_KEYWORDS = {
  'AI & Machine Learning': [
    'ai', 'ml', 'machine learning', 'neural', 'model', 'gpt', 'llm', 'openai', 'anthropic',
    'claude', 'chatgpt', 'embedding', 'vector', 'rag', 'semantic', 'nlp', 'natural language',
    'tensorflow', 'pytorch', 'huggingface', 'langchain', 'ollama', 'inference', 'training'
  ],
  'Developer Kits': [
    'sdk', 'api', 'framework', 'library', 'toolkit', 'dev', 'development', 'boilerplate',
    'template', 'starter', 'scaffold', 'cli', 'tool', 'utility', 'helper', 'package'
  ],
  'Servers & Infrastructure': [
    'server', 'backend', 'infrastructure', 'cloud', 'aws', 'azure', 'gcp', 'docker',
    'kubernetes', 'k8s', 'deployment', 'hosting', 'vercel', 'netlify', 'heroku',
    'database', 'postgres', 'mysql', 'mongodb', 'redis', 'supabase', 'firebase'
  ],
  'Search & Data Retrieval': [
    'search', 'query', 'find', 'lookup', 'retrieve', 'fetch', 'scrape', 'crawl',
    'index', 'elasticsearch', 'algolia', 'data', 'information', 'knowledge', 'wiki'
  ],
  'Automation & Productivity': [
    'automation', 'workflow', 'task', 'schedule', 'cron', 'productivity', 'efficiency',
    'organize', 'manage', 'todo', 'note', 'reminder', 'calendar', 'time', 'tracking'
  ],
  'Web & Internet Tools': [
    'web', 'browser', 'http', 'url', 'website', 'html', 'css', 'javascript', 'frontend',
    'react', 'vue', 'angular', 'next', 'scraping', 'selenium', 'puppeteer', 'playwright'
  ],
  'Communication': [
    'chat', 'message', 'email', 'notification', 'slack', 'discord', 'telegram', 'whatsapp',
    'sms', 'communication', 'social', 'twitter', 'linkedin', 'facebook', 'reddit'
  ],
  'File & Data Management': [
    'file', 'filesystem', 'storage', 'upload', 'download', 'sync', 'backup', 'archive',
    'compress', 'zip', 'pdf', 'document', 'spreadsheet', 'csv', 'json', 'xml', 'yaml',
    's3', 'drive', 'dropbox', 'onedrive'
  ]
}

function categorizeByKeywords(text: string): string | null {
  const lowerText = text.toLowerCase()
  
  // Score each category
  const scores: Record<string, number> = {}
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[category]++
      }
    }
  }
  
  // Find category with highest score
  let maxScore = 0
  let bestCategory: string | null = null
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      bestCategory = category
    }
  }
  
  // Only return a category if we have at least 1 keyword match
  return maxScore > 0 ? bestCategory : null
}

async function autoCategorizeTool(tool: any): Promise<string> {
  const searchText = [
    tool.repo_name || '',
    tool.description || '',
    ...(tool.topics || [])
  ].join(' ')
  
  const category = categorizeByKeywords(searchText)
  return category || 'Others'
}

async function categorizeTool() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('Fetching tools with category "Others" or null...')
  
  // Fetch all tools with "Others" or null category
  let allTools: any[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, topics, category')
      .in('status', ['approved', 'pending'])
      .or('category.eq.Others,category.is.null')
      .range(from, from + batchSize - 1)

    if (error) {
      console.error(`Error fetching batch at ${from}:`, error)
      hasMore = false
    } else if (!data || data.length === 0) {
      hasMore = false
    } else {
      console.log(`Fetched ${data.length} tools (offset: ${from}, total: ${allTools.length + data.length})`)
      allTools = [...allTools, ...data]
      from += batchSize
      if (data.length < batchSize) {
        hasMore = false
      }
    }
  }

  console.log(`\nTotal tools to categorize: ${allTools.length}`)
  
  if (allTools.length === 0) {
    console.log('No tools need categorization!')
    return
  }

  // Categorize each tool
  const updates: Array<{ id: number; category: string }> = []
  const categoryCounts: Record<string, number> = {}
  
  for (const tool of allTools) {
    const newCategory = await autoCategorizeTool(tool)
    updates.push({ id: tool.id, category: newCategory })
    categoryCounts[newCategory] = (categoryCounts[newCategory] || 0) + 1
  }

  console.log('\n📊 Category Distribution:')
  for (const [category, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${category}: ${count} tools`)
  }

  console.log('\n🔄 Updating database...')
  
  // Update in batches
  let updated = 0
  const updateBatchSize = 100
  
  for (let i = 0; i < updates.length; i += updateBatchSize) {
    const batch = updates.slice(i, i + updateBatchSize)
    
    for (const update of batch) {
      const { error } = await supabase
        .from('mcp_tools')
        .update({ category: update.category })
        .eq('id', update.id)
      
      if (error) {
        console.error(`Error updating tool ${update.id}:`, error)
      } else {
        updated++
      }
    }
    
    console.log(`   Updated ${Math.min(i + updateBatchSize, updates.length)}/${updates.length} tools`)
  }

  console.log(`\n✅ Successfully categorized ${updated} tools!`)
}

categorizeTool().catch(console.error)
