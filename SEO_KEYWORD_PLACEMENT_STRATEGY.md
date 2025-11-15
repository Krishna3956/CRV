# SEO Keyword Placement Strategy - Track MCP

## 🎯 Where to Place SEO Keywords in Your Next.js Project

**Status:** Complete guide for optimal keyword placement

---

## 1. Keyword Strategy Overview

### Primary Keywords (High Priority)
```
1. "MCP tools" - Main keyword
2. "Model Context Protocol" - Long-form keyword
3. "MCP servers" - Alternative keyword
4. "MCP directory" - Brand keyword
5. "AI integration tools" - Related keyword
```

### Secondary Keywords (Medium Priority)
```
1. "MCP clients"
2. "MCP connectors"
3. "Developer tools"
4. "AI tools directory"
5. "Open source MCP"
```

### Long-tail Keywords (Low Competition)
```
1. "best MCP tools for developers"
2. "how to use MCP servers"
3. "MCP integration guide"
4. "MCP tool comparison"
5. "MCP ecosystem"
```

---

## 2. Exact Placement Locations in Your Project

### LOCATION 1: Meta Tags (layout.tsx)

**File:** `/src/app/layout.tsx`

```typescript
// Lines: 1-50 (Head section)

// ✅ Title Tag (Most Important)
<title>Track MCP - World's Largest MCP Tools Directory | 10,000+ Tools</title>

// ✅ Meta Description (High Priority)
<meta 
  name="description" 
  content="Discover 10,000+ MCP tools, servers, and clients. The world's largest Model Context Protocol directory. Search, filter, and integrate AI tools instantly."
/>

// ✅ Meta Keywords (Low Priority - but still add)
<meta 
  name="keywords" 
  content="MCP tools, Model Context Protocol, MCP servers, MCP directory, AI integration, developer tools, open source"
/>

// ✅ OG Tags (Social Sharing)
<meta property="og:title" content="Track MCP - World's Largest MCP Tools Directory" />
<meta property="og:description" content="Discover 10,000+ MCP tools, servers, and clients." />

// ✅ Twitter Tags
<meta name="twitter:title" content="Track MCP - MCP Tools Directory" />
<meta name="twitter:description" content="Discover 10,000+ MCP tools and servers" />
```

**Keywords Placed:**
- Title: "MCP Tools Directory", "MCP"
- Description: "MCP tools", "Model Context Protocol", "MCP servers", "AI integration"
- Keywords: All primary keywords

---

### LOCATION 2: H1 Tag (Page Content)

**File:** `/src/app/page.tsx` (Homepage)

```typescript
// ✅ H1 - Most Important for SEO
<h1>
  Discover 10,000+ MCP Tools & Servers
</h1>

// Better version with keywords:
<h1>
  The World's Largest MCP Tools Directory - 10,000+ Model Context Protocol Servers
</h1>

// Or:
<h1>
  Find the Best MCP Tools & Servers for Your AI Integration
</h1>
```

**Why:** Google heavily weights H1 tags. Should contain primary keyword.

**Keywords:** "MCP Tools", "MCP Servers", "Model Context Protocol", "AI Integration"

---

### LOCATION 3: H2 Tags (Subheadings)

**File:** `/src/app/page.tsx`

```typescript
// ✅ H2 Tags - Secondary Keywords
<h2>Browse MCP Tools by Category</h2>
<h2>Top MCP Servers This Week</h2>
<h2>Latest MCP Tools & Updates</h2>
<h2>How to Use MCP Tools</h2>
<h2>MCP Integration Guide</h2>
<h2>Popular MCP Clients</h2>
```

**Keywords:** "MCP Tools", "MCP Servers", "MCP Clients", "MCP Integration"

---

### LOCATION 4: Page Content (Body Text)

**File:** `/src/app/page.tsx`

