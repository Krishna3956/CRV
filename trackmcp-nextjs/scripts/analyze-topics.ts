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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

type McpTool = {
  id: string;
  repo_name: string | null;
  description: string | null;
  language: string | null;
  topics: string[] | null;
};

async function analyzeTopics() {
  console.log('🚀 Starting topic analysis...');

  let allTools: McpTool[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  console.log('📥 Fetching tools from database...');
  while (hasMore) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select('id, repo_name, description, language, topics')
      .in('status', ['approved', 'pending'])
      .range(from, from + batchSize - 1);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allTools = [...allTools, ...data];
      from += batchSize;
      if (data.length < batchSize) {
        hasMore = false;
      }
    }
  }

  console.log(`
✅ Fetched ${allTools.length} tools`);

  const topicCounts: { [key: string]: number } = {};
  const languageCounts: { [key: string]: number } = {};

  allTools.forEach(tool => {
    if (tool.topics) {
      tool.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
    if (tool.language) {
        languageCounts[tool.language] = (languageCounts[tool.language] || 0) + 1;
    }
  });

  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  const sortedLanguages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]);

  console.log('\n📊 Top 20 Topics:');
  console.log(sortedTopics.slice(0, 20));

  console.log('\n📊 Top 10 Languages:');
  console.log(sortedLanguages.slice(0, 10));

  console.log('\n✨ Done!');
}

analyzeTopics().catch(console.error);
