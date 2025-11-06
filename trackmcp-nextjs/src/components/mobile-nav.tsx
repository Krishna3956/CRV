'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MobileNavProps {
  title: string
  showBackButton?: boolean
}

export function MobileNav({ title, showBackButton = true }: MobileNavProps) {
  const router = useRouter()

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {showBackButton ? (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs font-medium hover:text-primary transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Back</span>
          </button>
        ) : (
          <div className="w-10" />
        )}
        
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <Image 
            src="/logo.png" 
            alt="Track MCP Logo" 
            width={28} 
            height={28}
            className="rounded"
          />
          <span className="text-xs font-bold gradient-text whitespace-nowrap">Track MCP</span>
        </Link>
        
        <div className="flex-1" />
        
        <h1 className="text-xs font-semibold text-right line-clamp-1 flex-shrink">
          {title}
        </h1>
      </div>
    </div>
  )
}
