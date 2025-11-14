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

async function checkAIMLStatus() {
  try {
    // Check approved only
    const { count: approvedCount, error: approvedError } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'AI & Machine Learning')
      .eq('status', 'approved');
    
    if (approvedError) {
      console.error('Error fetching approved:', approvedError.message);
      return;
    }

    // Check pending only
    const { count: pendingCount, error: pendingError } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'AI & Machine Learning')
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Error fetching pending:', pendingError.message);
      return;
    }

    // Check both
    const { count: bothCount, error: bothError } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'AI & Machine Learning')
      .in('status', ['approved', 'pending']);
    
    if (bothError) {
      console.error('Error fetching both:', bothError.message);
      return;
    }

    console.log('\n📊 AI & Machine Learning Tools by Status:\n');
    console.log(`  ✅ Approved only: ${approvedCount} tools`);
    console.log(`  ⏳ Pending only: ${pendingCount} tools`);
    console.log(`  📦 Both (approved + pending): ${bothCount} tools`);
    console.log(`\n💡 Difference: ${bothCount - approvedCount} pending tools not shown on homepage`);
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkAIMLStatus();
