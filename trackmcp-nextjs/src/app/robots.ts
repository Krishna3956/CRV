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
          '/_next/static/',
          '/_next/image/',
          '/_next/data/',
          '/_next/',
          '/api/',
          '/assets/',
          '/.well-known/',
          '/apple-app-site-association',
          '/*.json$',
          '/*.css$',
          '/*.js$',
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

      // ============================================================================
      // ADDITIONAL AI/ML BOTS - Allow Full Access
      // ============================================================================
      
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
    sitemap: [
      'https://www.trackmcp.com/sitemap.xml',
      'https://www.trackmcp.com/sitemap-tools.xml',
    ],
  }
}
