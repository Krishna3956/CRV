// Content script for floating badge
let badgeInjected = false

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'INJECT_BADGE') {
    if (!badgeInjected) {
      injectBadge(request.mcpCount)
      badgeInjected = true
    }
  }
})

function injectBadge(count) {
  if (document.getElementById('trackmcp-badge')) return

  const badge = document.createElement('div')
  badge.id = 'trackmcp-badge'
  badge.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      cursor: pointer;
    ">
      🔍 ${count} MCP${count !== 1 ? 's' : ''} for this site
    </div>
  `

  badge.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })
  })

  document.body.appendChild(badge)
}
