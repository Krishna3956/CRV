# JSON-LD Schema Examples for MCP Tools

## 📋 Overview

This document provides ready-to-use JSON-LD schema examples for different scenarios on trackmcp.com.

---

## 1️⃣ Current Schema (No Reviews)

**Use Case:** All tool pages currently (after fix)

**Features:**
- ✅ Valid SoftwareApplication schema
- ✅ No fake ratings
- ✅ GitHub stars as popularity metric
- ✅ Google-compliant

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "documcp",
  "description": "MCP server for document processing and analysis with AI-powered features",
  "url": "https://www.trackmcp.com/tool/documcp",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cross-platform",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Organization",
    "name": "Track MCP",
    "url": "https://www.trackmcp.com"
  },
  "datePublished": "2024-01-15T10:30:00Z",
  "dateModified": "2024-11-04T08:15:00Z",
  "programmingLanguage": "TypeScript",
  "keywords": "mcp, document-processing, ai, model-context-protocol",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/LikeAction",
    "userInteractionCount": 245
  }
}
```

**Result:** No rating stars in search results (correct behavior)

---

## 2️⃣ Schema with Real Reviews (Future)

**Use Case:** After implementing review system

**Features:**
- ✅ Real user ratings
- ✅ Visible on page
- ✅ Will show rating stars in Google

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "documcp",
  "description": "MCP server for document processing and analysis with AI-powered features",
  "url": "https://www.trackmcp.com/tool/documcp",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cross-platform",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "ratingCount": "12",
    "bestRating": "5",
    "worstRating": "1"
  },
  "author": {
    "@type": "Organization",
    "name": "Track MCP",
    "url": "https://www.trackmcp.com"
  },
  "datePublished": "2024-01-15T10:30:00Z",
  "dateModified": "2024-11-04T08:15:00Z",
  "programmingLanguage": "TypeScript",
  "keywords": "mcp, document-processing, ai, model-context-protocol",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/LikeAction",
    "userInteractionCount": 245
  }
}
```

**Result:** ⭐⭐⭐⭐⭐ 4.6 (12) in Google search results

---

## 3️⃣ Complete Schema with Reviews Array

**Use Case:** Advanced implementation with individual reviews

**Features:**
- ✅ Aggregate rating
- ✅ Individual reviews
- ✅ Maximum rich snippet potential

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "documcp",
  "description": "MCP server for document processing and analysis with AI-powered features",
  "url": "https://www.trackmcp.com/tool/documcp",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cross-platform",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "ratingCount": "12",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "John Doe"
      },
      "datePublished": "2024-11-01",
      "reviewBody": "Excellent tool for document processing! Easy to integrate and very powerful.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Jane Smith"
      },
      "datePublished": "2024-10-28",
      "reviewBody": "Great tool, but documentation could be improved. Still highly recommend.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "4",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
  ],
  "author": {
    "@type": "Organization",
    "name": "Track MCP",
    "url": "https://www.trackmcp.com"
  },
  "datePublished": "2024-01-15T10:30:00Z",
  "dateModified": "2024-11-04T08:15:00Z",
  "programmingLanguage": "TypeScript",
  "keywords": "mcp, document-processing, ai, model-context-protocol"
}
```

**Result:** Enhanced rich snippets with review excerpts

---

## 4️⃣ Schema for Premium/Paid Tools

**Use Case:** If you add paid tools in the future

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "premium-mcp-tool",
  "description": "Enterprise-grade MCP tool with advanced features",
  "url": "https://www.trackmcp.com/tool/premium-mcp-tool",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cross-platform",
  "offers": {
    "@type": "Offer",
    "price": "49.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2025-12-31"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "156",
    "bestRating": "5",
    "worstRating": "1"
  },
  "author": {
    "@type": "Organization",
    "name": "Track MCP"
  }
}
```

---

## 5️⃣ Multiple Schemas on Same Page

**Use Case:** Combine SoftwareApplication with Breadcrumbs and Article

```html
<!-- SoftwareApplication Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "documcp",
  "description": "MCP server for document processing",
  "url": "https://www.trackmcp.com/tool/documcp",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cross-platform",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "ratingCount": "12"
  }
}
</script>

<!-- Breadcrumb Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.trackmcp.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "documcp",
      "item": "https://www.trackmcp.com/tool/documcp"
    }
  ]
}
</script>

<!-- Article Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "documcp - Model Context Protocol Tool",
  "description": "MCP server for document processing",
  "image": "https://www.trackmcp.com/api/og?tool=documcp",
  "datePublished": "2024-01-15",
  "dateModified": "2024-11-04",
  "author": {
    "@type": "Organization",
    "name": "Track MCP"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Track MCP",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.trackmcp.com/logo.png"
    }
  }
}
</script>
```

---

