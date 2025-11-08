/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year - aggressive caching for avatars
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Optimize compilation
  swcMinify: true,
  
  // Enable source maps for production debugging
  productionBrowserSourceMaps: true,
  
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Optimize CSS loading
  optimizeFonts: true,
  
  // Webpack optimization for smaller bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
  
  // Prevent trailing slash redirects
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Enable static exports for better performance
  // output: 'export', // Uncomment for static export
  
  // Redirects for renamed or moved tools
  async redirects() {
    return [
      // Example redirects - add your 404 URLs here
      // {
      //   source: '/tool/old-tool-name',
      //   destination: '/tool/new-tool-name',
      //   permanent: true, // 301 redirect
      // },
      
      // Redirect trailing slashes (permanent 301)
      {
        source: '/tool/:name/',
        destination: '/tool/:name',
        permanent: true,
      },
      
      // Redirect root trailing slash (permanent 301)
      {
        source: '/',
        destination: '/',
        permanent: true,
      },
      
      // Redirect .well-known URLs without trailing slashes
      {
        source: '/.well-known/:path*',
        destination: '/.well-known/:path*',
        permanent: true,
      },
      
      // Redirect apple-app-site-association with trailing slash
      {
        source: '/apple-app-site-association/',
        destination: '/apple-app-site-association',
        permanent: true,
      },
      
      // Redirect .well-known/apple-app-site-association with trailing slash
      {
        source: '/.well-known/apple-app-site-association/',
        destination: '/.well-known/apple-app-site-association',
        permanent: true,
      },
    ]
  },
  
  // Headers for SEO and Security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com https://*.supabase.co https://www.google-analytics.com https://www.clarity.ms;",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate',
          },
        ],
      },
      // Block file downloads from indexing
      {
        source: '/:path*.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg|iso|tar|gz|mp3|mp4|avi|mov|wav|flv|wmv|webm|mkv|m4a|m4v|3gp|ogv)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, immutable',
          },
        ],
      },
      // Block source maps from indexing
      {
        source: '/:path*.map',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Block config files from indexing
      {
        source: '/:path*.(json|xml|yml|yaml|toml|ini|cfg|conf|config|env|lock)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/apple-app-site-association',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
