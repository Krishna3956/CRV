/**
 * Generate Meta Descriptions Script
 * Fetches all tools from Supabase and generates SEO-optimized meta descriptions
 * 
 * Usage:
 *   npx tsx scripts/generateMetaDescriptions.ts
 * 
 * This script:
 * 1. Fetches all tools from Supabase
 * 2. Generates meta descriptions using createMetaDescription()
 * 3. Saves them to the meta_description column
 * 4. Logs statistics and results
 */

import { createClient } from '@supabase/supabase-js'
import { createMetaDescription, extractReadmePreview } from '../src/utils/metaDescription'
import type { Database } from '../src/types/database.types'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

interface ToolRow {
  id: string
  repo_name: string | null
  description: string | null
  topics: string[] | null
  language: string | null
  readme?: string | null
  meta_description?: string | null
}

/**
 * Fetch all tools from Supabase
 */
async function fetchAllTools(): Promise<ToolRow[]> {
  console.log('📥 Fetching tools WITHOUT meta descriptions...')

  const { data, error, count } = await supabase
    .from('mcp_tools')
    .select('id, repo_name, description, topics, language', { count: 'exact' })
    .is('meta_description', null)  // Only fetch tools missing meta_description
    .order('stars', { ascending: false })
    .range(0, 10000)  // Fetch up to 10000 tools

  if (error) {
    console.error('❌ Error fetching tools:', error.message)
    throw error
  }

  console.log(`✅ Fetched ${data?.length || 0} tools without meta descriptions (Total in DB: ${count || 0})`)
  return data || []
}

/**
 * Generate meta description for a tool
 */
function generateMetaDesc(tool: ToolRow): string {
  return createMetaDescription({
    repo_name: tool.repo_name,
    description: tool.description,
    topics: tool.topics,
    language: tool.language,
  })
}

/**
 * Update meta descriptions in Supabase
 */
async function updateMetaDescriptions(
  tools: ToolRow[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  console.log(`\n🔄 Generating meta descriptions for ${tools.length} tools...`)

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  // Process in batches to avoid overwhelming the API
  const batchSize = 100
  for (let i = 0; i < tools.length; i += batchSize) {
    const batch = tools.slice(i, i + batchSize)
    const updates = batch.map(tool => ({
      id: tool.id,
      meta_description: generateMetaDesc(tool),
    }))

    try {
      // Update each tool individually to avoid constraint issues
      for (const update of updates) {
        const { error } = await supabase
          .from('mcp_tools')
          .update({ meta_description: update.meta_description } as any)
          .eq('id', update.id)

        if (error) {
          results.failed++
        } else {
          results.success++
        }
      }
      
      console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tools.length / batchSize)} (${batch.length} tools)`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`❌ Unexpected error in batch:`, errorMsg)
      results.failed += batch.length
      results.errors.push(`Batch error: ${errorMsg}`)
    }
  }

  return results
}

/**
 * Verify meta descriptions were saved
 */
async function verifyMetaDescriptions(): Promise<{
  total: number
  withMetaDesc: number
  percentage: number
}> {
  console.log('\n✔️ Verifying meta descriptions...')

  const { data, error } = await supabase
    .from('mcp_tools')
    .select('id, repo_name, meta_description')
    .not('meta_description', 'is', null)

  if (error) {
    console.error('❌ Error verifying:', error.message)
    return { total: 0, withMetaDesc: 0, percentage: 0 }
  }

  const { count, error: countError } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error counting tools:', countError.message)
    return { total: 0, withMetaDesc: data?.length || 0, percentage: 0 }
  }

  const total = count || 0
  const withMetaDesc = data?.length || 0
  const percentage = total > 0 ? Math.round((withMetaDesc / total) * 100) : 0

  console.log(`✅ Verification complete:`)
  console.log(`   Total tools: ${total}`)
  console.log(`   With meta descriptions: ${withMetaDesc}`)
  console.log(`   Coverage: ${percentage}%`)

  return { total, withMetaDesc, percentage }
}

/**
 * Display sample meta descriptions
 */
async function displaySamples(): Promise<void> {
  console.log('\n📋 Sample meta descriptions:')

  const { data, error } = await supabase
    .from('mcp_tools')
    .select('repo_name, description, meta_description')
    .not('meta_description', 'is', null)
    .limit(5)

  if (error) {
    console.error('❌ Error fetching samples:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('   No samples available')
    return
  }

  data.forEach((tool: any, index: number) => {
    console.log(`\n   ${index + 1}. ${tool.repo_name}`)
    console.log(`      Original: ${tool.description?.substring(0, 60)}...`)
    console.log(`      Meta: "${tool.meta_description}"`)
    console.log(`      Length: ${tool.meta_description?.length || 0} chars`)
  })
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🚀 Starting meta description generation...\n')

  try {
    // Fetch all tools
    const tools = await fetchAllTools()

    if (tools.length === 0) {
      console.log('⚠️ No tools found in database')
      process.exit(0)
    }

    // Generate and update meta descriptions
    const updateResults = await updateMetaDescriptions(tools)

    console.log(`\n📊 Update Results:`)
    console.log(`   ✅ Successful: ${updateResults.success}`)
    console.log(`   ❌ Failed: ${updateResults.failed}`)

    if (updateResults.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered:`)
      updateResults.errors.forEach(err => console.log(`   - ${err}`))
    }

    // Verify results
    const verification = await verifyMetaDescriptions()

    // Display samples
    await displaySamples()

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Meta description generation complete!')
    console.log('='.repeat(60))
    console.log(`\nSummary:`)
    console.log(`  • Generated: ${updateResults.success} meta descriptions`)
    console.log(`  • Coverage: ${verification.percentage}% of tools`)
    console.log(`  • Timestamp: ${new Date().toISOString()}`)

    if (verification.percentage === 100) {
      console.log('\n🎉 All tools have meta descriptions!')
    } else if (verification.percentage >= 90) {
      console.log(`\n⚠️ ${100 - verification.percentage}% of tools still need meta descriptions`)
    }

    process.exit(updateResults.failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run the script
main()