```typescript
// ✅ First 100 words (Most Important)
<p>
  Track MCP is the world's largest MCP tools directory, featuring 10,000+ 
  Model Context Protocol servers, clients, and connectors. Discover the best 
  MCP tools for your AI integration projects. Our comprehensive MCP directory 
  helps developers find, compare, and integrate MCP servers instantly.
</p>

// ✅ Throughout content (Natural placement)
<p>
  Whether you're looking for MCP servers for AI applications or MCP clients 
  for integration, Track MCP has the most extensive collection of MCP tools 
  available. Browse our MCP directory by category, popularity, or recent updates.
</p>

// ✅ Call-to-action with keywords
<button>
  Browse All MCP Tools →
</button>
```

**Keywords Density:** 2-3% (natural, not over-optimized)
- "MCP tools" appears 3-4 times
- "MCP servers" appears 2-3 times
- "Model Context Protocol" appears 1-2 times

---

### LOCATION 5: Tool Page Titles & Descriptions

**File:** `/src/app/tool/[name]/page.tsx`

```typescript
// ✅ Dynamic Title with Keywords
const title = `${tool.repo_name} - MCP Tool | Track MCP Directory`;

// Better:
const title = `${tool.repo_name} - Best MCP Server for ${tool.topics[0]} | Track MCP`;

// ✅ Dynamic Meta Description
const description = `${tool.repo_name} is a ${tool.topics[0]} MCP tool. 
  ${tool.stars} stars on GitHub. Integrate with Track MCP's largest MCP directory.`;

// ✅ H1 with Keywords
<h1>
  {tool.repo_name} - MCP Tool for {tool.topics[0]}
</h1>

// ✅ First paragraph with keywords
<p>
  {tool.repo_name} is a powerful MCP server that helps developers integrate 
  {tool.topics[0]} capabilities. This MCP tool is part of Track MCP's 
  comprehensive MCP directory with 10,000+ tools.
</p>
```

**Keywords:** Tool name, "MCP tool", "MCP server", topic, "Track MCP"

---

### LOCATION 6: Category Pages

**File:** `/src/app/category/[slug]/page.tsx`

```typescript
// ✅ Dynamic Title
const title = `${categoryName} MCP Tools | Track MCP Directory`;

// ✅ Dynamic Meta Description
const description = `Browse all ${categoryName} MCP tools and servers. 
  Discover the best MCP solutions for ${categoryName} integration on Track MCP.`;

// ✅ H1 with Keywords
<h1>
  {categoryName} MCP Tools & Servers
</h1>

// ✅ Category description
<p>
  Explore our collection of {categoryName} MCP tools. These MCP servers help 
  developers integrate {categoryName} capabilities. Browse all {categoryName} 
  MCP tools in our comprehensive MCP directory.
</p>
```

**Keywords:** Category name, "MCP tools", "MCP servers", "MCP directory"

---

### LOCATION 7: Structured Data (Schema.org)

**File:** `/src/app/layout.tsx` & page files

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Track MCP",
  "description": "The world's largest MCP tools directory with 10,000+ Model Context Protocol servers and clients",
  "keywords": "MCP tools, MCP servers, Model Context Protocol, AI integration",
  "url": "https://www.trackmcp.com",
  "sameAs": [...]
}
```

**Keywords in Schema:**
- Organization name: "Track MCP"
- Description: "MCP tools", "MCP servers", "Model Context Protocol"
- Keywords field: All primary keywords

---

### LOCATION 8: URL Structure (Canonical URLs)

**File:** All pages (via canonical tags)

```typescript
// ✅ Homepage
<link rel="canonical" href="https://www.trackmcp.com" />

// ✅ Category pages (keyword-rich URLs)
<link rel="canonical" href="https://www.trackmcp.com/category/ai-tools" />
<link rel="canonical" href="https://www.trackmcp.com/category/mcp-servers" />

// ✅ Tool pages
<link rel="canonical" href="https://www.trackmcp.com/tool/anthropic-mcp-server" />

// ✅ Top tools page
<link rel="canonical" href="https://www.trackmcp.com/top-mcp" />

// ✅ New tools page
<link rel="canonical" href="https://www.trackmcp.com/new" />
```

**Keywords in URLs:**
- `/category/mcp-servers` - Contains "mcp-servers"
- `/tool/[name]` - Tool name is keyword
- `/top-mcp` - Contains "mcp"

