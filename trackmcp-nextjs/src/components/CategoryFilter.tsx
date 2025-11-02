'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'featured', label: 'Featured', icon: Sparkles },
  { id: 'AI & Machine Learning', label: 'AI & ML', icon: null },
  { id: 'Developer Kits', label: 'Dev Kits', icon: null },
  { id: 'Servers & Infrastructure', label: 'Infrastructure', icon: null },
  { id: 'Search & Data Retrieval', label: 'Search', icon: null },
  { id: 'Automation & Productivity', label: 'Automation', icon: null },
  { id: 'Web & Internet Tools', label: 'Web Tools', icon: null },
  { id: 'Communication', label: 'Communication', icon: null },
  { id: 'File & Data Management', label: 'Files', icon: null },
  { id: 'Others', label: 'Others', icon: null },
] as const

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CATEGORIES.map((category) => {
        const Icon = category.icon
        const isSelected = selectedCategory === category.id
        
        return (
          <Button
            key={category.id}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={`
              transition-all duration-200 min-h-[36px] px-3 py-1.5 text-sm
              ${isSelected 
                ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md' 
                : 'hover:border-primary/50'
              }
            `}
          >
            {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
            {category.label}
          </Button>
        )
      })}
    </div>
  )
}
