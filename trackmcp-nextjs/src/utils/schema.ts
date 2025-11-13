/**
 * Schema Markup Utilities for SEO
 * Generates JSON-LD structured data for various page types
 */

export interface SchemaMarkup {
  '@context': string
  '@type': string
  [key: string]: any
}

/**
 * Organization Schema - For homepage and global brand
 */
export function getOrganizationSchema(): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Track MCP',
    description: 'The world\'s largest MCP tools directory connecting developers with AI tools and integrations.',
    url: 'https://www.trackmcp.com',
    logo: 'https://www.trackmcp.com/logo.png',
    sameAs: [
      'https://www.linkedin.com/in/krishnaa-goyal/',
      'https://twitter.com/trackmcp',
      'https://github.com/Krishna3956/CRV',
    ],
    founder: {
      '@type': 'Person',
      name: 'Krishna',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@trackmcp.com',
    },
  }
}

/**
 * WebSite Schema - For homepage
 */
export function getWebsiteSchema(): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Track MCP',
    description: 'The world\'s largest MCP tools directory',
    url: 'https://www.trackmcp.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.trackmcp.com?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * BreadcrumbList Schema
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * SoftwareApplication Schema - For tool pages
 */
export function getSoftwareApplicationSchema(tool: {
  name: string
  description: string
  url: string
  stars?: number
  language?: string
  topics?: string[]
  createdAt?: string
  lastUpdated?: string
  githubUrl?: string
}): SchemaMarkup {
  const schema: SchemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: tool.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'Track MCP',
      url: 'https://www.trackmcp.com',
    },
  }

  // Add optional fields
  if (tool.stars) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, (tool.stars / 1000) * 5), // Normalize stars to 5-star scale
      ratingCount: tool.stars,
    }
  }

  if (tool.language) {
    schema.programmingLanguage = tool.language
  }

  if (tool.topics && tool.topics.length > 0) {
    schema.keywords = tool.topics.join(', ')
  }

  if (tool.createdAt) {
    schema.datePublished = tool.createdAt
  }

  if (tool.lastUpdated) {
    schema.dateModified = tool.lastUpdated
  }

  if (tool.githubUrl) {
    schema.codeRepository = tool.githubUrl
  }

  return schema
}

/**
 * CollectionPage Schema - For category pages
 */
export function getCollectionPageSchema(category: {
  name: string
  description: string
  url: string
  toolCount: number
}): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} MCP Tools`,
    description: category.description,
    url: category.url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Track MCP',
      url: 'https://www.trackmcp.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Track MCP',
      url: 'https://www.trackmcp.com',
    },
    numberOfItems: category.toolCount,
  }
}

/**
 * ItemList Schema - For tool listings
 */
export function getItemListSchema(items: Array<{ name: string; url: string; description: string }>): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
      description: item.description,
    })),
  }
}

/**
 * FAQPage Schema - For FAQ sections
 */
export function getFAQPageSchema(faqs: Array<{ question: string; answer: string }>): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Article Schema - For blog posts
 */
export function getArticleSchema(article: {
  title: string
  description: string
  url: string
  author: string
  publishedDate: string
  modifiedDate?: string
  image?: string
}): SchemaMarkup {
  const schema: SchemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    url: article.url,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    datePublished: article.publishedDate,
  }

  if (article.modifiedDate) {
    schema.dateModified = article.modifiedDate
  }

  if (article.image) {
    schema.image = article.image
  }

  return schema
}

/**
 * LocalBusiness Schema - For contact/about pages
 */
export function getLocalBusinessSchema(): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Track MCP',
    description: 'The world\'s largest MCP tools directory',
    url: 'https://www.trackmcp.com',
    image: 'https://www.trackmcp.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@trackmcp.com',
      availableLanguage: ['en'],
    },
  }
}

/**
 * Person Schema - For founder/team pages
 */
export function getPersonSchema(person: {
  name: string
  description: string
  url: string
  image?: string
  email?: string
}): SchemaMarkup {
  const schema: SchemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    description: person.description,
    url: person.url,
  }

  if (person.image) {
    schema.image = person.image
  }

  if (person.email) {
    schema.email = person.email
  }

  return schema
}

/**
 * AggregateOffer Schema - For pricing pages
 */
export function getAggregateOfferSchema(offers: Array<{ name: string; price: string; description: string }>): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    offers: offers.map(offer => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      description: offer.description,
      priceCurrency: 'USD',
    })),
  }
}

/**
 * Render schema as JSON-LD script tag
 */
export function renderSchemaScript(schema: SchemaMarkup | SchemaMarkup[]): string {
  return JSON.stringify(Array.isArray(schema) ? schema : schema)
}
