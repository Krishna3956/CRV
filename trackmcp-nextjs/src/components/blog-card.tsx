'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Award, ArrowRight } from 'lucide-react'
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
      <article className="group h-full overflow-hidden rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer flex flex-col">
        {/* Featured Image - BIG */}
        {blog.featuredImage ? (
          <div className="relative h-56 w-full overflow-hidden bg-secondary flex-shrink-0">
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              unoptimized
              loading="lazy"
              className="object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Featured Badge - Ribbon Overlay */}
            {isFeatured && (
              <div className="absolute top-3 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-l-lg shadow-lg">
                <Award className="h-4 w-4" />
                <span className="text-xs font-bold">Community Pick</span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-56 w-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center flex-shrink-0">
            <div className="text-5xl">📝</div>
            
            {/* Featured Badge - Ribbon Overlay */}
            {isFeatured && (
              <div className="absolute top-3 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-l-lg shadow-lg">
                <Award className="h-4 w-4" />
                <span className="text-xs font-bold">Community Pick</span>
              </div>
            )}
          </div>
        )}

        {/* Content - SMALL */}
        <div className="flex flex-col h-full p-3.5 border-t-2 border-border">

          {/* Title - Small */}
          <h3 className="text-base font-bold line-clamp-2 mb-1 text-foreground group-hover:text-primary transition-colors duration-200 leading-snug">
            {blog.title}
          </h3>

          {/* Description - Very Small */}
          {blog.excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-grow leading-relaxed">
              {blog.excerpt}
            </p>
          )}

          {/* Author Section - Bottom */}
          {blog.author && (
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-shrink-0">
                  {blog.authorAvatar ? (
                    <Image
                      src={blog.authorAvatar}
                      alt={blog.author}
                      width={32}
                      height={32}
                      unoptimized
                      className="rounded-full ring-1 ring-border/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {blog.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{blog.author}</p>
                  {blog.domain && (
                    <p className="text-xs text-muted-foreground truncate">{blog.domain}</p>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
