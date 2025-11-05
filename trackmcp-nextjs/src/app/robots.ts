import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
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
      // Perplexity AI
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
      // ChatGPT / SearchGPT
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
      // OpenAI Search Bot
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
      // OpenAI Training Bot
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
      // Claude AI (Anthropic)
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
      // Google Gemini
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
    ],
    sitemap: 'https://www.trackmcp.com/sitemap.xml',
  }
}