## 6️⃣ TypeScript Implementation

**Use Case:** Dynamic schema generation in Next.js

```typescript
// src/app/tool/[name]/page.tsx

interface ToolRating {
  review_count: number
  average_rating: number
}

function generateToolSchema(tool: McpTool, ratings?: ToolRating) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.repo_name,
    description: tool.description,
    url: `https://www.trackmcp.com/tool/${encodeURIComponent(tool.repo_name || '')}`,
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
    datePublished: tool.created_at,
    dateModified: tool.last_updated || tool.created_at,
    programmingLanguage: tool.language || undefined,
    keywords: tool.topics?.join(', '),
  }

  // Only add aggregateRating if real reviews exist
  if (ratings && ratings.review_count > 0) {
    return {
      ...baseSchema,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratings.average_rating.toFixed(1),
        ratingCount: ratings.review_count.toString(),
        bestRating: '5',
        worstRating: '1',
      },
    }
  }

  // Add GitHub stars as popularity metric
  if (tool.stars) {
    return {
      ...baseSchema,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: tool.stars,
      },
    }
  }

  return baseSchema
}

// Usage in component
export default async function ToolPage({ params }: Props) {
  const tool = await getTool(params.name)
  const ratings = await getToolRatings(tool.id) // Fetch real ratings
  
  const schema = generateToolSchema(tool, ratings)
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Rest of page */}
    </>
  )
}
```

---

## 7️⃣ Validation Examples

### ✅ Valid Schema (Will Pass Rich Results Test)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "documcp",
  "description": "MCP server for document processing",
  "url": "https://www.trackmcp.com/tool/documcp",
  "applicationCategory": "DeveloperApplication",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "ratingCount": "12"
  }
}
```

### ❌ Invalid Schema (Will Fail)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "documcp",
  // Missing required fields: description, url
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6"
    // Missing ratingCount
  }
}
```

---

## 8️⃣ Testing Commands

### Test Individual URL

```bash
# Using curl
curl -X POST "https://search.google.com/test/rich-results" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.trackmcp.com/tool/documcp"}'

# Or visit directly
open "https://search.google.com/test/rich-results?url=https://www.trackmcp.com/tool/documcp"
```

### Validate JSON-LD

```bash
# Using schema.org validator
open "https://validator.schema.org/#url=https://www.trackmcp.com/tool/documcp"
```

---

## 9️⃣ Common Patterns

### Pattern 1: Conditional Rating

```typescript
const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: tool.name,
  // Only include if reviews exist
  ...(hasReviews && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toString(),
      ratingCount: reviewCount.toString(),
    }
  }),
}
```

### Pattern 2: Multiple Offers

```json
{
  "@type": "SoftwareApplication",
  "name": "tool-name",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Tier",
      "price": "0",
      "priceCurrency": "USD"
    },
    {
      "@type": "Offer",
      "name": "Pro Tier",
      "price": "29.99",
      "priceCurrency": "USD"
    }
  ]
}
```

### Pattern 3: Version Information

```json
{
  "@type": "SoftwareApplication",
  "name": "tool-name",
  "softwareVersion": "2.1.0",
  "releaseNotes": "https://github.com/user/repo/releases/tag/v2.1.0",
  "downloadUrl": "https://github.com/user/repo/archive/refs/tags/v2.1.0.zip"
}
```

---

## 🔟 Best Practices

### ✅ DO:
- Use real data from your database
- Include all required fields
- Keep ratingValue between 1-5
- Make ratings visible on page
- Update dateModified when content changes
- Use consistent schema across all pages

### ❌ DON'T:
- Use fake or synthetic ratings
- Use GitHub stars as ratingCount
- Hide ratings from users
- Include undefined values
- Mix different schema versions
- Hardcode rating values

---

## 📊 Field Reference

### Required Fields (SoftwareApplication)
- `@context`: Always "https://schema.org"
- `@type`: Always "SoftwareApplication"
- `name`: Tool name
- `description`: Tool description
- `url`: Canonical URL

### Recommended Fields
- `applicationCategory`: "DeveloperApplication"
- `operatingSystem`: "Cross-platform", "Windows", "macOS", etc.
- `offers`: Price information
- `author`: Creator/organization
- `datePublished`: First published date
- `dateModified`: Last updated date

### Optional Fields (for Rich Results)
- `aggregateRating`: Only if you have real reviews
- `review`: Individual reviews
- `programmingLanguage`: Primary language
- `keywords`: Comma-separated tags
- `interactionStatistic`: Popularity metrics

---

## 🔗 Resources

- [Schema.org SoftwareApplication](https://schema.org/SoftwareApplication)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Schema.org Validator](https://validator.schema.org/)

---

**Last Updated**: November 4, 2024
**Status**: Production Ready
