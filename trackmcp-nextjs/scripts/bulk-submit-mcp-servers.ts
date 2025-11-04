#!/usr/bin/env tsx

/**
 * Bulk MCP Server Submission Script
 * 
 * This script allows you to submit multiple MCP servers to the database automatically.
 * It reads from a JSON file containing GitHub URLs and submits them in batches.
 * 
 * Usage:
 *   npx tsx scripts/bulk-submit-mcp-servers.ts <input-file.json>
 * 
 * Example:
 *   npx tsx scripts/bulk-submit-mcp-servers.ts scripts/mcp-servers-to-submit.json
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { Database } from '@/types/database.types'

// Configuration
const BATCH_SIZE = 5 // Number of concurrent requests
const DELAY_BETWEEN_BATCHES = 2000 // 2 seconds delay between batches to avoid rate limiting

// Banned repositories (same as frontend)
const BANNED_REPOS = [
  'https://github.com/punkpeye/awesome-mcp-servers',
  'https://github.com/habitoai/awesome-mcp-servers',
]

interface GitHubRepo {
  name: string
  description: string | null
  stargazers_count: number
  language: string | null
  topics: string[]
  updated_at: string
}

interface SubmissionResult {
  url: string
  status: 'success' | 'error' | 'duplicate' | 'banned'
  message: string
  repoName?: string
}

// Initialize Supabase client with service role key for backend operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// GitHub token for API requests
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN

/**
 * Validate GitHub URL format
 */
function validateGithubUrl(url: string): boolean {
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
  return githubRegex.test(url)
}

/**
 * Check if repository is banned
 */
function isBannedRepo(url: string): boolean {
  const normalizedUrl = url.replace(/\/$/, '').toLowerCase()
  return BANNED_REPOS.some(banned => normalizedUrl === banned.toLowerCase())
}

/**
 * Fetch repository data from GitHub API
 */
async function fetchGitHubRepo(url: string): Promise<GitHubRepo> {
  const urlParts = url.replace(/\/$/, '').split('/')
  const owner = urlParts[urlParts.length - 2]
  const repo = urlParts[urlParts.length - 1]

    const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  }

  // Check for GitHub token in multiple possible environment variables
  const githubToken = process.env.GITHUB_TOKEN || 
                    process.env.NEXT_PUBLIC_GITHUB_TOKEN ||
                    process.env.REACT_APP_GITHUB_TOKEN;

  if (githubToken) {
    console.log('ℹ️ Using GitHub token for API requests')
    headers['Authorization'] = `token ${githubToken}`
  } else {
    console.warn('⚠️ No GitHub token found. Using unauthenticated requests (limited to 60 requests/hour)')
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found')
    }
    if (response.status === 403) {
      const rateLimit = response.headers.get('X-RateLimit-Limit') || '60';
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining') || '0';
      const rateLimitReset = response.headers.get('X-RateLimit-Reset') || '';
      const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'unknown';
      
      throw new Error(`GitHub API rate limit exceeded (${rateLimitRemaining}/${rateLimit} remaining, resets at ${resetTime}). Please add a GitHub Personal Access Token to your .env.local file as GITHUB_TOKEN.`);
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Submit a single MCP server to the database
 */
async function submitMcpServer(githubUrl: string): Promise<SubmissionResult> {
  try {
    // Validate URL format
    if (!validateGithubUrl(githubUrl)) {
      return {
        url: githubUrl,
        status: 'error',
        message: 'Invalid GitHub URL format',
      }
    }

    // Check if banned
    if (isBannedRepo(githubUrl)) {
      return {
        url: githubUrl,
        status: 'banned',
        message: 'Repository is banned from submission',
      }
    }

    // Fetch repository data
    const repoData = await fetchGitHubRepo(githubUrl)

    // Insert into database
    const { error } = await supabase.from('mcp_tools').insert({
      github_url: githubUrl,
      repo_name: repoData.name.toLowerCase(),
      description: repoData.description || null,
      stars: repoData.stargazers_count || 0,
      language: repoData.language || null,
      topics: repoData.topics || [],
      last_updated: repoData.updated_at || new Date().toISOString(),
      status: 'pending',
    })

    if (error) {
      if (error.code === '23505') {
        return {
          url: githubUrl,
          status: 'duplicate',
          message: 'Already exists in database',
          repoName: repoData.name,
        }
      }
      throw error
    }

    return {
      url: githubUrl,
      status: 'success',
      message: 'Successfully submitted',
      repoName: repoData.name,
    }
  } catch (error) {
    return {
      url: githubUrl,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Process URLs in batches
 */
async function processBatch(urls: string[]): Promise<SubmissionResult[]> {
  const results: SubmissionResult[] = []
  
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE)
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(urls.length / BATCH_SIZE)} (${batch.length} URLs)...`)
    
    const batchResults = await Promise.all(
      batch.map(url => submitMcpServer(url))
    )
    
    results.push(...batchResults)
    
    // Print batch results
    batchResults.forEach(result => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'duplicate' ? '⚠️' : 
                   result.status === 'banned' ? '🚫' : '❌'
      const name = result.repoName ? ` (${result.repoName})` : ''
      console.log(`${icon} ${result.url}${name}: ${result.message}`)
    })
    
    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < urls.length) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }
  
  return results
}

/**
 * Print summary statistics
 */
function printSummary(results: SubmissionResult[]) {
  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    duplicate: results.filter(r => r.status === 'duplicate').length,
    banned: results.filter(r => r.status === 'banned').length,
    error: results.filter(r => r.status === 'error').length,
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 SUBMISSION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total URLs processed:  ${summary.total}`)
  console.log(`✅ Successfully added:  ${summary.success}`)
  console.log(`⚠️  Already existed:     ${summary.duplicate}`)
  console.log(`🚫 Banned repos:        ${summary.banned}`)
  console.log(`❌ Errors:              ${summary.error}`)
  console.log('='.repeat(60))

  // Print errors if any
  const errors = results.filter(r => r.status === 'error')
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:')
    errors.forEach(err => {
      console.log(`  • ${err.url}: ${err.message}`)
    })
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('❌ Error: No input file specified')
    console.error('\nUsage:')
    console.error('  npx tsx scripts/bulk-submit-mcp-servers.ts <input-file.json>')
    console.error('\nExample:')
    console.error('  npx tsx scripts/bulk-submit-mcp-servers.ts scripts/mcp-servers-to-submit.json')
    process.exit(1)
  }

  const inputFile = args[0]
  
  try {
    console.log('🚀 Bulk MCP Server Submission Script')
    console.log('='.repeat(60))
    console.log(`📁 Reading input file: ${inputFile}`)
    
    const fileContent = readFileSync(inputFile, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // Support both array format and object with urls array
    const urls: string[] = Array.isArray(data) ? data : data.urls || []
    
    if (urls.length === 0) {
      console.error('❌ Error: No URLs found in input file')
      console.error('Expected format: ["url1", "url2", ...] or {"urls": ["url1", "url2", ...]}')
      process.exit(1)
    }
    
    console.log(`📝 Found ${urls.length} URLs to process`)
    
    if (GITHUB_TOKEN) {
      console.log('✅ GitHub token detected (higher rate limits)')
    } else {
      console.log('⚠️  No GitHub token found (limited to 60 requests/hour)')
      console.log('   Set GITHUB_TOKEN in .env for higher rate limits')
    }
    
    // Process all URLs
    const results = await processBatch(urls)
    
    // Print summary
    printSummary(results)
    
    console.log('\n✨ Done!')
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run the script
main()
