import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

async function generateSitemap() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('Fetching all tools from database...')
  
  let allTools: Array<{ repo_name: string | null; last_updated: string | null }> = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('repo_name, last_updated')
      .in('status', ['approved', 'pending'])
      .range(from, from + batchSize - 1)

    if (error) {
      console.error(`Error fetching batch at ${from}:`, error)
      hasMore = false
    } else if (!data || data.length === 0) {
      console.log(`No more data at offset ${from}`)
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

  console.log(`Total tools fetched: ${allTools.length}`)

  // Generate sitemap XML
  const urls = allTools
    .filter(tool => tool.repo_name)
    .map(tool => {
      const lastMod = tool.last_updated ? new Date(tool.last_updated).toISOString() : new Date().toISOString()
      return `  <url>
    <loc>https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name!.toLowerCase())}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.trackmcp.com</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls.join('\n')}
</urlset>`

  // Write to public/sitemap.xml
  const publicDir = path.join(process.cwd(), 'public')
  const sitemapPath = path.join(publicDir, 'sitemap.xml')
  
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8')
  
  console.log(`✅ Sitemap generated successfully!`)
  console.log(`   - Total URLs: ${urls.length + 1}`)
  console.log(`   - Tool pages: ${urls.length}`)
  console.log(`   - File: ${sitemapPath}`)
}

generateSitemap().catch(console.error)
