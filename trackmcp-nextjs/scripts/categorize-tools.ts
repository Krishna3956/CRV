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

// Category definitions with keywords
const categoryKeywords = {
  'AI & Machine Learning': [
    'ai', 'llm', 'claude', 'gpt', 'openai', 'anthropic', 'machine-learning', 
    'ml', 'agent', 'ai-agent', 'chatbot', 'nlp', 'neural', 'model', 
    'deep-learning', 'tensorflow', 'pytorch', 'huggingface', 'langchain',
    'embeddings', 'vector', 'rag', 'retrieval-augmented'
  ],
  'Developer Kits': [
    'sdk', 'library', 'framework', 'api-wrapper', 'client', 'toolkit',
    'python', 'typescript', 'javascript', 'go', 'rust', 'java', 'ruby',
    'npm', 'pip', 'package', 'module', 'plugin', 'extension'
  ],
  'Servers & Infrastructure': [
    'server', 'backend', 'infrastructure', 'hosting', 'deployment',
    'docker', 'kubernetes', 'cloud', 'aws', 'gcp', 'azure', 'database',
    'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'supabase',
    'firebase', 'vercel', 'netlify', 'heroku'
  ],
  'Search & Data Retrieval': [
    'search', 'indexing', 'retrieval', 'query', 'elasticsearch', 
    'algolia', 'vector-db', 'pinecone', 'weaviate', 'chromadb',
    'meilisearch', 'typesense', 'solr', 'lucene', 'semantic-search'
  ],
  'Automation & Productivity': [
    'automation', 'workflow', 'productivity', 'task', 'scheduler',
    'cron', 'ci-cd', 'github-actions', 'jenkins', 'gitlab',
    'zapier', 'ifttt', 'n8n', 'airflow', 'prefect', 'celery',
    'script', 'batch', 'pipeline'
  ],
  'Web & Internet Tools': [
    'web', 'scraping', 'crawler', 'spider', 'http', 'api', 'rest',
    'graphql', 'webhook', 'browser', 'puppeteer', 'playwright',
    'selenium', 'beautifulsoup', 'cheerio', 'axios', 'fetch',
    'url', 'html', 'dom', 'parsing'
  ],
  'Communication': [
    'chat', 'messaging', 'notification', 'email', 'sms', 'slack',
    'discord', 'telegram', 'whatsapp', 'teams', 'zoom', 'twilio',
    'sendgrid', 'mailgun', 'smtp', 'imap', 'pop3', 'webhook',
    'realtime', 'websocket', 'sse'
  ],
  'File & Data Management': [
    'file', 'filesystem', 'storage', 'csv', 'json', 'xml', 'yaml',
    'excel', 'pdf', 'document', 'parser', 'converter', 'transform',
    's3', 'blob', 'object-storage', 'upload', 'download', 'sync',
    'backup', 'archive', 'compression'
  ]
};

function categorizeToolByKeywords(tool: McpTool): string {
  const searchText = [
    tool.repo_name || '',
    tool.description || '',
    ...(tool.topics || [])
  ].join(' ').toLowerCase();

  // Count matches for each category
  const categoryScores: { [key: string]: number } = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    categoryScores[category] = score;
  }

  // Find category with highest score
  let bestCategory = 'Others';
  let bestScore = 0;

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // If no matches found, default to Others
  return bestScore > 0 ? bestCategory : 'Others';
}

async function categorizeTools() {
  console.log('🚀 Starting tool categorization...\n');

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

  console.log(`✅ Fetched ${allTools.length} tools\n`);
  console.log('🔄 Categorizing tools...\n');

  // Categorize and update tools
  const categoryCounts: { [key: string]: number } = {};
  let updated = 0;

  for (const tool of allTools) {
    const category = categorizeToolByKeywords(tool);
    
    // Update in database
    const { error } = await supabase
      .from('mcp_tools')
      .update({ category })
      .eq('id', tool.id);

    if (error) {
      console.error(`Error updating tool ${tool.repo_name}:`, error);
    } else {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`   Updated ${updated}/${allTools.length} tools...`);
      }
    }
  }

  console.log(`\n✅ Categorized ${updated} tools\n`);
  console.log('📊 Category Distribution:');
  
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  for (const [category, count] of sortedCategories) {
    console.log(`   ${category}: ${count} tools`);
  }

  console.log('\n✨ Done!');
}

categorizeTools().catch(console.error);
