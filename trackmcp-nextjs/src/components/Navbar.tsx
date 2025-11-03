"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Plus } from "lucide-react"
import { SubmitToolDialog } from "./SubmitToolDialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile, visible on md+ */}
      <nav className="hidden md:block w-full border-b bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 shadow-sm">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image 
                src="/logo.png" 
                alt="Track MCP Logo" 
                width={36} 
                height={36}
                className="rounded-lg"
                priority
                fetchPriority="high"
              />
              <span className="text-xl font-bold gradient-text">Track MCP</span>
            </Link>

            {/* Right side - Enhanced Submit button with better contrast */}
            <div className="flex items-center gap-6">
              <div className="h-8 w-px bg-border"></div>
              <SubmitToolDialog variant="enhanced" />
            </div>
          </div>
        </div>
      </nav>

    </>
  )
}
