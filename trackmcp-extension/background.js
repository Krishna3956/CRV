const API_BASE = 'http://localhost:3004'

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

// Update badge when tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkPageForMcps(tab)
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab) checkPageForMcps(tab)
  })
})

async function checkPageForMcps(tab) {
  try {
    const url = new URL(tab.url)
    const hostname = url.hostname + (url.port ? ':' + url.port : '')
    const siteName = getSiteNameFromHostname(hostname)

    const response = await fetch(
      `${API_BASE}/api/mcp/lookup?siteName=${encodeURIComponent(siteName)}&url=${encodeURIComponent(tab.url)}`
    )

    if (response.ok) {
      const data = await response.json()
      const mcpCount = data.mcps?.length || 0

      if (mcpCount > 0) {
        // Update badge
        chrome.action.setBadgeText({
          text: mcpCount.toString(),
          tabId: tab.id,
        })
        chrome.action.setBadgeBackgroundColor({
          color: '#3b82f6',
          tabId: tab.id,
        })

        // Send MCPs data to popup
        chrome.runtime.sendMessage({
          type: 'PAGE_MCPS_FOUND',
          mcps: data.mcps,
          siteName: siteName,
          category: data.category
        }).catch(() => {
          // Popup not open, ignore
        })

        // Inject floating badge into content script
        chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_FLOATING_BADGE',
          mcpCount: mcpCount,
          siteName: siteName
        }).catch(() => {
          // Content script not ready, ignore
        })
      } else {
        // Clear badge
        chrome.action.setBadgeText({ text: '', tabId: tab.id })

        // Send no MCPs message
        chrome.runtime.sendMessage({
          type: 'PAGE_MCPS_NOT_FOUND',
          siteName: siteName
        }).catch(() => {
          // Popup not open, ignore
        })
      }
    }
  } catch (err) {
    console.error('Background error:', err)
  }
}
