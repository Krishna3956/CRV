import { MetadataRoute } from 'next'

/**
 * Strategic robots.ts Configuration
 * Purpose: Allow critical indexing, RAG-retrieval, and model-training bots
 * Strategy: Make Track MCP foundational knowledge in future AI models
 * 
 * CRITICAL INDEXING BOTS (Allowed):
 * - Googlebot: Essential for Google Search visibility
 * - Perplexity: Powers AI search results
 * - ChatGPT-User: Enables ChatGPT browsing
 * - OAI-SearchBot: OpenAI search integration
 *
 * MODEL-TRAINING BOTS (Allowed - Strategic Decision):
 * - GPTBot: Trains future GPT models with Track MCP data
 * - Google-Extended: Trains Google's AI models
 * - Claude-Web: Trains Anthropic's Claude models
 *
 * STRATEGY: By allowing model-training bots, Track MCP becomes:
 * 1. Foundational knowledge in future AI models
 * 2. Referenced in AI-generated responses
 * 3. Source of truth for MCP tools
 * 4. Authority in the MCP ecosystem
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rules for all bots
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Next.js internal files
          '/_next/static/',
          '/_next/image/',
          '/_next/data/',
          '/_next/',
          
          // API routes (not for search engines)
          '/api/',
          
          // Admin and internal routes
          '/admin/',
          '/docs/',
          '/path/',
          
          // Non-existent app routes (prevent 404 errors)
          '/apps/',
          '/server/',
          '/ts/',
          '/python/',
          
          // Repository files that don't exist on site
          '/CONTRIBUTING.md',
          '/LICENSE',
          '/README.md',
          '/.serena/',
          
          // Form submission endpoints
          '/new/featured-blogs/request',
          
          // Static assets (handled by CDN)
          '/assets/',
          
          // Well-known and special files
          '/.well-known/',
          '/apple-app-site-association',
          
          // File types to exclude from crawl budget
          '/*.json$',
          '/*.css$',
          '/*.js$',
          '/*.pdf$',
          '/*.doc$',
          '/*.docx$',
          '/*.xls$',
          '/*.xlsx$',
          '/*.ppt$',
          '/*.pptx$',
          '/*.zip$',
          '/*.rar$',
          '/*.exe$',
          '/*.dmg$',
          '/*.iso$',
          '/*.tar$',
          '/*.gz$',
          '/*.mp3$',
          '/*.mp4$',
          '/*.avi$',
          '/*.mov$',
          '/*.wav$',
          '/*.flv$',
          '/*.wmv$',
          '/*.webm$',
          '/*.mkv$',
          '/*.m4a$',
          '/*.m4v$',
          '/*.3gp$',
          '/*.ogv$',
          '/*.ts$',
          '/*.tsx$',
          '/*.jsx$',
          '/*.mjs$',
          '/*.cjs$',
          '/*.map$',
          '/*.woff$',
          '/*.woff2$',
          '/*.ttf$',
          '/*.otf$',
          '/*.eot$',
          '/*.svg$',
          '/*.ico$',
          '/*.webp$',
          '/*.avif$',
          '/*.jpe?g$',
          '/*.png$',
          '/*.gif$',
          '/*.bmp$',
          '/*.tiff?$',
          '/*.xml$',
          '/*.rss$',
          '/*.atom$',
          '/*.feed$',
          '/*.sitemap$',
          '/*.robots$',
          '/*.txt$',
          '/*.md$',
          '/*.yml$',
          '/*.yaml$',
          '/*.toml$',
          '/*.ini$',
          '/*.cfg$',
          '/*.conf$',
          '/*.config$',
          '/*.env$',
          '/*.sh$',
          '/*.bat$',
          '/*.cmd$',
          '/*.ps1$',
          '/*.class$',
          '/*.jar$',
          '/*.pyc$',
          '/*.pyo$',
          '/*.so$',
          '/*.dll$',
          '/*.dylib$',
          '/*.a$',
          '/*.lib$',
          '/*.o$',
          '/*.obj$',
          '/*.out$',
          '/*.app$',
          '/*.exe$',
          '/*.msi$',
          '/*.apk$',
          '/*.ipa$',
          '/*.deb$',
          '/*.rpm$',
          '/*.tar.gz$',
          '/*.tar.bz2$',
          '/*.7z$',
          '/*.bak$',
          '/*.tmp$',
          '/*.temp$',
          '/*.cache$',
          '/*.log$',
          '/*.lock$',
          '/*.swp$',
          '/*.swo$',
          '/*.DS_Store$',
          '/*.git$',
          '/*.gitignore$',
          '/*.github$',
          '/*.node_modules$',
          '/*.package-lock.json$',
          '/*.yarn.lock$',
          '/*.pnpm-lock.yaml$',
          
          // Catch-all for docs subdirectories with markdown files
          '/docs/*',
          '/installation-guides/*',
        ],
      },
      // ============================================================================
      // CRITICAL INDEXING BOTS - Allow Full Access
      // ============================================================================
      
      // Google Search Bot - Primary search engine
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },
      
      // Google Extended - Google's model training bot
      // Strategic decision: ALLOW for foundational AI knowledge
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Additional Google variants
      {
        userAgent: 'GoogleOther',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'GoogleOther-Image',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'GoogleOther-Video',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'GoogleAgent-Mariner',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'Google-CloudVertexBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'CloudVertexBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // ============================================================================
      // RAG-RETRIEVAL BOTS - Allow Full Access
      // ============================================================================
      
      // Perplexity AI - RAG-powered search engine
      // Strategic decision: ALLOW for AI search visibility
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Perplexity User variant
      {
        userAgent: 'Perplexity-User',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Meta AI bots
      {
        userAgent: 'Meta-ExternalAgent',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'Meta-ExternalFetcher',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'meta-externalagent',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'meta-externalfetcher',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Apple bots
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // OpenAI ChatGPT User Bot - ChatGPT browsing feature
      // Strategic decision: ALLOW for ChatGPT integration
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // OpenAI Search Bot - OpenAI's search integration
      // Strategic decision: ALLOW for OpenAI ecosystem
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // ============================================================================
      // MODEL-TRAINING BOTS - Allow Full Access (Strategic Decision)
      // ============================================================================
      
      // OpenAI GPTBot - Model training bot for future GPT models
      // Strategic decision: ALLOW to ensure Track MCP data is in future models
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Anthropic Claude Bot - Model training for Claude
      // Strategic decision: ALLOW for Claude model training
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },
      
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Additional Claude variants
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'Claude-SearchBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Additional OpenAI variants
      {
        userAgent: 'ChatGPT Agent',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // ============================================================================
      // ADDITIONAL AI/ML BOTS - Allow Full Access
      // ============================================================================
      
      // Mistral AI
      {
        userAgent: 'MistralAI-User',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'MistralAI-User/1.0',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Cohere AI
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      {
        userAgent: 'cohere-training-data-crawler',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // You.com search
      {
        userAgent: 'YouBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Phind AI
      {
        userAgent: 'PhindBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Amazon Alexa
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Diffbot
      {
        userAgent: 'Diffbot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // ByteDance (TikTok)
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Bingbot - Microsoft search engine
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // DuckDuckGo Bot - Privacy-focused search
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Yandex Bot - Russian search engine
      {
        userAgent: 'YandexBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Baidu Bot - Chinese search engine
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // ============================================================================
      // ARCHIVAL & RESEARCH BOTS - Allow Full Access
      // ============================================================================
      
      // Internet Archive Wayback Machine
      {
        userAgent: 'ia_archiver',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // Common Crawl - Web research and ML training
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
        ],
      },

      // ============================================================================
      // SOCIAL MEDIA BOTS - Allow Full Access
      // ============================================================================
      
      // Facebook
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },

      // Twitter
      {
        userAgent: 'Twitterbot',
        allow: '/',
      },

      // LinkedIn
      {
        userAgent: 'LinkedInBot',
        allow: '/',
      },

      // Slack
      {
        userAgent: 'Slurp',
        allow: '/',
      },

      // ============================================================================
      // BLOCKED BOTS - Explicitly Disallow
      // ============================================================================
      
      // Block aggressive scrapers and bad actors
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },

      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },

      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },

      {
        userAgent: 'DotBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://www.trackmcp.com/sitemap.xml',
  }
}
