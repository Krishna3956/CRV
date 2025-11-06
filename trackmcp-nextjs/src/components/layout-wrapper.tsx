'use client'

import React from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

interface LayoutWrapperProps {
  children: React.ReactNode
  navbarVisible?: boolean
}

/**
 * Optimized Layout Wrapper Component
 * 
 * Ensures footer always stays at bottom without visual flash:
 * 1. Flex column layout with min-h-screen for full viewport
 * 2. Main content with flex-grow to expand available space
 * 3. Responsive min-height reserves viewport space on mobile
 * 4. Footer always at bottom, never appears first
 * 
 * No useState/useEffect needed - cleaner and faster
 */
export function LayoutWrapper({ children, navbarVisible = true }: LayoutWrapperProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          {/* Navbar: optional for mobile */}
          {navbarVisible && <Navbar />}
          
          {/* Main content area with responsive minimum height */}
          {/* Mobile: min-h-[calc(100vh-64px-120px)] reserves viewport space (64px navbar, 120px footer) */}
          {/* Desktop (sm+): min-h-0 allows natural sizing */}
          <main className="flex-grow min-h-[calc(100vh-64px-120px)] sm:min-h-0">
            {children}
          </main>
          
          {/* Footer always at bottom - never floats up or disappears */}
          <Footer />
        </div>
        
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </ThemeProvider>
  )
}