---

### LOCATION 9: Internal Links (Anchor Text)

**File:** All pages

```typescript
// ✅ Homepage links
<Link href="/category/ai-tools">
  Browse AI MCP Tools
</Link>

<Link href="/top-mcp">
  Top MCP Servers This Week
</Link>

<Link href="/new">
  Latest MCP Tools
</Link>

// ✅ Tool page links
<Link href={`/category/${tool.category}`}>
  More {tool.category} MCP Tools
</Link>

// ✅ Footer links
<Link href="/submit-mcp">
  Submit Your MCP Tool
</Link>

<Link href="/category">
  Browse All MCP Categories
</Link>
```

**Keywords in Anchor Text:**
- "Browse AI MCP Tools" - Contains "MCP Tools"
- "Top MCP Servers" - Contains "MCP Servers"
- "Latest MCP Tools" - Contains "MCP Tools"

---

### LOCATION 10: Image Alt Text

**File:** All pages with images

```typescript
// ✅ Logo image
<img 
  src="/og-image.png" 
  alt="Track MCP - World's Largest MCP Tools Directory Logo"
/>

// ✅ Tool images
<img 
  src={tool.image} 
  alt={`${tool.repo_name} - MCP Tool for ${tool.topics[0]}`}
/>

// ✅ Category images
<img 
  src={category.image} 
  alt={`${category.name} MCP Tools and Servers`}
/>

// ✅ Feature images
<img 
  src="/features/search.png" 
  alt="Search MCP Tools in Track MCP Directory"
/>
```

**Keywords in Alt Text:**
- "Track MCP", "MCP Tools Directory"
- Tool name, "MCP Tool"
- Category name, "MCP Tools"

---

### LOCATION 11: FAQ Schema

**File:** `/src/app/page.tsx` & `/src/app/submit-mcp/page.tsx`

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Model Context Protocol (MCP)?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Model Context Protocol is an open standard for MCP tools and servers..."
      }
    },
    {
      "@type": "Question",
      "name": "How many MCP tools are in Track MCP?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Track MCP has 10,000+ MCP tools, servers, and clients..."
      }
    },
    {
      "@type": "Question",
      "name": "How do I find the best MCP tool for my needs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use Track MCP's search and filter to find MCP tools by category..."
      }
    }
  ]
}
```

**Keywords in FAQ:**
- Questions: "Model Context Protocol", "MCP tools", "MCP"
- Answers: "MCP servers", "MCP tools", "MCP directory"

---

### LOCATION 12: Blog Posts / Content Pages

**File:** `/src/app/new/featured-blogs/page.tsx`

```typescript
// ✅ Blog post title with keywords
<h1>
  The Ultimate Guide to MCP Tools: How to Choose the Best MCP Server for Your Needs
</h1>

// ✅ Blog post meta description
<meta 
  name="description" 
  content="Learn how to choose the best MCP tools and servers. Complete guide to MCP integration, comparison of top MCP tools, and best practices."
/>

// ✅ Blog post content
<p>
  In this comprehensive guide, we'll explore the best MCP tools available on 
  Track MCP. Whether you're looking for MCP servers for AI integration or MCP 
  clients for your application, this guide covers everything you need to know 
  about MCP tools.
</p>

