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

async function qaSearchFunctionality() {
  console.log('\n🔍 QA TEST: Search Functionality\n');
  console.log('='.repeat(60));

  // Test 1: Search for a common word that should match many tools
  console.log('\n📋 TEST 1: Search for "python" (common word)');
  console.log('-'.repeat(60));
  
  let allPythonTools = [];
  let offset = 0;
  const batchSize = 1000;
  
  try {
    while (allPythonTools.length < 10000) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('id, repo_name, description')
        .in('status', ['approved', 'pending'])
        .or(`repo_name.ilike.%python%,description.ilike.%python%`)
        .order('stars', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error:', error.message);
        break;
      }

      if (!data || data.length === 0) {
        break;
      }

      allPythonTools = [...allPythonTools, ...data];
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    console.log(`✅ Total "python" matches: ${allPythonTools.length}`);
    console.log(`   Top 5 results:`);
    allPythonTools.slice(0, 5).forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.repo_name}`);
    });
  } catch (err) {
    console.error('Exception:', err.message);
  }

  // Test 2: Search for a rare word
  console.log('\n📋 TEST 2: Search for "anthropic" (specific word)');
  console.log('-'.repeat(60));
  
  let allAnthropicTools = [];
  offset = 0;
  
  try {
    while (allAnthropicTools.length < 10000) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('id, repo_name, description')
        .in('status', ['approved', 'pending'])
        .or(`repo_name.ilike.%anthropic%,description.ilike.%anthropic%`)
        .order('stars', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error:', error.message);
        break;
      }

      if (!data || data.length === 0) {
        break;
      }

      allAnthropicTools = [...allAnthropicTools, ...data];
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    console.log(`✅ Total "anthropic" matches: ${allAnthropicTools.length}`);
    if (allAnthropicTools.length > 0) {
      console.log(`   Top results:`);
      allAnthropicTools.slice(0, 3).forEach((tool, i) => {
        console.log(`   ${i + 1}. ${tool.repo_name}`);
      });
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }

  // Test 3: Verify batch fetching is working
  console.log('\n📋 TEST 3: Verify batch fetching works');
  console.log('-'.repeat(60));
  
  let batchCount = 0;
  let totalBatchTools = 0;
  offset = 0;
  
  try {
    while (totalBatchTools < 10000) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('id')
        .in('status', ['approved', 'pending'])
        .or(`repo_name.ilike.%ai%,description.ilike.%ai%`)
        .order('stars', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error:', error.message);
        break;
      }

      if (!data || data.length === 0) {
        break;
      }

      batchCount++;
      totalBatchTools += data.length;
      console.log(`   Batch ${batchCount}: Fetched ${data.length} tools (Total: ${totalBatchTools})`);
      
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    console.log(`✅ Batch fetching successful!`);
    console.log(`   Total batches: ${batchCount}`);
    console.log(`   Total tools fetched: ${totalBatchTools}`);
  } catch (err) {
    console.error('Exception:', err.message);
  }

  // Test 4: Compare old vs new behavior
  console.log('\n📋 TEST 4: Old vs New Behavior Comparison');
  console.log('-'.repeat(60));
  
  try {
    // Old way: limit 100
    const { data: oldWay, error: oldError } = await supabase
      .from('mcp_tools')
      .select('id')
      .in('status', ['approved', 'pending'])
      .or(`repo_name.ilike.%server%,description.ilike.%server%`)
      .order('stars', { ascending: false })
      .limit(100);

    if (oldError) {
      console.error('Error:', oldError.message);
    } else {
      console.log(`❌ OLD WAY (limit 100): ${oldWay?.length || 0} results`);
    }

    // New way: batch fetch all
    let newWayTotal = 0;
    offset = 0;
    
    while (newWayTotal < 10000) {
      const { data, error } = await supabase
        .from('mcp_tools')
        .select('id')
        .in('status', ['approved', 'pending'])
        .or(`repo_name.ilike.%server%,description.ilike.%server%`)
        .order('stars', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error:', error.message);
        break;
      }

      if (!data || data.length === 0) {
        break;
      }

      newWayTotal += data.length;
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    console.log(`✅ NEW WAY (batch fetch): ${newWayTotal} results`);
    console.log(`\n   Improvement: ${newWayTotal - (oldWay?.length || 0)} additional results found!`);
  } catch (err) {
    console.error('Exception:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ QA TEST COMPLETE\n');
}

qaSearchFunctionality();
