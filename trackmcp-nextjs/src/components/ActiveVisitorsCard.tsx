'use client'

import { useEffect, useState } from 'react'

export function ActiveVisitorsCard() {
  const [visitors, setVisitors] = useState<number | null>(null)
  const [isStatic, setIsStatic] = useState<boolean>(false)
  const [staticValue, setStaticValue] = useState<number>(3200)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Get the start of today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfDay = today.getTime()
    
    // Track when user landed on this page
    const pageLoadTime = Date.now()
    
    const calculateVisitors = () => {
      const now = Date.now()
      
      // Calculate total seconds elapsed since start of day
      const secondsElapsedToday = Math.floor((now - startOfDay) / 1000)
      
      // Base starting visitors at midnight
      const baseStart = 1200
      
      // Increase by 1 visitor every 10 seconds
      const increment = Math.floor(secondsElapsedToday / 10)
      
      const total = baseStart + increment
      
      // Cap at 8,500 max visitors
      return Math.min(total, 8500)
    }
    
    // Set initial value
    const initialValue = calculateVisitors()
    setVisitors(initialValue)
    setStaticValue(initialValue)

    // Update every 10 seconds to show increment
    const interval = setInterval(() => {
      const now = Date.now()
      const timeSpentOnPage = Math.floor((now - pageLoadTime) / 1000)
      
      // If user has spent more than 10 seconds on page, freeze the counter
      if (timeSpentOnPage > 10) {
        setIsStatic(true)
        clearInterval(interval)
        return
      }
      
      // Otherwise, continue updating
      const newValue = calculateVisitors()
      setVisitors(newValue)
      setStaticValue(newValue)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="group relative overflow-hidden rounded-lg border-2 border-green-500/30 hover:border-green-500/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-4 md:p-5">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, hsl(142 71% 45% / 0.08), transparent 70%)' }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

      <div className="relative z-10 text-center">
        <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
          {!mounted ? '3,200' : isStatic ? staticValue.toLocaleString() : (visitors ?? 3200).toLocaleString()}
        </div>
        <div className="text-xs md:text-xs font-semibold text-foreground">
          Unique Visitors Today
        </div>
      </div>
    </div>
  )
}
