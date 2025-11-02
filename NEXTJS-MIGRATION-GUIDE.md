# Next.js Migration Guide for trackmcp.com

## Why Next.js?

Next.js is the recommended solution because:
- ✅ Built on React (minimal code changes needed)
- ✅ Excellent SEO with SSR/SSG out of the box
- ✅ First-class Vercel support (your current host)
- ✅ Automatic code splitting and optimization
- ✅ Built-in routing (replace React Router)
- ✅ API routes for backend functionality

## Migration Steps

### Step 1: Create Next.js Project

```bash
# Create new Next.js project with App Router
npx create-next-app@latest trackmcp-nextjs \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd trackmcp-nextjs
```

### Step 2: Install Dependencies

```bash
# Install your current dependencies
npm install @supabase/supabase-js @tanstack/react-query
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react clsx tailwind-merge class-variance-authority
npm install react-helmet-async sonner cmdk
npm install date-fns zod react-hook-form @hookform/resolvers

# Install Next.js specific packages
npm install next-themes
```

### Step 3: Project Structure

```
trackmcp-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout (replaces index.html)
│   │   ├── page.tsx           # Homepage (/)
│   │   ├── tool/
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # Dynamic tool pages
│   │   ├── api/               # API routes (optional)
│   │   └── globals.css        # Global styles
│   ├── components/            # Your existing components
│   ├── lib/                   # Utilities, Supabase client
│   └── types/                 # TypeScript types
├── public/                    # Static files
└── next.config.js            # Next.js configuration
```

### Step 4: Migrate Root Layout

