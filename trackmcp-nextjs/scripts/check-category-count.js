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

async function checkCategory(categoryName) {
  try {
    const { count, error } = await supabase
      .from('mcp_tools')
      .select('*', { count: 'exact', head: true })
      .eq('category', categoryName)
      .in('status', ['approved', 'pending']);
    
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    console.log(`✅ Tools in "${categoryName}" category: ${count}`);
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

// Check AI & ML category
checkCategory('AI & ML');
