#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function listCategories() {
  try {
    let allTools = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    console.log('📥 Fetching all tools...\n');

    while (hasMore) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('category')
        .in('status', ['approved', 'pending'])
        .range(from, from + batchSize - 1);
      
      if (error) {
        console.error('Error:', error.message);
        return;
      }
      
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allTools = [...allTools, ...data];
        console.log(`  Fetched ${allTools.length} tools so far...`);
        from += batchSize;
        if (data.length < batchSize) {
          hasMore = false;
        }
      }
    }
    
    // Get unique categories with counts
    const categoryMap = {};
    allTools.forEach(tool => {
      const cat = tool.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    
    console.log('\n📊 All Categories:\n');
    Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} tools`);
      });
    
    const totalTools = allTools.length;
    console.log(`\n✅ Total tools: ${totalTools}`);
    console.log(`✅ Total categories: ${Object.keys(categoryMap).length}`);
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

listCategories();
