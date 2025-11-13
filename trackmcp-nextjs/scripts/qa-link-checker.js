#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// List of all pages to check
const pagesToCheck = [
  '/',
  '/about',
  '/category',
  '/categories',
  '/top-mcp',
  '/new',
  '/new/featured-blogs',
  '/submit-mcp',
  '/privacy',
  '/terms',
  '/cookies',
]

// Extract all links from HTML
function extractLinks(html) {
  const linkRegex = /href=["']([^"']+)["']/g
  const links = []
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1])
  }

  return links
}

// Check if a link is valid
async function checkLink(link, baseUrl) {
  try {
    // Skip external links, anchors, and special links
    if (
      link.startsWith('http://') ||
      link.startsWith('https://') ||
      link.startsWith('mailto:') ||
      link.startsWith('tel:') ||
      link.startsWith('#') ||
      link.startsWith('javascript:') ||
      link === '/'
    ) {
      return {
        url: link,
        status: 200,
        statusText: 'OK (External/Special)',
        isValid: true,
      }
    }

    // Build full URL
    const fullUrl = new URL(link, baseUrl).toString()

    // Fetch the page
    const response = await fetch(fullUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
      },
    })

    return {
      url: link,
      status: response.status,
      statusText: response.statusText,
      isValid: response.status >= 200 && response.status < 400,
    }
  } catch (error) {
    return {
      url: link,
      status: 0,
      statusText: 'Error',
      isValid: false,
      error: error.message || 'Unknown error',
    }
  }
}

// Check a single page
async function checkPage(page, baseUrl) {
  try {
    const fullUrl = new URL(page, baseUrl).toString()
    console.log(`\n📄 Checking page: ${page}`)

    const response = await fetch(fullUrl)
    if (!response.ok) {
      console.log(`   ❌ Page not found (${response.status})`)
      return {
        page,
        links: [],
        brokenLinks: [],
      }
    }

    const html = await response.text()
    const links = extractLinks(html)
    const uniqueLinks = [...new Set(links)]

    console.log(`   Found ${uniqueLinks.length} unique links`)

    // Check each link
    const linkResults = []
    for (const link of uniqueLinks) {
      const result = await checkLink(link, baseUrl)
      linkResults.push(result)

      if (!result.isValid) {
        console.log(`   ❌ Broken: ${link} (${result.status} ${result.statusText})`)
      }
    }

    const brokenLinks = linkResults.filter(l => !l.isValid)

    return {
      page,
      links: linkResults,
      brokenLinks,
    }
  } catch (error) {
    console.log(`   ❌ Error checking page: ${error.message || 'Unknown error'}`)
    return {
      page,
      links: [],
      brokenLinks: [],
    }
  }
}

// Main function
async function runQA() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  console.log(`\n🚀 Starting comprehensive link QA...`)
  console.log(`📍 Base URL: ${baseUrl}\n`)

  const results = []

  // Check all pages
  for (const page of pagesToCheck) {
    const result = await checkPage(page, baseUrl)
    results.push(result)
  }

  // Summary
  console.log('\n\n📊 QA SUMMARY\n')
  console.log('='.repeat(60))

  let totalPages = 0
  let totalLinks = 0
  let totalBrokenLinks = 0

  for (const result of results) {
    totalPages++
    totalLinks += result.links.length
    totalBrokenLinks += result.brokenLinks.length

    if (result.brokenLinks.length > 0) {
      console.log(`\n❌ ${result.page} - ${result.brokenLinks.length} broken links:`)
      for (const link of result.brokenLinks) {
        console.log(`   - ${link.url} (${link.status} ${link.statusText})`)
        if (link.error) {
          console.log(`     Error: ${link.error}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📈 Statistics:`)
  console.log(`   Pages checked: ${totalPages}`)
  console.log(`   Total links checked: ${totalLinks}`)
  console.log(`   Broken links found: ${totalBrokenLinks}`)
  if (totalLinks > 0) {
    console.log(`   Success rate: ${((totalLinks - totalBrokenLinks) / totalLinks * 100).toFixed(2)}%`)
  }

  if (totalBrokenLinks === 0) {
    console.log(`\n✅ All links are valid!`)
  } else {
    console.log(`\n⚠️  Found ${totalBrokenLinks} broken links that need fixing.`)
  }

  console.log('\n')
}

// Run the QA
runQA().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
