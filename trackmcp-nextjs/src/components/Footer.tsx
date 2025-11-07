'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github, Linkedin, Twitter, Mail, ExternalLink } from 'lucide-react'
import { SubmitToolDialog } from './SubmitToolDialog'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Categories', href: '/category' },
        { label: 'Top Tools', href: '/top-mcp' },
        { label: 'New & Updated', href: '/new' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    },
  ]

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub', color: 'hover:text-gray-400' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-600' },
    { icon: Mail, href: 'mailto:contact@trackmcp.com', label: 'Email', color: 'hover:text-primary' },
  ]

  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-background to-background/50 backdrop-blur-sm mt-12">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link 
              href="/" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity mb-4 w-fit"
            >
              <Image 
                src="/logo.png" 
                alt="Track MCP Logo" 
                width={36} 
                height={36}
                className="rounded-lg"
              />
              <span className="text-xl font-bold gradient-text">Track MCP</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
              The world&apos;s largest repository of Model Context Protocol servers. Discover, explore, and submit MCP tools.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`text-muted-foreground transition-colors ${social.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm mb-4 text-foreground">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Submit Tool Button */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Submit</h4>
            <SubmitToolDialog variant="default" buttonText="Submit Tool" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {currentYear} TrackMCP. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Built with ❤️ by{' '}
            <a
              href="https://www.linkedin.com/in/krishnaa-goyal/"
              target="_blank"
              rel="author noopener noreferrer"
              className="text-primary hover:underline font-medium transition-colors"
            >
              Krishna Goyal
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
