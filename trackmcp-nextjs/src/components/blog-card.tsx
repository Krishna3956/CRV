'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Award } from 'lucide-react'
import { BlogMetadata } from '@/utils/blog-metadata'

interface BlogCardProps {
  blog: BlogMetadata
  isFeatured?: boolean
}

export function BlogCard({ blog, isFeatured = false }: BlogCardProps) {
  return (
    <Link
      href={blog.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <article className="group relative h-full overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer">
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm">
          <Award className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Community Pick</span>
        </div>
      )}

      {/* Featured Image */}
      {blog.featuredImage ? (
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          <Image
            src={blog.featuredImage}
            alt={blog.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-xs text-muted-foreground">No image available</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col h-full p-5">
        {/* Author Section - Prominent */}
        {blog.author && (
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/30">
            <div className="flex-shrink-0">
              {blog.authorAvatar ? (
                <Image
                  src={blog.authorAvatar}
                  alt={blog.author}
                  width={32}
                  height={32}
                  unoptimized
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                  {blog.author.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{blog.author}</p>
              {blog.domain && (
                <p className="text-xs text-muted-foreground truncate">{blog.domain}</p>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-bold line-clamp-2 mb-3 text-foreground group-hover:text-primary transition-colors">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
            {blog.excerpt}
          </p>
        )}

        {/* Footer - Source & CTA */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/30 mt-auto">
          {/* Source Logo */}
          <div className="flex items-center gap-2 min-w-0">
            {blog.favicon && (
              <Image
                src={blog.favicon}
                alt={blog.domain || 'Blog source'}
                width={16}
                height={16}
                unoptimized
                className="flex-shrink-0"
              />
            )}
            {blog.domain && (
              <span className="text-xs text-muted-foreground truncate">{blog.domain}</span>
            )}
          </div>

          {/* Read Blog Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              window.open(blog.url, '_blank')
            }}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/20 hover:border-primary/40 text-xs font-semibold text-primary transition-all duration-200"
          >
            Read
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
      </article>
    </Link>
  )
}
