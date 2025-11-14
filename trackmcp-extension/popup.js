const API_BASE = 'https://www.trackmcp.com'
const searchInput = document.getElementById('searchInput')
const resultsDiv = document.getElementById('results')
const emptyState = document.getElementById('emptyState')
const searchResultsSection = document.getElementById('searchResultsSection')
const trendingSection = document.getElementById('trendingSection')
const trendingList = document.getElementById('trendingList')
const recentSearchesSection = document.getElementById('recentSearchesSection')
const recentSearchesList = document.getElementById('recentSearchesList')
const favoritesSection = document.getElementById('favoritesSection')
const favoritesList = document.getElementById('favoritesList')

let searchTimeout
let recentSearches = []
let favorites = []

// Load recent searches and favorites from storage
chrome.storage.local.get(['recentSearches', 'favorites'], (result) => {
  recentSearches = result.recentSearches || []
  favorites = result.favorites || []
  // displayRecentSearches and displayFavorites removed - not used in simplified UI
})

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Page detection disabled - removed functionality
})

// Map hostname to site names
const HOSTNAME_TO_SITE_NAME = {
  'github.com': 'GitHub',
  'www.github.com': 'GitHub',
  'stackoverflow.com': 'Stack Overflow',
  'www.stackoverflow.com': 'Stack Overflow',
  'medium.com': 'Medium',
  'www.medium.com': 'Medium',
  'dev.to': 'Dev.to',
  'twitter.com': 'Twitter',
  'www.twitter.com': 'Twitter',
  'x.com': 'Twitter',
  'www.x.com': 'Twitter',
  'linkedin.com': 'LinkedIn',
  'www.linkedin.com': 'LinkedIn',
  'reddit.com': 'Reddit',
  'www.reddit.com': 'Reddit',
  'news.ycombinator.com': 'Hacker News',
  'producthunt.com': 'Product Hunt',
  'www.producthunt.com': 'Product Hunt',
  'openai.com': 'OpenAI',
  'www.openai.com': 'OpenAI',
  'anthropic.com': 'Anthropic',
  'www.anthropic.com': 'Anthropic',
  'google.com': 'Google',
  'www.google.com': 'Google',
  'huggingface.co': 'Hugging Face',
  'www.huggingface.co': 'Hugging Face',
  'kaggle.com': 'Kaggle',
  'www.kaggle.com': 'Kaggle',
  'jupyter.org': 'Jupyter',
  'www.jupyter.org': 'Jupyter',
  'colab.research.google.com': 'Google Colab',
  'localhost': 'localhost',
  'localhost:3004': 'localhost',
  '127.0.0.1': 'localhost',
  '127.0.0.1:3004': 'localhost',
}

function getSiteNameFromHostname(hostname) {
  return HOSTNAME_TO_SITE_NAME[hostname] || hostname
}

// Also request page MCPs when popup opens
window.addEventListener('load', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const tab = tabs[0]
      const url = new URL(tab.url)
      const hostname = url.hostname + (url.port ? ':' + url.port : '')
      const siteName = getSiteNameFromHostname(hostname)
      
      console.log('=== PAGE DETECTION ===')
      console.log('Tab URL:', tab.url)
      console.log('Tab Title:', tab.title)
      console.log('Hostname:', hostname)
      console.log('Site Name:', siteName)
      console.log('=== END ===')
      
      // Fetch MCPs for this page
      const apiUrl = `http://localhost:3004/api/mcp/lookup?siteName=${encodeURIComponent(siteName)}&url=${encodeURIComponent(tab.url)}`
      console.log('API URL:', apiUrl)
      
      fetch(apiUrl)
        .then(r => r.json())
        .then(data => {
          console.log('Fetched MCPs for', siteName, ':', data.mcps.length, 'MCPs')
          console.log('First MCP:', data.mcps[0]?.repo_name)
          if (data.mcps && data.mcps.length > 0) {
            displayPageMcps(data.mcps, siteName, data.category)
          } else {
            displayNoPageMcps(siteName)
          }
        })
        .catch(err => console.error('Error fetching page MCPs:', err))
    }
  })
})

