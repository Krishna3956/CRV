import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function generateSitemap() {
  const hostname = 'https://www.trackmcp.com';

  // --- Supabase setup ---
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing in your .env file.');
    console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- Fetch dynamic URLs from Supabase ---
  console.log('Fetching all tool URLs from Supabase...');
  let allTools = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: tools, error } = await supabase
      .from('mcp_tools')
      .select('repo_name, last_updated')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching tools from Supabase:', error);
      return;
    }

    if (tools) {
      allTools.push(...tools);
    }

    if (!tools || tools.length < pageSize) {
      break; // Last page
    }

    page++;
  }

  const tools = allTools;

  const dynamicUrls = tools.map(tool => ({
    url: `/tool/${encodeURIComponent(tool.repo_name)}`,
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: tool.last_updated,
  }));
  console.log(`Found ${dynamicUrls.length} dynamic tool URLs.`);

  const staticUrls = [
    { url: '/', changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() },
  ];

  const allUrls = [...staticUrls, ...dynamicUrls];

  const stream = new SitemapStream({
    hostname,
    xmlns: {
      news: false,
      xhtml: false,
      image: false,
      video: false,
    },
  });

  try {
    const data = await streamToPromise(Readable.from(allUrls).pipe(stream));
    writeFileSync('public/sitemap.xml', data.toString());
    console.log('Sitemap generated successfully!');
  } catch (e) {
    console.error('Error generating sitemap:', e);
  }
}

generateSitemap();

