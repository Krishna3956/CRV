import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
const envPath = join(process.cwd(), '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
} catch (error) {
  console.error('⚠️  Could not load .env.local file');
}

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running database migration...\n');

  const migrationSQL = `
-- Add category column to mcp_tools table
ALTER TABLE mcp_tools 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Others';

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_mcp_tools_category ON mcp_tools(category);
  `.trim();

  try {
    // Note: Supabase client doesn't support raw SQL execution directly
    // You'll need to run this via the Supabase dashboard SQL editor
    console.log('📝 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n⚠️  Please copy the SQL above and run it in your Supabase dashboard:');
    console.log('   1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql');
    console.log('   2. Paste the SQL above');
    console.log('   3. Click "Run"');
    console.log('\n✅ After running the migration, execute:');
    console.log('   npx tsx scripts/categorize-tools.ts\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

runMigration().catch(console.error);
