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

async function checkHomepageDisplay() {
  try {
    // Check what getAllTools returns (homepage initial load)
    let allTools = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    console.log('📥 Fetching all tools (getAllTools behavior)...\n');

    while (hasMore) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('id, category')
        .in('status', ['approved', 'pending'])
        .order('stars', { ascending: false })
        .range(from, from + batchSize - 1);
      
      if (error) {
        console.error('Error:', error.message);
        return;
      }
      
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allTools = [...allTools, ...data];
        from += batchSize;
        if (data.length < batchSize) {
          hasMore = false;
        }
      }
    }

    // Count AI & ML in the full list
    const aimlInFull = allTools.filter(t => t.category === 'AI & Machine Learning').length;

    // Now check what getToolsByCategory returns
    const { data: categoryData, error: categoryError } = await supabase
      .from('mcp_tools')
      .select('id, category')
      .in('status', ['approved', 'pending'])
      .eq('category', 'AI & Machine Learning')
      .order('stars', { ascending: false })
      .limit(10000);
    
    if (categoryError) {
      console.error('Error fetching by category:', categoryError.message);
      return;
    }

    console.log('\n📊 Comparison:\n');
    console.log(`  getAllTools() - AI & ML count: ${aimlInFull}`);
    console.log(`  getToolsByCategory() - AI & ML count: ${categoryData?.length || 0}`);
    console.log(`  Total tools in getAllTools: ${allTools.length}`);
    
    if (aimlInFull !== categoryData?.length) {
      console.log(`\n⚠️  MISMATCH! Difference: ${Math.abs(aimlInFull - (categoryData?.length || 0))} tools`);
    } else {
      console.log(`\n✅ Counts match!`);
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkHomepageDisplay();
