import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findInvalidTools() {
  console.log('🔍 Finding invalid tool names...\n')
  
  // Read affected URLs
  const affectedUrls = fs.readFileSync('affected-urls.txt', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .filter(url => url.includes('/tool/'))
  
  // Extract tool names from URLs
  const toolNamesFromUrls = affectedUrls.map(url => {
    const match = url.match(/\/tool\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  }).filter(Boolean)
  
  console.log(`📋 Checking ${toolNamesFromUrls.length} tool names from affected URLs...\n`)
  
  const issues = {
    notInDatabase: [] as string[],
    invalidFormat: [] as string[],
    hasUppercase: [] as string[],
    hasSpecialChars: [] as string[],
    hasFileExtension: [] as string[],
    valid: [] as string[],
  }
  
  for (const toolName of toolNamesFromUrls) {
    if (!toolName) continue
    
    // Check if tool exists in database (case-insensitive)
    const { data: tool, error } = await supabase
      .from('mcp_tools')
      .select('repo_name')
      .ilike('repo_name', toolName)
      .single()
    
    if (error || !tool) {
      issues.notInDatabase.push(toolName)
      continue
    }
    
    // Check for various issues
    if (/[A-Z]/.test(toolName)) {
      issues.hasUppercase.push(toolName)
    }
    
    if (/[^a-zA-Z0-9_-]/.test(toolName)) {
      issues.hasSpecialChars.push(toolName)
    }
    
    if (/\.(md|txt|json|yml|yaml)$/i.test(toolName)) {
      issues.hasFileExtension.push(toolName)
    }
    
    if (!/^[a-z0-9_-]+$/.test(toolName)) {
      issues.invalidFormat.push(toolName)
    } else {
      issues.valid.push(toolName)
    }
  }
  
  // Print results
  console.log('📊 Analysis Results:')
  console.log('='.repeat(60))
  console.log(`Total checked: ${toolNamesFromUrls.length}`)
  console.log(`Not in database: ${issues.notInDatabase.length}`)
  console.log(`Has uppercase: ${issues.hasUppercase.length}`)
  console.log(`Has special chars: ${issues.hasSpecialChars.length}`)
  console.log(`Has file extension: ${issues.hasFileExtension.length}`)
  console.log(`Invalid format: ${issues.invalidFormat.length}`)
  console.log(`Valid: ${issues.valid.length}`)
  console.log('')
  
  // Show examples
  if (issues.notInDatabase.length > 0) {
    console.log('❌ NOT IN DATABASE (404 errors):')
    issues.notInDatabase.slice(0, 10).forEach(name => {
      console.log(`   - ${name}`)
    })
    if (issues.notInDatabase.length > 10) {
      console.log(`   ... and ${issues.notInDatabase.length - 10} more`)
    }
    console.log('')
  }
  
  if (issues.hasFileExtension.length > 0) {
    console.log('📄 HAS FILE EXTENSION:')
    issues.hasFileExtension.forEach(name => {
      console.log(`   - ${name}`)
    })
    console.log('')
  }
  
  if (issues.hasUppercase.length > 0) {
    console.log('🔤 HAS UPPERCASE (case mismatch):')
    issues.hasUppercase.slice(0, 10).forEach(name => {
      console.log(`   - ${name}`)
    })
    if (issues.hasUppercase.length > 10) {
      console.log(`   ... and ${issues.hasUppercase.length - 10} more`)
    }
    console.log('')
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: toolNamesFromUrls.length,
      notInDatabase: issues.notInDatabase.length,
      hasUppercase: issues.hasUppercase.length,
      hasSpecialChars: issues.hasSpecialChars.length,
      hasFileExtension: issues.hasFileExtension.length,
      invalidFormat: issues.invalidFormat.length,
      valid: issues.valid.length,
    },
    issues,
  }
  
  fs.writeFileSync('invalid-tools-report.json', JSON.stringify(report, null, 2))
  console.log('✅ Detailed report saved to: invalid-tools-report.json')
  console.log('')
  
  // Generate SQL to fix issues
  if (issues.notInDatabase.length > 0) {
    console.log('🔧 RECOMMENDED ACTIONS:')
    console.log('')
    console.log('1. Remove these URLs from sitemap (they don\'t exist):')
    console.log('   - These tools are not in your database')
    console.log('   - They should return 404 (which is correct)')
    console.log('   - Remove from sitemap.xml to stop Google indexing them')
    console.log('')
  }
  
  if (issues.hasFileExtension.length > 0) {
    console.log('2. Fix file extension issues:')
    console.log('   - CONFIG.md should not be a tool page')
    console.log('   - Remove these from database or fix the names')
    console.log('')
  }
  
  if (issues.hasUppercase.length > 0) {
    console.log('3. Normalize uppercase tool names:')
    console.log('   - Run the normalization script to convert to lowercase')
    console.log('   - This will fix canonical tag issues')
    console.log('')
  }
}

findInvalidTools().catch(console.error)