// ✅ Blog post headings
<h2>Top 10 MCP Tools for AI Integration</h2>
<h2>How to Integrate MCP Servers</h2>
<h2>MCP Tools Comparison</h2>
<h2>Best Practices for MCP Implementation</h2>
```

**Keywords:** "MCP tools", "MCP servers", "MCP integration", "MCP clients"

---

## 3. Keyword Placement Checklist

### On Every Page ✅

- [ ] **Title Tag** - Primary keyword + brand name
- [ ] **Meta Description** - 2-3 keywords, natural language
- [ ] **H1 Tag** - Primary keyword
- [ ] **First 100 words** - Keywords naturally placed
- [ ] **Internal Links** - Keywords in anchor text
- [ ] **Image Alt Text** - Keywords where relevant
- [ ] **Canonical Tag** - Keyword-rich URL
- [ ] **Schema.org Markup** - Keywords in description

### On Homepage ✅

- [ ] **H1** - "MCP Tools Directory" or similar
- [ ] **H2s** - Category names, "MCP Tools", "MCP Servers"
- [ ] **Body Content** - Keywords in first paragraph
- [ ] **FAQPage Schema** - Keywords in questions/answers
- [ ] **Internal Links** - Links to categories, top tools, new tools

### On Tool Pages ✅

- [ ] **Title** - Tool name + "MCP Tool"
- [ ] **H1** - Tool name + category
- [ ] **Meta Description** - Tool description + "MCP tool"
- [ ] **First Paragraph** - Keywords naturally placed
- [ ] **Related Tools** - Links with keyword anchor text
- [ ] **SoftwareApplication Schema** - Keywords in description

### On Category Pages ✅

- [ ] **Title** - Category name + "MCP Tools"
- [ ] **H1** - Category name + "MCP Tools"
- [ ] **Meta Description** - Category description + keywords
- [ ] **Body Content** - Keywords in first paragraph
- [ ] **Tool Cards** - Links with keyword anchor text
- [ ] **CollectionPage Schema** - Keywords in description

---

## 4. Keyword Density Guidelines

### Recommended Density: 1-3%

```
Example: 1000-word page
- Primary keyword: 10-30 times (1-3%)
- Secondary keywords: 5-15 times (0.5-1.5%)
- Long-tail keywords: 3-10 times (0.3-1%)
```

### For Your Project:

**Homepage (2000 words):**
- "MCP tools" - 20-60 times (1-3%)
- "MCP servers" - 10-30 times (0.5-1.5%)
- "Model Context Protocol" - 5-15 times (0.25-0.75%)

**Tool Pages (500 words):**
- Tool name - 3-5 times (0.6-1%)
- "MCP tool" - 3-5 times (0.6-1%)
- Category - 2-3 times (0.4-0.6%)

**Category Pages (1000 words):**
- Category name - 10-20 times (1-2%)
- "MCP tools" - 10-20 times (1-2%)
- "MCP servers" - 5-10 times (0.5-1%)

---

## 5. Implementation Example

### Before (No Keywords)

```typescript
// ❌ Poor SEO
<title>Track MCP</title>
<meta name="description" content="A directory of tools" />
<h1>Welcome to Track MCP</h1>
<p>Browse our collection of tools.</p>
```

### After (Optimized Keywords)

```typescript
// ✅ Good SEO
<title>Track MCP - World's Largest MCP Tools Directory | 10,000+ Tools</title>
<meta 
  name="description" 
  content="Discover 10,000+ MCP tools, servers, and clients. The world's largest Model Context Protocol directory for AI integration."
/>
<h1>Discover 10,000+ MCP Tools & Servers</h1>
<p>
  Track MCP is the world's largest MCP tools directory, featuring 10,000+ 
  Model Context Protocol servers, clients, and connectors. Find the best MCP 
  tools for your AI integration projects.
