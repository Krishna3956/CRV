import { createClient } from '@supabase/supabase-js'

// Environment variables are automatically loaded by Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Tool {
  id: string
  repo_name: string | null
  github_url: string | null
}

async function findBrokenTools() {
  console.log('🔍 Fetching all tools from database...\n')

  // Fetch all tools
  const { data: tools, error } = await supabase
    .from('mcp_tools')
    .select('id, repo_name, github_url')
    .order('stars', { ascending: false })

  if (error) {
    console.error('❌ Error fetching tools:', error)
    process.exit(1)
  }

  if (!tools || tools.length === 0) {
    console.log('⚠️  No tools found in database')
    return
  }

  console.log(`📊 Found ${tools.length} tools. Checking for issues...\n`)

  const brokenTools: Array<{ repo_name: string; reason: string }> = []
  const validTools: string[] = []

  for (const tool of tools as Tool[]) {
    // Check 1: Missing repo_name
    if (!tool.repo_name || tool.repo_name.trim() === '') {
      brokenTools.push({
        repo_name: tool.id,
        reason: 'Missing repo_name'
      })
      continue
    }

    // Check 2: Missing github_url
    if (!tool.github_url || tool.github_url.trim() === '') {
      brokenTools.push({
        repo_name: tool.repo_name,
        reason: 'Missing github_url'
      })
      continue
    }

    // Check 3: Test if tool can be found by repo_name (simulate detail page lookup)
    const { data: foundTool, error: lookupError } = await supabase
      .from('mcp_tools')
      .select('id')
      .eq('repo_name', tool.repo_name)
      .single()

    if (lookupError || !foundTool) {
      brokenTools.push({
        repo_name: tool.repo_name,
        reason: 'Cannot be found by repo_name (would cause 404)'
      })
      continue
    }

    // Check 4: Invalid characters in repo_name that might break URLs
    const invalidChars = /[<>:"\/\\|?*\x00-\x1F]/
    if (invalidChars.test(tool.repo_name)) {
      brokenTools.push({
        repo_name: tool.repo_name,
        reason: 'Contains invalid URL characters'
      })
      continue
    }

    validTools.push(tool.repo_name)
  }

  // Print results
  console.log('═'.repeat(80))
  console.log('📋 RESULTS')
  console.log('═'.repeat(80))
  console.log(`✅ Valid tools: ${validTools.length}`)
  console.log(`❌ Broken tools: ${brokenTools.length}`)
  console.log()

  if (brokenTools.length > 0) {
    console.log('🚫 BROKEN TOOLS (would cause 404 errors):')
    console.log('─'.repeat(80))
    
    brokenTools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.repo_name}`)
      console.log(`   Reason: ${tool.reason}`)
      console.log()
    })

    console.log('─'.repeat(80))
    console.log('\n📝 To block these tools, add them to the blockedRepos array:')
    console.log('\nconst blockedRepos = [')
    brokenTools.forEach(tool => {
      console.log(`  '${tool.repo_name.toLowerCase()}',`)
    })
    console.log(']')
    console.log()

    // Generate updated blockedRepos array
    const blockedReposList = brokenTools.map(t => `'${t.repo_name.toLowerCase()}'`).join(', ')
    console.log('─'.repeat(80))
    console.log('📋 Copy-paste ready array:')
    console.log(`const blockedRepos = [${blockedReposList}]`)
    console.log()
  } else {
    console.log('✨ All tools are valid! No 404s detected.')
  }

  console.log('═'.repeat(80))
  console.log('✅ Scan complete!')
}

// Run the script
findBrokenTools().catch(console.error)
