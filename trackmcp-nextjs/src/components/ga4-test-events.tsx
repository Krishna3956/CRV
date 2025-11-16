'use client'

import { useEffect } from 'react'

export function GA4TestEvents() {
  useEffect(() => {
    // Wait for GA4 to load
    const timeout = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        const gtag = (window as any).gtag

        // Send test events to activate GA4 data collection
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
        })

        gtag('event', 'test_activation', {
          event_category: 'system',
          event_label: 'GA4 Activation Test',
        })

        console.log('✅ GA4 Test Events Sent - Check GA4 Dashboard')
      }
    }, 2000)

    return () => clearTimeout(timeout)
  }, [])

  return null
}
