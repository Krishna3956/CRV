"use client"

import Link from "next/link"
import Image from "next/image"
import { SubmitToolDialog } from "./SubmitToolDialog"

export const Navbar = () => {
  return (
    <nav className="w-full border-b bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo and name */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.png" 
              alt="Track MCP Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold gradient-text">Track MCP</span>
          </Link>

          {/* Right side - Submit button */}
          <div className="flex items-center gap-4">
            <SubmitToolDialog />
          </div>
        </div>
      </div>
    </nav>
  )
}
