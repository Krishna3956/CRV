'use client'

import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { generateHeadingId } from "@/utils/toc"

const CodeBlock = ({ code, language }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative bg-slate-950 rounded-lg overflow-hidden my-4 border border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-100 transition-colors px-2 py-1 rounded hover:bg-slate-800"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-slate-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
        <code>{code}</code>
      </pre>
    </div>
  )
}

const renderInlineMarkdown = (text: string, githubUrl?: string) => {
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let key = 0
  
  // Process inline code first (backticks)
  const codeRegex = /`([^`]+)`/g
  let codeMatch
  let lastIndex = 0
  
  while ((codeMatch = codeRegex.exec(text)) !== null) {
    if (codeMatch.index > lastIndex) {
      const beforeCode = text.slice(lastIndex, codeMatch.index)
      parts.push(...processTextFormatting(beforeCode, key++, githubUrl))
    }
    parts.push(
      <code key={`code-${key++}`} className="bg-slate-900 text-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
        {codeMatch[1]}
      </code>
    )
    lastIndex = codeMatch.index + codeMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processTextFormatting(text.slice(lastIndex), key++, githubUrl))
  }
  
  return parts.length > 0 ? parts : text
}

const resolveImageUrl = (url: string, githubUrl?: string): string => {
  // If it's already an absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If we have a GitHub URL, resolve relative paths
  if (githubUrl) {
    const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (repoMatch) {
      const [, owner, repo] = repoMatch
      const cleanRepo = repo.replace(/\.git$/, '')
      // Remove leading ./ or /
      const cleanPath = url.replace(/^\.\//, '').replace(/^\//, '')
      return `https://raw.githubusercontent.com/${owner}/${cleanRepo}/main/${cleanPath}`
    }
  }
  
  return url
}

