'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { TableOfContentsItem } from '@/utils/toc'

interface TableOfContentsProps {
  items: TableOfContentsItem[]
  pageUrl: string
}

export function TableOfContents({ items, pageUrl }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    // Set up Intersection Observer to track which section is in view
    const headings = document.querySelectorAll('h2[id], h3[id], h4[id]')
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        rootMargin: '-50% 0px -50% 0px', // Trigger when heading is in middle of viewport
      }
    )

    headings.forEach((heading) => observer.observe(heading))

    return () => {
      headings.forEach((heading) => observer.unobserve(heading))
    }
  }, [])

  const handleLinkClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveId(id)
    }
  }

  const renderItems = (items: TableOfContentsItem[], depth = 0) => {
    return (
      <ul className={`space-y-1 ${depth > 0 ? 'ml-4' : ''}`}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => handleLinkClick(item.id)}
              className={`text-sm py-2 px-3 rounded transition-all duration-150 w-full text-left ${
                activeId === item.id
                  ? 'text-foreground font-medium bg-muted/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
              aria-current={activeId === item.id ? 'page' : undefined}
            >
              {item.text}
            </button>
            {item.children && item.children.length > 0 && (
              renderItems(item.children, depth + 1)
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav className="bg-background border-2 border-foreground/10 hover:border-foreground/15 rounded-lg p-4 transition-colors duration-200">
      {/* Header with toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-4 pb-3 border-b border-foreground/8 hover:border-foreground/12 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h3 className="font-semibold text-sm text-foreground">On this page</h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 text-muted-foreground ${isExpanded ? '' : '-rotate-90'}`}
        />
      </button>

      {/* TOC Items */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto pr-2 space-y-0.5">
          {renderItems(items)}
        </div>
      )}

      {/* SEO Helper: Hidden links for search engines */}
      <div className="sr-only" role="doc-toc">
        <h2>Table of Contents</h2>
        <ul>
          {flattenToc(items).map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

/**
 * Flatten hierarchical TOC for screen readers
 */
function flattenToc(items: TableOfContentsItem[]): TableOfContentsItem[] {
  const result: TableOfContentsItem[] = []

  function flatten(items: TableOfContentsItem[]) {
    for (const item of items) {
      result.push(item)
      if (item.children) {
        flatten(item.children)
      }
    }
  }

  flatten(items)
  return result
}