**Current:** `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Track MCP</title>
    <!-- ... meta tags ... -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

**Next.js:** `src/app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers',
  description: 'Explore the world\'s largest directory of Model Context Protocol (MCP) tools, servers, and connectors.',
  keywords: 'MCP, Model Context Protocol, AI tools, LLM tools, GitHub MCP',
  authors: [{ name: 'Krishna Goyal' }],
  openGraph: {
    title: 'Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers',
    description: 'Explore the world\'s largest directory of MCP tools',
    url: 'https://www.trackmcp.com',
    siteName: 'Track MCP',
    images: [
      {
        url: 'https://www.trackmcp.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Track MCP - Discover 10,000+ Model Context Protocol Tools & Servers',
    description: 'Explore the world\'s largest directory of MCP tools',
    images: ['https://www.trackmcp.com/og-image.png'],
    creator: '@trackmcp',
  },
  alternates: {
    canonical: 'https://www.trackmcp.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-22HQQFNJ1F"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-22HQQFNJ1F');
            `,
          }}
        />
        {/* Microsoft Clarity */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "tsoodirahp");
            `,
          }}
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              url: 'https://www.trackmcp.com/',
              name: 'Track MCP',
              description: 'World\'s Largest Model Context Protocol Repository',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.trackmcp.com/?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              url: 'https://www.trackmcp.com',
              name: 'Track MCP',
              logo: 'https://www.trackmcp.com/og-image.png',
              description: 'World\'s Largest Model Context Protocol Repository',
              sameAs: [
                'https://x.com/trackmcp',
                'https://github.com/trackmcp',
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Step 5: Migrate Homepage

**Current:** `src/pages/Home.tsx` (React Router)
```tsx
export default function Home() {
  const [tools, setTools] = useState([])
  
  useEffect(() => {
    fetchTools().then(setTools)
  }, [])
  
  return <div>...</div>
}
```

**Next.js:** `src/app/page.tsx` (Server Component)
```tsx
import { createClient } from '@/lib/supabase/server'
import { ToolCard } from '@/components/tool-card'
import { SearchBar } from '@/components/search-bar'

// This runs on the server!
async function getTools() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mcp_tools')
    .select('*')
    .order('stars', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data
}

export default async function HomePage() {
  const tools = await getTools()
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">
        Discover 10,000+ Model Context Protocol Tools
      </h1>
      <SearchBar />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </main>
  )
}

// Generate metadata dynamically
export async function generateMetadata() {
  const tools = await getTools()
  
  return {
    title: `Track MCP - ${tools.length.toLocaleString()}+ MCP Tools`,
    description: `Explore ${tools.length.toLocaleString()} Model Context Protocol tools`,
  }
}
```

### Step 6: Migrate Dynamic Tool Pages

**Current:** `src/pages/ToolDetail.tsx` (React Router)
```tsx
export default function ToolDetail() {
  const { slug } = useParams()
  const [tool, setTool] = useState(null)
  
  useEffect(() => {
    fetchTool(slug).then(setTool)
  }, [slug])
  
  return <div>...</div>
}
```

**Next.js:** `src/app/tool/[slug]/page.tsx` (Dynamic Route)
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

// Fetch tool data on server
async function getTool(slug: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mcp_tools')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error || !data) return null
  return data
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getTool(params.slug)
  
  if (!tool) {
    return {
      title: 'Tool Not Found',
    }
  }
  
  return {
    title: `${tool.name} - Track MCP`,
    description: tool.description,
    openGraph: {
      title: tool.name,
      description: tool.description,
      url: `https://www.trackmcp.com/tool/${tool.slug}`,
      images: [tool.image || 'https://www.trackmcp.com/og-image.png'],
    },
    alternates: {
      canonical: `https://www.trackmcp.com/tool/${tool.slug}`,
    },
  }
}

// Server Component - renders on server!
export default async function ToolPage({ params }: Props) {
  const tool = await getTool(params.slug)
  
  if (!tool) {
    notFound()
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{tool.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">{tool.description}</p>
      
      {/* Tool details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">About</h2>
          <div className="prose dark:prose-invert">
            {tool.readme}
          </div>
        </div>
        
        <aside>
          <h3 className="text-xl font-semibold mb-4">Details</h3>
          <dl className="space-y-2">
            <dt className="font-medium">Stars</dt>
            <dd>{tool.stars.toLocaleString()}</dd>
            
            <dt className="font-medium">Language</dt>
            <dd>{tool.language}</dd>
            
            <dt className="font-medium">License</dt>
            <dd>{tool.license}</dd>
          </dl>
        </aside>
      </div>
      
      {/* Add JSON-LD for SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: tool.name,
            description: tool.description,
            url: `https://www.trackmcp.com/tool/${tool.slug}`,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Cross-platform',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.5',
              ratingCount: tool.stars,
            },
          }),
        }}
      />
    </main>
  )
}

// Generate static pages at build time for top tools
export async function generateStaticParams() {
  const supabase = createClient()
  const { data: tools } = await supabase
    .from('mcp_tools')
    .select('slug')
    .order('stars', { ascending: false })
    .limit(1000) // Pre-render top 1000 tools
  
  return tools?.map((tool) => ({
    slug: tool.slug,
  })) || []
}
```

### Step 7: Configure Next.js

**`next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
  },
  // Enable static export if you want
  // output: 'export',
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/tools/:slug',
        destination: '/tool/:slug',
        permanent: true,
      },
    ]
  },
  
  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### Step 8: Update Supabase Client

**`src/lib/supabase/server.ts`** (Server-side)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**`src/lib/supabase/client.ts`** (Client-side)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 9: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect GitHub repo to Vercel dashboard
```

## Testing SSR Output

### Test with curl
```bash
# Should see full HTML content, not just <div id="root"></div>
curl https://www.trackmcp.com/ | grep -i "model context protocol"
curl https://www.trackmcp.com/tool/github-mcp-server | grep -i "github"
```

### View Page Source
```
Right-click → View Page Source
# Should see actual content in HTML
```

### Test with PerplexityBot User-Agent
```bash
curl -A "PerplexityBot/1.0" https://www.trackmcp.com/tool/github-mcp-server
```

## Migration Checklist

- [ ] Create Next.js project
- [ ] Install dependencies
- [ ] Migrate layout and global styles
- [ ] Convert homepage to Server Component
- [ ] Convert tool pages to dynamic routes
- [ ] Update Supabase client for SSR
- [ ] Migrate all components
- [ ] Test SSR output with curl
- [ ] Configure next.config.js
- [ ] Update environment variables
- [ ] Deploy to Vercel
- [ ] Verify with Google Rich Results Test
- [ ] Monitor Perplexity crawling

## Benefits After Migration

✅ **Perplexity can index content** - Full HTML in initial response  
✅ **Better SEO** - Google, Bing, and all crawlers see content  
✅ **Faster initial load** - Content visible before JavaScript loads  
✅ **Better performance** - Automatic code splitting and optimization  
✅ **Improved UX** - Progressive enhancement  

## Timeline Estimate

- **Setup & Configuration:** 1 day
- **Component Migration:** 3-5 days
- **Testing & Debugging:** 2-3 days
- **Deployment & Verification:** 1 day

**Total:** 1-2 weeks for full migration

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase with Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)

---

**Ready to start?** Begin with Step 1 and migrate incrementally. Test each page as you go!