const processTextFormatting = (text: string, startKey: number, githubUrl?: string) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Process image links [![alt](img-url)](link-url) first
  const imageLinkRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g
  let imageLinkMatch
  let lastIndex = 0
  
  while ((imageLinkMatch = imageLinkRegex.exec(text)) !== null) {
    if (imageLinkMatch.index > lastIndex) {
      const beforeImageLink = text.slice(lastIndex, imageLinkMatch.index)
      parts.push(...processLinksAndImages(beforeImageLink, key++, githubUrl))
    }
    
    const alt = imageLinkMatch[1]
    const imgUrlRaw = imageLinkMatch[2].trim()
    const linkUrlRaw = imageLinkMatch[3].trim()
    
    // Extract URL from potential "url 'title'" format
    const imgUrlMatch = imgUrlRaw.match(/^(\S+)(?:\s+['"](.+)['"])?$/)
    const imgUrl = resolveImageUrl(imgUrlMatch ? imgUrlMatch[1] : imgUrlRaw, githubUrl)
    
    const linkUrlMatch = linkUrlRaw.match(/^(\S+)(?:\s+['"](.+)['"])?$/)
    const linkUrl = linkUrlMatch ? linkUrlMatch[1] : linkUrlRaw
    
    // Check if it's a YouTube link - make it bigger
    const isYouTube = linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')
    
    parts.push(
      <a 
        key={`img-link-${key++}`} 
        href={linkUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block"
      >
        <img 
          src={imgUrl} 
          alt={alt} 
          className={isYouTube ? "inline-block max-w-full max-h-64 align-middle rounded-lg" : "inline-block max-h-10 align-middle"}
        />
      </a>
    )
    lastIndex = imageLinkMatch.index + imageLinkMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processLinksAndImages(text.slice(lastIndex), key++, githubUrl))
  }
  
  return parts.length > 0 ? parts : processLinksAndImages(text, key, githubUrl)
}

const processLinksAndImages = (text: string, startKey: number, githubUrl?: string) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Process images ![alt](url "title") and links [text](url) - allow empty alt text and optional title
  const linkImageRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g
  let match
  let lastIndex = 0
  
  while ((match = linkImageRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeMatch = text.slice(lastIndex, match.index)
      parts.push(...processBoldItalic(beforeMatch, key++))
    }
    
    const isImage = match[1] === '!'
    const altOrText = match[2]
    const urlWithTitle = match[3].trim()
    
    // Extract URL and optional title: url "title" or url 'title'
    const urlMatch = urlWithTitle.match(/^(\S+)(?:\s+['"](.+)['"])?$/)
    const url = urlMatch ? urlMatch[1] : urlWithTitle
    const title = urlMatch ? urlMatch[2] : altOrText
    
    if (isImage) {
      // Render image with resolved URL
      const resolvedUrl = resolveImageUrl(url, githubUrl)
      parts.push(
        <img 
          key={`img-${key++}`} 
          src={resolvedUrl} 
          alt={altOrText || title || ''} 
          title={title}
          className="inline-block max-w-full max-h-96 align-middle rounded-lg my-2"
        />
      )
    } else {
      // Render link
      parts.push(
        <a 
          key={`link-${key++}`} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
          title={title !== altOrText ? title : undefined}
        >
          {altOrText}
        </a>
      )
    }
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processBoldItalic(text.slice(lastIndex), key++))
  }
  
  return parts.length > 0 ? parts : processBoldItalic(text, key)
}

const processBoldItalic = (text: string, startKey: number) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Bold **text**
  const boldRegex = /\*\*([^*]+)\*\*/g
  let boldMatch
  let lastIndex = 0
  
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    if (boldMatch.index > lastIndex) {
      parts.push(text.slice(lastIndex, boldMatch.index))
    }
    parts.push(<strong key={`bold-${key++}`} className="font-bold">{boldMatch[1]}</strong>)
    lastIndex = boldMatch.index + boldMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  
  return parts.length > 0 ? parts : [text]
}

export function MarkdownRenderer({ content, githubUrl }: { content: string; githubUrl?: string }) {
  let cleanContent = content
  
  // Remove HTML tags
  cleanContent = cleanContent.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, "")
  cleanContent = cleanContent.replace(/<section[^>]*>[\s\S]*?<\/section>/gi, "")
  cleanContent = cleanContent.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "")
  cleanContent = cleanContent.replace(/<[^>]+>/g, "")
  cleanContent = cleanContent.replace(/\n\n\n+/g, "\n\n")
  
  // Parse reference-style links [ref]: url
  const linkRefs: Record<string, string> = {}
  const refLinkRegex = /^\[([^\]]+)\]:\s*(.+)$/gm
  let refMatch
  while ((refMatch = refLinkRegex.exec(cleanContent)) !== null) {
    linkRefs[refMatch[1]] = refMatch[2].trim()
  }
  
  // Remove reference definitions from content
  cleanContent = cleanContent.replace(/^\[([^\]]+)\]:\s*.+$/gm, "")
  
  // Replace reference-style links with inline links
  // [![alt][img-ref]][link-ref] -> [![alt](img-url)](link-url)
  cleanContent = cleanContent.replace(/\[!\[([^\]]*)\]\[([^\]]+)\]\]\[([^\]]+)\]/g, (match, alt, imgRef, linkRef) => {
    const imgUrl = linkRefs[imgRef] || imgRef
    const linkUrl = linkRefs[linkRef] || linkRef
    return `[![${alt}](${imgUrl})](${linkUrl})`
  })
  
  // ![alt][ref] -> ![alt](url)
  cleanContent = cleanContent.replace(/!\[([^\]]*)\]\[([^\]]+)\]/g, (match, alt, ref) => {
    const url = linkRefs[ref] || ref
    return `![${alt}](${url})`
  })
  
  // [text][ref] -> [text](url)
  cleanContent = cleanContent.replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (match, text, ref) => {
    const url = linkRefs[ref] || ref
    return `[${text}](${url})`
  })
  
  const lines = cleanContent.split("\n")
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code blocks
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      
      elements.push(
        <CodeBlock 
          key={`code-${elements.length}`} 
          code={codeLines.join("\n").trim() || "// Code block"} 
          language={language || "code"} 
        />
      )
      
      i++
      continue
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold mt-8 mb-4">
          {renderInlineMarkdown(line.slice(2), githubUrl)}
        </h1>
      )
      i++
      continue
    }
    if (line.startsWith("## ")) {
      const headingText = line.slice(3).trim()
      const headingId = generateHeadingId(headingText)
      elements.push(
        <h2 key={`h2-${i}`} id={headingId} className="text-2xl font-bold mt-6 mb-3 scroll-mt-20">
          {renderInlineMarkdown(line.slice(3), githubUrl)}
        </h2>
      )
      i++
      continue
    }
    if (line.startsWith("### ")) {
      const headingText = line.slice(4).trim()
      const headingId = generateHeadingId(headingText)
      elements.push(
        <h3 key={`h3-${i}`} id={headingId} className="text-xl font-bold mt-5 mb-2 scroll-mt-20">
          {renderInlineMarkdown(line.slice(4), githubUrl)}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith("#### ")) {
      const headingText = line.slice(5).trim()
      const headingId = generateHeadingId(headingText)
      elements.push(
        <h4 key={`h4-${i}`} id={headingId} className="text-lg font-bold mt-4 mb-2 scroll-mt-20">
          {renderInlineMarkdown(line.slice(5), githubUrl)}
        </h4>
      )
      i++
      continue
    }

    // Lists
    if (line.trim().match(/^[-*+]\s/)) {
      const listItems: JSX.Element[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*+]\s/)) {
        const itemText = lines[i].trim().slice(2)
        listItems.push(
          <li key={`li-${i}`} className="ml-4">
            {renderInlineMarkdown(itemText, githubUrl)}
          </li>
        )
        i++
      }
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside my-4 space-y-2">
          {listItems}
        </ul>
      )
      continue
    }

    // Tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim())
        i++
      }
      
      if (tableLines.length >= 2) {
        // Parse header
        const headerCells = tableLines[0]
          .split("|")
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0)
        
        // Skip separator line (line with dashes)
        const bodyLines = tableLines.slice(2)
        
        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th 
                      key={`th-${idx}`} 
                      className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {renderInlineMarkdown(cell, githubUrl)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800">
                {bodyLines.map((row, rowIdx) => {
                  const cells = row
                    .split("|")
                    .map(cell => cell.trim())
                    .filter(cell => cell.length > 0)
                  
                  return (
                    <tr key={`tr-${rowIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {cells.map((cell, cellIdx) => (
                        <td 
                          key={`td-${rowIdx}-${cellIdx}`} 
                          className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-900 dark:text-slate-100"
                        >
                          {renderInlineMarkdown(cell, githubUrl)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // Blockquotes
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().slice(1).trim())
        i++
      }
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r">
          {quoteLines.map((quoteLine, idx) => (
            <p key={idx} className="mb-1 last:mb-0">
              {renderInlineMarkdown(quoteLine, githubUrl)}
            </p>
          ))}
        </blockquote>
      )
      continue
    }

    // Regular paragraphs
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="my-4 leading-relaxed">
          {renderInlineMarkdown(line, githubUrl)}
        </p>
      )
    }

    i++
  }

  return <div className="prose prose-slate dark:prose-invert max-w-none">{elements}</div>
}
