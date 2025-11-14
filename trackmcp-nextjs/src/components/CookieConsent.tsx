'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type CookiePreference = {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreference>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if user has already made a choice
    const savedPreference = localStorage.getItem('cookie-consent')
    if (!savedPreference) {
      // Show banner only if no preference is saved
      setIsVisible(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreference = {
      essential: true,
      analytics: true,
      marketing: true,
    }
    saveCookiePreference(allAccepted)
  }

  const handleRejectAll = () => {
    const onlyEssential: CookiePreference = {
      essential: true,
      analytics: false,
      marketing: false,
    }
    saveCookiePreference(onlyEssential)
  }

  const saveCookiePreference = (prefs: CookiePreference) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs))
    
    // Load/unload analytics based on preference
    if (prefs.analytics) {
      loadGoogleAnalytics()
    }
    
    setIsVisible(false)
  }

  const loadGoogleAnalytics = () => {
    // Google Analytics will be loaded if user consents
    if (typeof window !== 'undefined') {
      const w = window as any
      if (!w.gtag) {
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-22HQQFNJ1F'
        document.head.appendChild(script)

        w.dataLayer = w.dataLayer || []
        function gtag(...args: any[]) {
          w.dataLayer.push(args)
        }
        w.gtag = gtag
        gtag('js', new Date())
        gtag('config', 'G-22HQQFNJ1F')
      }
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm z-50">
      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg p-3 sm:p-4 space-y-3 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1 text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Text */}
        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pr-6">
          We use cookies to improve your experience and analyze site traffic.{' '}
          <a href="/cookies" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Learn more
          </a>
        </p>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRejectAll}
            className="flex-1 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200"
          >
            Reject
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-primary to-accent hover:shadow-md px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