// Page detection functions removed

function displayRecentSearches() {
  // Hide recent searches section
  recentSearchesSection.style.display = 'none'
}

function displayFavorites() {
  if (favorites.length === 0) {
    favoritesSection.style.display = 'none'
    return
  }
  
  favoritesSection.style.display = 'block'
  favoritesList.innerHTML = favorites.slice(0, 3).map(mcp => {
    const initials = mcp.repo_name.slice(0, 2).toUpperCase()
    return `
      <div class="mcp-card" onclick="openMcp('${mcp.repo_name}')">
        <div class="mcp-header">
          <div class="mcp-avatar">${initials}</div>
          <div style="flex: 1; min-width: 0;">
            <div class="mcp-title">${mcp.repo_name}</div>
            <div class="mcp-desc">${mcp.description}</div>
          </div>
        </div>
        <div class="mcp-footer">
          <div class="mcp-stars">⭐ ${mcp.stars?.toLocaleString() || 0}</div>
        </div>
      </div>
    `
  }).join('')
}

function searchFromRecent(query) {
  searchInput.value = query
  searchInput.dispatchEvent(new Event('input'))
}

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout)
  const query = e.target.value.trim()

  if (query.length === 0) {
    resultsDiv.innerHTML = ''
    searchResultsSection.style.display = 'none'
    emptyState.style.display = 'block'
    searchInput.parentElement.classList.remove('loading')
    return
  }

  emptyState.style.display = 'none'
  searchInput.parentElement.classList.add('loading')

  searchTimeout = setTimeout(() => {
    fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        searchInput.parentElement.classList.remove('loading')
        searchResultsSection.style.display = 'block'
        resultsDiv.innerHTML = '<div class="loading">Searching...</div>'
        // Save to recent searches
        recentSearches = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5)
        chrome.storage.local.set({ recentSearches })

        if (!data.results || data.results.length === 0) {
          resultsDiv.innerHTML = '<div class="empty-state">No MCPs found</div>'
          return
        }

        resultsDiv.innerHTML = data.results.slice(0, 5).map(mcp => {
          const initials = mcp.repo_name.slice(0, 2).toUpperCase()
          return `
            <div class="mcp-card" data-repo-name="${mcp.repo_name}">
              <div class="mcp-header">
                <div class="mcp-avatar">${initials}</div>
                <div style="flex: 1; min-width: 0;">
                  <div class="mcp-title">${mcp.repo_name}</div>
                  <div class="mcp-desc">${mcp.description}</div>
                </div>
              </div>
              <div class="mcp-footer">
                <div class="mcp-stars">⭐ ${mcp.stars?.toLocaleString() || 0}</div>
              </div>
            </div>
          `
        }).join('')

        const cards = document.querySelectorAll('.mcp-card')
        console.log('Found', cards.length, 'cards to attach listeners')
        cards.forEach((card, index) => {
          const repoName = card.getAttribute('data-repo-name')
          console.log('Attaching listener to card', index, ':', repoName)
          card.addEventListener('click', function(e) {
            console.log('Card clicked!', repoName)
            e.stopPropagation()
            if (repoName) {
              console.log('Opening MCP:', repoName)
              window.openMcp(repoName)
            }
          })
        })

        if (data.results.length > 5) {
          resultsDiv.innerHTML += `
            <button class="footer-link" style="width: 100%; margin-top: 8px;" data-view-all="${query}">
              View All Results →
            </button>
          `
          const viewAllBtn = resultsDiv.querySelector('[data-view-all]')
          if (viewAllBtn) {
            viewAllBtn.addEventListener('click', function() {
              const q = this.getAttribute('data-view-all')
              window.viewAllResults(q)
            })
          }
        }
      })
      .catch(err => {
        resultsDiv.innerHTML = `
          <div class="empty-state">
            <div>Error loading results</div>
            <button class="footer-link" style="width: 100%; margin-top: 8px;" onclick="searchInput.focus()">
              Try Again
            </button>
          </div>
        `
      })
  }, 300)
})

