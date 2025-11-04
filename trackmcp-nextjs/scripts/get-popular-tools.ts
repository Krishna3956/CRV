import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function getPopularTools() {
  const { data: tools, error } = await supabase
    .from('mcp_tools')
    .select('repo_name, description, stars')
    .order('stars', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Top 10 Most Popular MCP Tools:\n')
  tools?.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.repo_name}`)
    console.log(`   Stars: ${tool.stars}`)
    console.log(`   Description: ${tool.description?.slice(0, 80)}...`)
    console.log('')
  })
}

getPopularTools()
