/**
 * GA4 Test Events - Send test data to Google Analytics
 * Use this to verify GA4 is receiving data
 */

export function sendTestEvents() {
  if (typeof window === 'undefined') return

  // Ensure gtag is available
  if (!(window as any).gtag) {
    console.error('GA4 not loaded yet')
    return
  }

  const gtag = (window as any).gtag

  // Test 1: Page View Event
  gtag('event', 'page_view', {
    page_title: 'Test Page View',
    page_location: window.location.href,
  })

  // Test 2: Custom Event
  gtag('event', 'test_event', {
    event_category: 'engagement',
    event_label: 'GA4 Test',
    value: 1,
  })

  // Test 3: User Engagement
  gtag('event', 'user_engagement', {
    engagement_time_msec: 100,
  })

  // Test 4: View Item Event
  gtag('event', 'view_item', {
    items: [
      {
        item_id: 'test-tool-001',
        item_name: 'Test MCP Tool',
        item_category: 'MCP',
      },
    ],
  })

  console.log('✅ GA4 Test Events Sent')
}

// Auto-send test events on page load (for testing only)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Send test events after a small delay to ensure GA4 is ready
    setTimeout(() => {
      sendTestEvents()
    }, 1000)
  })
}
