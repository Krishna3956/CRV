#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking database status...\n')
  
  // Get total count
  const { count: total } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Total tools in database: ${total}`)
  
  // Get count by status
  const { count: approved } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
  
  const { count: pending } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  console.log(`✅ Approved tools (visible on website): ${approved}`)
  console.log(`⏳ Pending tools (also visible on website): ${pending}`)
  console.log(`📈 Total visible on website: ${(approved || 0) + (pending || 0)}`)
  
  // Get some recent tools
  const { data: recentTools } = await supabase
    .from('mcp_tools')
    .select('repo_name, status, stars, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  
  console.log('\n📝 Last 10 added tools:')
  recentTools?.forEach((tool, i) => {
    const statusIcon = tool.status === 'approved' ? '✅' : '⏳'
    console.log(`  ${i + 1}. ${statusIcon} ${tool.repo_name} (${tool.status}, ⭐${tool.stars})`)
  })
  
  // Check for any tools with null or unexpected status
  const { count: nullStatus } = await supabase
    .from('mcp_tools')
    .select('*', { count: 'exact', head: true })
    .is('status', null)
  
  if (nullStatus && nullStatus > 0) {
    console.log(`\n⚠️  Warning: ${nullStatus} tools have NULL status`)
  }
}

checkDatabase().catch(console.error)
