"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ChevronDown, Sparkles, TrendingUp, Search as SearchIcon, FileText } from "lucide-react"
import { SubmitToolDialog } from "./SubmitToolDialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Still used for Categories dropdown
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Zap, Code, Cpu, Globe, Database, MessageSquare, Grid3x3, Mail, Info, Layers } from "lucide-react"

const CATEGORIES = [
  { label: "All Categories", href: "/category", icon: Grid3x3 },
  { label: "AI & Machine Learning", href: "/category/ai-and-machine-learning", icon: Cpu },
  { label: "Servers & Infrastructure", href: "/category/servers-and-infrastructure", icon: Code },
  { label: "Developer Kits", href: "/category/developer-kits", icon: Zap },
  { label: "Web & Internet Tools", href: "/category/web-and-internet-tools", icon: Globe },
  { label: "Search & Data Retrieval", href: "/category/search-and-data-retrieval", icon: SearchIcon },
  { label: "File & Data Management", href: "/category/file-and-data-management", icon: Database },
  { label: "Automation & Productivity", href: "/category/automation-and-productivity", icon: Zap },
  { label: "Communication", href: "/category/communication", icon: MessageSquare },
  { label: "Others", href: "/category/others", icon: Layers },
]

interface NavbarProps {
  hideOnMobile?: boolean
}

export const Navbar = ({ hideOnMobile: hideOnMobileProp }: NavbarProps) => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Hide mobile nav on homepage by default, or if explicitly set
  const hideOnMobile = hideOnMobileProp !== undefined ? hideOnMobileProp : pathname === "/"

  // Handle search submission
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Redirect to homepage with search query
      window.location.href = `/?q=${encodeURIComponent(searchQuery)}`
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile, visible on md+ */}
      {/* Always hidden on mobile (< md), visible on desktop (md+). Not sticky on homepage so scroll nav can take over */}
      <nav className={`hidden md:block w-full border-b ${pathname === '/' ? 'bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 shadow-sm' : 'sticky top-0 bg-white/95 backdrop-blur-md shadow-lg'} z-50`}>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-8">
            {/* Left side - Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <Image 
                src="/logo.png" 
                alt="Track MCP Logo" 
                width={36} 
                height={36}
                className="rounded-lg"
                priority
              />
              <span className="text-xl font-bold gradient-text whitespace-nowrap">Track MCP</span>
            </Link>

            {/* Center - Main Navigation Links */}
            <div className="flex items-center gap-1 flex-grow justify-center">
              {/* Categories Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="gap-1 text-sm font-medium hover:bg-accent/50 transition-all duration-200"
                  >
                    Categories
                    <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start"
                >
                  <DropdownMenuLabel>
                    Browse Categories
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {CATEGORIES.map((category, index) => {
                    const Icon = category.icon
                    return (
                      <DropdownMenuItem 
                        key={category.href} 
                        asChild
                      >
                        <Link 
                          href={category.href}
                          className="flex items-center w-full"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1">{category.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Top MCP Link */}
              <Link href="/top-mcp">
                <Button 
                  variant="ghost" 
                  className="gap-2 text-sm font-medium hover:bg-accent/50"
                >
                  <TrendingUp className="h-4 w-4" />
                  Top MCP
                </Button>
              </Link>

              {/* What's New Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="gap-1 text-sm font-medium hover:bg-accent/50 transition-all duration-200"
                  >
                    <Sparkles className="h-4 w-4" />
                    What's New
                    <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start"
                >
                  <DropdownMenuLabel>
                    Discover What's New
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/new"
                      className="flex items-center w-full"
                    >
                      <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1">Latest MCPs</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/new/featured-blogs"
                      className="flex items-center w-full"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1">Featured Blogs</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* About Us Link */}
              <Link href="/about">
                <Button 
                  variant="ghost" 
                  className="gap-2 text-sm font-medium hover:bg-accent/50 transition-all duration-200"
                >
                  <Info className="h-4 w-4" />
                  About Us
                </Button>
              </Link>
            </div>

            {/* Right side - Submit */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Submit Tool Button */}
              <SubmitToolDialog variant="enhanced" />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Completely hidden across entire website */}
      {/* No mobile nav bar - cleaner mobile experience */}
    </>
  )
}