</p>
```

---

## 6. Keyword Placement by File

### `/src/app/layout.tsx`
```
✅ Title tag
✅ Meta description
✅ Meta keywords
✅ OG tags
✅ Twitter tags
✅ Organization schema
✅ WebSite schema
```

### `/src/app/page.tsx`
```
✅ H1 tag
✅ H2 tags
✅ Body content
✅ Internal links
✅ Image alt text
✅ FAQPage schema
✅ ItemList schema
✅ DataCatalog schema
```

### `/src/app/tool/[name]/page.tsx`
```
✅ Dynamic title
✅ Dynamic meta description
✅ H1 tag
✅ Body content
✅ Related tools links
✅ SoftwareApplication schema
✅ Article schema
✅ BreadcrumbList schema
```

### `/src/app/category/[slug]/page.tsx`
```
✅ Dynamic title
✅ Dynamic meta description
✅ H1 tag
✅ Body content
✅ Tool links
✅ CollectionPage schema
✅ BreadcrumbList schema
```

### `/src/app/submit-mcp/page.tsx`
```
✅ Title tag
✅ Meta description
✅ H1 tag
✅ Body content
✅ Internal links
✅ FAQPage schema
✅ ContactPage schema
✅ Service schema
```

---

## 7. Tools to Monitor Keywords

### Rank Tracking
```
✅ Google Search Console - Free
✅ Ahrefs - Paid
✅ SEMrush - Paid
✅ Moz - Paid
```

### Keyword Research
```
✅ Google Keyword Planner - Free
✅ Ahrefs Keywords - Paid
✅ SEMrush Keyword Magic - Paid
✅ Ubersuggest - Paid
```

### Content Optimization
```
✅ Yoast SEO - Free/Paid
✅ SurferSEO - Paid
✅ Clearscope - Paid
✅ MarketMuse - Paid
```

---

## 8. Keyword Strategy Timeline

### Week 1: Research
- [ ] Identify primary keywords
- [ ] Research competitor keywords
- [ ] Analyze search volume
- [ ] Identify long-tail keywords

### Week 2: Implementation
- [ ] Update title tags
- [ ] Update meta descriptions
- [ ] Update H1 tags
- [ ] Update body content
- [ ] Update schema markup

### Week 3: Optimization
- [ ] Adjust keyword density
- [ ] Add internal links
- [ ] Update image alt text
- [ ] Optimize URLs

### Week 4: Monitoring
- [ ] Track rankings
- [ ] Monitor traffic
- [ ] Analyze performance
- [ ] Make adjustments

---

## 9. Best Practices

### DO ✅

- ✅ Use keywords naturally
- ✅ Focus on user intent
- ✅ Use long-tail keywords
- ✅ Optimize for featured snippets
- ✅ Use keywords in headings
- ✅ Use keywords in meta tags
- ✅ Use keywords in image alt text
- ✅ Use keywords in internal links
- ✅ Monitor keyword rankings
- ✅ Update content regularly

### DON'T ❌

- ❌ Keyword stuff (over-optimize)
- ❌ Use irrelevant keywords
- ❌ Hide keywords (white text on white)
- ❌ Use exact match keywords everywhere
- ❌ Ignore user intent
- ❌ Use outdated keywords
- ❌ Duplicate keywords across pages
- ❌ Use keywords in wrong context
- ❌ Ignore search intent
- ❌ Neglect long-tail keywords

---

## 10. Summary

### Where to Place Keywords

| Location | Priority | Keyword Density | Example |
|----------|----------|-----------------|---------|
| Title Tag | ⭐⭐⭐⭐⭐ | 1-2 keywords | "Track MCP - MCP Tools Directory" |
| Meta Description | ⭐⭐⭐⭐ | 2-3 keywords | "Discover 10,000+ MCP tools..." |
| H1 Tag | ⭐⭐⭐⭐⭐ | 1 keyword | "Discover MCP Tools" |
| H2 Tags | ⭐⭐⭐⭐ | 1-2 keywords | "Browse MCP Tools by Category" |
| Body Content | ⭐⭐⭐⭐ | 1-3% density | Natural placement |
| Internal Links | ⭐⭐⭐ | 1 keyword | "Browse MCP Tools" |
| Image Alt Text | ⭐⭐⭐ | 1-2 keywords | "MCP Tools Directory" |
| Schema Markup | ⭐⭐⭐ | 2-3 keywords | In description field |
| URL Structure | ⭐⭐⭐ | 1-2 keywords | `/category/mcp-tools` |
| Meta Keywords | ⭐⭐ | All keywords | Comma-separated list |

---

## 🚀 Quick Implementation Checklist

- [ ] Identify 5-10 primary keywords
- [ ] Research long-tail keywords
- [ ] Update all title tags
- [ ] Update all meta descriptions
- [ ] Update all H1 tags
- [ ] Optimize body content
- [ ] Update internal links
- [ ] Update image alt text
- [ ] Update schema markup
- [ ] Monitor rankings

**Your keyword strategy is ready to implement!**

