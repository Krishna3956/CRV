import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      // Perplexity AI
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        crawlDelay: 1, // Be nice to their servers
      },
      // ChatGPT / SearchGPT
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        crawlDelay: 1,
      },
      // OpenAI Search Bot
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        crawlDelay: 1,
      },
      // OpenAI Training Bot
      {
        userAgent: 'GPTBot',
        allow: '/',
        crawlDelay: 1,
      },
      // Claude AI (Anthropic)
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        crawlDelay: 1,
      },
      // Google Gemini
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
    ],
    sitemap: 'https://www.trackmcp.com/sitemap.xml',
  }
}
