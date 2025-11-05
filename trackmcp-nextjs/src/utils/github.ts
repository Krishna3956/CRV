// GitHub API utility with token support, caching, and rate limit handling
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN

// In-memory cache with TTL
interface CacheEntry {
  data: any
  timestamp: number
  etag?: string
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const RATE_LIMIT_CACHE_TTL = 60 * 60 * 1000 // 1 hour for rate-limited responses

// Rate limit state
let rateLimitReset: number | null = null
let remainingRequests: number | null = null

export const fetchGitHub = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
  // Don't pre-emptively block requests - let GitHub API respond with actual rate limit status
  // This allows requests to go through after rate limit resets

  // Check cache first
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for: ${url}`)
    const isText = typeof cached.data === 'string'
    return new Response(isText ? cached.data : JSON.stringify(cached.data), {
      status: 200,
      headers: { 
        'Content-Type': isText ? 'text/plain' : 'application/json', 
        'X-Cache': 'HIT' 
      }
    })
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Add authorization token if available
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`
  }

  // Add default Accept header for GitHub API
  if (!headers['Accept']) {
    headers['Accept'] = 'application/vnd.github.v3.raw'
  }

  // Add ETag for conditional requests if we have cached data
  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Update rate limit info from headers
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const reset = response.headers.get('X-RateLimit-Reset')
    
    if (remaining) remainingRequests = parseInt(remaining)
    if (reset) rateLimitReset = parseInt(reset) * 1000

    // Log rate limit status
    if (remainingRequests !== null && remainingRequests < 10) {
      console.warn(`GitHub API: Only ${remainingRequests} requests remaining`)
    }

    // Handle 304 Not Modified - use cached data
    if (response.status === 304 && cached) {
      console.log(`Cache revalidated for: ${url}`)
      cached.timestamp = Date.now() // Refresh cache timestamp
      const isText = typeof cached.data === 'string'
      return new Response(isText ? cached.data : JSON.stringify(cached.data), {
        status: 200,
        headers: { 
          'Content-Type': isText ? 'text/plain' : 'application/json', 
          'X-Cache': 'REVALIDATED' 
        }
      })
    }

    // Handle rate limiting (403 or 429)
    if (response.status === 403 || response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset')
      if (resetTime) {
        rateLimitReset = parseInt(resetTime) * 1000
      }

      console.error('GitHub API rate limit exceeded')
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log('Returning stale cache due to rate limit')
        // Extend cache for rate-limited responses
        cached.timestamp = Date.now()
        const isText = typeof cached.data === 'string'
        return new Response(isText ? cached.data : JSON.stringify(cached.data), {
          status: 200,
          headers: { 
            'Content-Type': isText ? 'text/plain' : 'application/json', 
            'X-Cache': 'STALE-RATE-LIMITED' 
          }
        })
      }

      // No cache available, throw error
      throw new Error('GitHub API rate limit exceeded. Please add a GitHub token or try again later.')
    }

    // Handle other errors with retry
    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        // Retry on server errors with exponential backoff
        const delay = (4 - retries) * 1000 // 1s, 2s, 3s
        console.log(`Retrying GitHub API call in ${delay}ms... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchGitHub(url, options, retries - 1)
      }

      // Return cached data on error if available
      if (cached) {
        console.log('Returning stale cache due to error')
        const isText = typeof cached.data === 'string'
        return new Response(isText ? cached.data : JSON.stringify(cached.data), {
          status: 200,
          headers: { 
            'Content-Type': isText ? 'text/plain' : 'application/json', 
            'X-Cache': 'STALE-ERROR' 
          }
        })
      }

      return response // Return error response if no cache
    }

    // Success - cache the response
    const etag = response.headers.get('ETag')
    const data = await response.clone().json().catch(() => response.clone().text())
    
    cache.set(url, {
      data,
      timestamp: Date.now(),
      etag: etag || undefined
    })

    // Clean up old cache entries (keep cache size manageable)
    if (cache.size > 1000) {
      const oldestKey = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0]
      cache.delete(oldestKey)
    }

    return response
  } catch (error) {
    console.error('GitHub API fetch error:', error)
    
    // Return cached data on network error if available
    if (cached) {
      console.log('Returning stale cache due to network error')
      const isText = typeof cached.data === 'string'
      return new Response(isText ? cached.data : JSON.stringify(cached.data), {
        status: 200,
        headers: { 
          'Content-Type': isText ? 'text/plain' : 'application/json', 
          'X-Cache': 'STALE-NETWORK-ERROR' 
        }
      })
    }
    
    throw error
  }
}

// Helper to check rate limit status
export const getRateLimitStatus = () => {
  return {
    remaining: remainingRequests,
    resetTime: rateLimitReset ? new Date(rateLimitReset) : null,
    isLimited: rateLimitReset ? Date.now() < rateLimitReset : false
  }
}

// Helper to clear cache (useful for testing)
export const clearGitHubCache = () => {
  cache.clear()
  console.log('GitHub cache cleared')
}
