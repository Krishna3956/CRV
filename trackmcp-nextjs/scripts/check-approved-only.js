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

async function checkApprovedOnly() {
  try {
    // Check approved only for AI & ML
    const { count: approvedOnly, error: approvedError } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'AI & Machine Learning')
      .eq('status', 'approved');
    
    if (approvedError) {
      console.error('Error:', approvedError.message);
      return;
    }

    // Check approved + pending for AI & ML
    const { count: both, error: bothError } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'AI & Machine Learning')
      .in('status', ['approved', 'pending']);
    
    if (bothError) {
      console.error('Error:', bothError.message);
      return;
    }

    console.log('\n📊 AI & Machine Learning Tools:\n');
    console.log(`  ✅ Approved only: ${approvedOnly} tools`);
    console.log(`  📦 Approved + Pending: ${both} tools`);
    console.log(`\n💡 If you're seeing ~${approvedOnly} tools, the homepage is filtering to APPROVED ONLY`);
    console.log(`   To show all ${both} tools, we need to change the status filter`);
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkApprovedOnly();