window.openMcp = function(repoName) {
  console.log('=== openMcp called with:', repoName)
  if (!repoName) {
    console.error('No repoName provided')
    return
  }

  const websiteUrl = 'https://www.trackmcp.com'
  const toolUrl = `${websiteUrl}/tool/${encodeURIComponent(repoName)}`
  console.log('Full URL:', toolUrl)
  console.log('Chrome API available:', typeof chrome !== 'undefined')
  console.log('Chrome tabs available:', typeof chrome.tabs !== 'undefined')

  try {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      console.error('Chrome API not available')
      // Fallback: open in current tab
      window.open(toolUrl, '_blank')
      return
    }

    chrome.tabs.create({ url: toolUrl }, (tab) => {
      console.log('Tab creation callback fired')
      if (chrome.runtime.lastError) {
        console.error('Chrome error:', chrome.runtime.lastError)
        window.open(toolUrl, '_blank')
      } else {
        console.log('✅ Tab opened successfully:', tab.id, 'URL:', tab.url)
      }
    })
  } catch (error) {
    console.error('❌ Exception in openMcp:', error.message, error.stack)
    // Fallback: try window.open
    try {
      window.open(toolUrl, '_blank')
      console.log('Opened with window.open fallback')
    } catch (e) {
      console.error('Fallback also failed:', e)
    }
  }
}

window.viewAllResults = function(query) {
  const searchUrl = query ? `https://www.trackmcp.com/search?q=${encodeURIComponent(query)}` : 'https://www.trackmcp.com'
  console.log('Opening search results:', searchUrl)
  try {
    chrome.tabs.create({ url: searchUrl }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening tab:', chrome.runtime.lastError)
      } else {
        console.log('Search tab opened:', tab.id)
      }
    })
  } catch (error) {
    console.error('Exception opening search:', error)
  }
}

// Load trending on open
window.addEventListener('load', () => {
  fetch(`${API_BASE}/api/trending`)
    .then(r => r.json())
    .then(data => {
      if (data.trending && data.trending.length > 0) {
        const trending = data.trending.slice(0, 3).map(mcp => `
          <div class="mcp-card" onclick="openMcp('${mcp.repo_name}')">
            <div class="mcp-title">${mcp.repo_name}</div>
            <div class="mcp-desc">${mcp.description}</div>
            <div class="mcp-stars">⭐ ${mcp.stars?.toLocaleString() || 0}</div>
          </div>
        `).join('')

        if (resultsDiv.innerHTML === '') {
          resultsDiv.innerHTML = `
            <div class="section">
              <div class="section-title">🔥 Trending</div>
              ${trending}
              <button class="footer-link" style="width: 100%; margin-top: 8px;" onclick="viewAllResults('')">
                View All Trending →
              </button>
            </div>
          `
        }
      }
    })
    .catch(err => console.error('Trending error:', err))
})

function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle')
  if (!themeToggle) {
    console.error('Theme toggle button not found')
    return
  }

  // Load saved theme preference
  chrome.storage.local.get(['theme'], (result) => {
    const savedTheme = result.theme || 'dark'
    applyTheme(savedTheme)
  })

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    applyTheme(newTheme)
    chrome.storage.local.set({ theme: newTheme })
  })
}

function applyTheme(theme) {
  const themeToggle = document.getElementById('themeToggle')
  if (theme === 'light') {
    document.body.classList.add('light-theme')
    if (themeToggle) themeToggle.textContent = '☀️'
  } else {
    document.body.classList.remove('light-theme')
    if (themeToggle) themeToggle.textContent = '🌙'
  }
}

// Initialize theme toggle when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle)
} else {
  initThemeToggle()
}
