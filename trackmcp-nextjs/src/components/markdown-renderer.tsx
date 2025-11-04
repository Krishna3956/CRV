'use client'

import { Copy, Check } from "lucide-react"
import { useState } from "react"

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
  
  // Process images first ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let imageMatch
  let lastIndex = 0
  
  while ((imageMatch = imageRegex.exec(text)) !== null) {
    if (imageMatch.index > lastIndex) {
      const beforeImage = text.slice(lastIndex, imageMatch.index)
      parts.push(...processCodeAndFormatting(beforeImage, key++, githubUrl))
    }
    
    const alt = imageMatch[1] || "Image"
    let url = imageMatch[2]
    
    // Handle relative GitHub URLs
    if (url.startsWith("/") && githubUrl) {
      const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "")
      url = `https://raw.githubusercontent.com/${repoPath}/main${url}`
    } else if (!url.startsWith("http") && githubUrl) {
      const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "")
      url = `https://raw.githubusercontent.com/${repoPath}/main/${url}`
    }
    
    parts.push(
      <img 
        key={`inline-img-${key++}`}
        src={url} 
        alt={alt}
        className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700 inline-block"
        loading="lazy"
        onError={(e) => {
          const img = e.target as HTMLImageElement
          if (img.src.includes('/main/')) {
            img.src = img.src.replace('/main/', '/master/')
          }
        }}
      />
    )
    lastIndex = imageMatch.index + imageMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processCodeAndFormatting(text.slice(lastIndex), key++, githubUrl))
  }
  
  return parts.length > 0 ? parts : text
}

const processCodeAndFormatting = (text: string, startKey: number, githubUrl?: string) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Process inline code (backticks)
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
  
  return parts
}

const processTextFormatting = (text: string, startKey: number, githubUrl?: string) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Process wiki-style links [[path]] first
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g
  let wikiMatch
  let lastIndex = 0
  
  while ((wikiMatch = wikiLinkRegex.exec(text)) !== null) {
    if (wikiMatch.index > lastIndex) {
      const beforeLink = text.slice(lastIndex, wikiMatch.index)
      parts.push(...processMarkdownLinks(beforeLink, key++, githubUrl))
    }
    
    let url = wikiMatch[1]
    const displayText = url.split('/').pop() || url
    
    // Handle relative GitHub URLs for wiki links
    if (githubUrl) {
      const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "")
      url = `https://github.com/${repoPath}/blob/main/${url}`
    }
    
    parts.push(
      <a 
        key={`wiki-link-${key++}`} 
        href={url} 
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        title={url}
      >
        {displayText}
      </a>
    )
    lastIndex = wikiMatch.index + wikiMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processMarkdownLinks(text.slice(lastIndex), key++, githubUrl))
  }
  
  return parts
}

const processMarkdownLinks = (text: string, startKey: number, githubUrl?: string) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Process markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let linkMatch
  let lastIndex = 0
  
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    if (linkMatch.index > lastIndex) {
      const beforeLink = text.slice(lastIndex, linkMatch.index)
      parts.push(...processBoldItalic(beforeLink, key++))
    }
    
    let url = linkMatch[2]
    
    // Handle relative GitHub URLs
    if (url.startsWith("/") && githubUrl) {
      const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "")
      url = `https://github.com/${repoPath}/blob/main${url}`
    } else if (url.startsWith("#")) {
      // Handle anchor links
      url = `#${url.slice(1)}`
    }
    
    parts.push(
      <a 
        key={`link-${key++}`} 
        href={url} 
        target={url.startsWith("#") ? undefined : "_blank"}
        rel={url.startsWith("#") ? undefined : "noopener noreferrer"}
        className="text-primary hover:underline"
      >
        {linkMatch[1]}
      </a>
    )
    lastIndex = linkMatch.index + linkMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processBoldItalic(text.slice(lastIndex), key++))
  }
  
  return parts
}

const processBoldItalic = (text: string, startKey: number) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Process bold, italic, and strikethrough
  // Order matters: process strikethrough first, then bold, then italic
  
  // Strikethrough ~~text~~
  const strikeRegex = /~~([^~]+)~~/g
  let strikeMatch
  let lastIndex = 0
  
  while ((strikeMatch = strikeRegex.exec(text)) !== null) {
    if (strikeMatch.index > lastIndex) {
      parts.push(...processBoldAndItalic(text.slice(lastIndex, strikeMatch.index), key++))
    }
    parts.push(<del key={`strike-${key++}`} className="line-through text-muted-foreground">{strikeMatch[1]}</del>)
    lastIndex = strikeMatch.index + strikeMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processBoldAndItalic(text.slice(lastIndex), key++))
  }
  
  return parts.length > 0 ? parts : [text]
}

const processBoldAndItalic = (text: string, startKey: number) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Bold **text** - match anything between ** that's not just whitespace
  const boldRegex = /\*\*(.+?)\*\*/g
  let boldMatch
  let lastIndex = 0
  
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    if (boldMatch.index > lastIndex) {
      parts.push(...processItalic(text.slice(lastIndex, boldMatch.index), key++))
    }
    parts.push(<strong key={`bold-${key++}`} className="font-bold">{boldMatch[1]}</strong>)
    lastIndex = boldMatch.index + boldMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processItalic(text.slice(lastIndex), key++))
  }
  
  return parts
}

const processItalic = (text: string, startKey: number) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Italic *text* or _text_
  const italicRegex = /[*_]([^*_]+)[*_]/g
  let italicMatch
  let lastIndex = 0
  
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    if (italicMatch.index > lastIndex) {
      parts.push(text.slice(lastIndex, italicMatch.index))
    }
    parts.push(<em key={`italic-${key++}`} className="italic">{italicMatch[1]}</em>)
    lastIndex = italicMatch.index + italicMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  
  return parts.length > 0 ? parts : [text]
}

export function MarkdownRenderer({ content, githubUrl }: { content: string; githubUrl?: string }) {
  let cleanContent = content
  
  // Extract and process details/summary tags
  const detailsRegex = /<details[^>]*>([\s\S]*?)<\/details>/gi
  let detailsMatch
  const detailsContent: { [key: string]: string } = {}
  let detailsIndex = 0
  
  while ((detailsMatch = detailsRegex.exec(content)) !== null) {
    const key = `__DETAILS_${detailsIndex}__`
    detailsContent[key] = detailsMatch[1]
    cleanContent = cleanContent.replace(detailsMatch[0], key)
    detailsIndex++
  }
  
  // Remove HTML comments <!-- ... -->
  cleanContent = cleanContent.replace(/<!--[\s\S]*?-->/g, "")
  
  // Remove picture, source, and other media tags
  cleanContent = cleanContent.replace(/<picture[^>]*>[\s\S]*?<\/picture>/gi, "")
  cleanContent = cleanContent.replace(/<source[^>]*>/gi, "")
  cleanContent = cleanContent.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, "")
  cleanContent = cleanContent.replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, "")
  
  // Remove HTML img tags (they'll be handled as markdown images)
  cleanContent = cleanContent.replace(/<img[^>]*>/gi, "")
  
  // Remove reference-style link definitions [ref]: url (including mailto:, ftp:, etc.)
  cleanContent = cleanContent.replace(/^\s*\[[\w\-]+\]:\s*(?:https?|ftp|mailto):[^\s]+.*$/gim, "")
  // Also remove any remaining [ref]: patterns
  cleanContent = cleanContent.replace(/^\s*\[[\w\-]+\]:\s*.+$/gim, "")
  cleanContent = cleanContent.replace(/!\?\[.*?\]\[.*?\]/g, "")
  cleanContent = cleanContent.replace(/\[!\[.*?\]\[.*?\]\]\[.*?\]/g, "")
  
  // Convert HTML formatting tags to markdown
  cleanContent = cleanContent.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
  cleanContent = cleanContent.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
  cleanContent = cleanContent.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
  cleanContent = cleanContent.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
  cleanContent = cleanContent.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "_$1_")
  cleanContent = cleanContent.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
  
  // Remove problematic HTML tags but preserve content
  cleanContent = cleanContent.replace(/<p[^>]*>/gi, "")
  cleanContent = cleanContent.replace(/<\/p>/gi, "\n")
  cleanContent = cleanContent.replace(/<h[1-6][^>]*>/gi, "")
  cleanContent = cleanContent.replace(/<\/h[1-6]>/gi, "\n")
  cleanContent = cleanContent.replace(/<div[^>]*>/gi, "")
  cleanContent = cleanContent.replace(/<\/div>/gi, "\n")
  cleanContent = cleanContent.replace(/<section[^>]*>/gi, "")
  cleanContent = cleanContent.replace(/<\/section>/gi, "\n")
  cleanContent = cleanContent.replace(/<a[^>]*>/gi, "")
  cleanContent = cleanContent.replace(/<\/a>/gi, "")
  cleanContent = cleanContent.replace(/<br\s*\/?>/gi, "\n")
  cleanContent = cleanContent.replace(/<span[^>]*>/gi, "")
  cleanContent = cleanContent.replace(/<\/span>/gi, "")
  
  // Remove script and style tags completely
  cleanContent = cleanContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  cleanContent = cleanContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  
  // Remove other HTML attributes like align, class, etc.
  cleanContent = cleanContent.replace(/\s+(align|class|id|style|data-[^=]*|width|height)="[^"]*"/gi, "")
  
  // Remove excessive whitespace and empty lines
  cleanContent = cleanContent.replace(/\n\s*\n\s*\n+/g, "\n\n")
  cleanContent = cleanContent.replace(/^\s+/gm, "") // Remove leading whitespace on each line
  
  const lines = cleanContent.split("\n")
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    
    // Check for details/summary placeholders
    if (line.includes("__DETAILS_")) {
      const detailsKey = line.match(/__DETAILS_\d+__/)?.[0]
      if (detailsKey && detailsContent[detailsKey]) {
        const detailsHtml = detailsContent[detailsKey]
        const summaryMatch = detailsHtml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)
        const summaryText = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, "") : "Details"
        
        // Extract content after summary
        const contentAfterSummary = detailsHtml.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim()
        const contentLines = contentAfterSummary.split("\n").filter(l => l.trim())
        
        elements.push(
          <details key={`details-${i}`} className="my-4 border border-slate-300 dark:border-slate-600 rounded-lg p-4 cursor-pointer">
            <summary className="font-semibold cursor-pointer hover:text-primary">
              {renderInlineMarkdown(summaryText, githubUrl)}
            </summary>
            <div className="mt-3 space-y-2">
              {contentLines.map((contentLine, idx) => (
                <p key={idx} className="text-sm">
                  {renderInlineMarkdown(contentLine, githubUrl)}
                </p>
              ))}
            </div>
          </details>
        )
        i++
        continue
      }
    }

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
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold mt-6 mb-3">
          {renderInlineMarkdown(line.slice(3), githubUrl)}
        </h2>
      )
      i++
      continue
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-bold mt-5 mb-2">
          {renderInlineMarkdown(line.slice(4), githubUrl)}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-lg font-bold mt-4 mb-2">
          {renderInlineMarkdown(line.slice(5), githubUrl)}
        </h4>
      )
      i++
      continue
    }

    // Lists (including checkboxes)
    if (line.trim().match(/^[-*+]\s/) || line.trim().match(/^[-*+]\s\[[\sx]\]/i)) {
      const listItems: JSX.Element[] = []
      while (i < lines.length && (lines[i].trim().match(/^[-*+]\s/) || lines[i].trim().match(/^[-*+]\s\[[\sx]\]/i))) {
        const trimmedLine = lines[i].trim()
        
        // Check if it's a checkbox item
        const checkboxMatch = trimmedLine.match(/^[-*+]\s\[([ xX])\]\s*(.*)$/)
        
        if (checkboxMatch) {
          const isChecked = checkboxMatch[1].toLowerCase() === 'x'
          const itemText = checkboxMatch[2]
          
          listItems.push(
            <li key={`li-${i}`} className="ml-4 flex items-start gap-2">
              <input 
                type="checkbox" 
                checked={isChecked}
                disabled
                className="mt-1 cursor-default"
              />
              <span className={isChecked ? "line-through text-muted-foreground" : ""}>
                {renderInlineMarkdown(itemText, githubUrl)}
              </span>
            </li>
          )
        } else {
          const itemText = trimmedLine.slice(2)
          listItems.push(
            <li key={`li-${i}`} className="ml-4">
              {renderInlineMarkdown(itemText, githubUrl)}
            </li>
          )
        }
        i++
      }
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-none my-4 space-y-2">
          {listItems}
        </ul>
      )
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

    // Tables (markdown format: | header | header |)
    if (line.trim().startsWith("|") && !line.includes("__DETAILS_")) {
      const tableRows: string[][] = []
      let headerRowIndex = -1
      let startIndex = i
      
      while (i < lines.length && lines[i].trim().startsWith("|") && !lines[i].includes("__DETAILS_")) {
        const currentLine = lines[i].trim()
        
        // Check if this is a separator row (|---|---|)
        if (currentLine.match(/^\|[\s\-:|]+\|$/)) {
          headerRowIndex = tableRows.length - 1
          i++
          continue
        }
        
        // Skip empty rows
        if (currentLine === "|" || currentLine === "") {
          i++
          continue
        }
        
        const row = currentLine
          .split("|")
          .slice(1, -1) // Remove first and last empty elements
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0) // Filter out empty cells
        
        if (row.length > 0) {
          tableRows.push(row)
        }
        i++
      }
      
      if (tableRows.length > 1) { // Need at least header + 1 row
        // If no separator row found, assume first row is header
        if (headerRowIndex === -1) {
          headerRowIndex = 0
        }
        
        const headerRow = tableRows[headerRowIndex]
        const bodyRows = tableRows.filter((_, idx) => idx !== headerRowIndex)
        
        // Ensure all rows have same number of columns as header
        const numCols = headerRow.length
        const normalizedBodyRows = bodyRows.map(row => {
          while (row.length < numCols) row.push("")
          return row.slice(0, numCols)
        })
        
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  {headerRow.map((header, idx) => (
                    <th key={idx} className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left font-semibold">
                      {renderInlineMarkdown(header, githubUrl)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedBodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        {renderInlineMarkdown(cell, githubUrl)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        continue
      } else {
        // Not a valid table, reset i and continue
        i = startIndex + 1
        continue
      }
    }

    // Images ![alt](url)
    if (line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)/)) {
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
      let imageMatch
      
      while ((imageMatch = imageRegex.exec(line)) !== null) {
        const alt = imageMatch[1] || "Image"
        let url = imageMatch[2]
        
        // Handle relative GitHub URLs
        if (url.startsWith("/") && githubUrl) {
          const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "")
          // Try main branch first, but also support master
          url = `https://raw.githubusercontent.com/${repoPath}/main${url}`
        } else if (!url.startsWith("http") && githubUrl) {
          // Handle relative paths like "docs/image.png"
          const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "")
          url = `https://raw.githubusercontent.com/${repoPath}/main/${url}`
        }
        
        elements.push(
          <div key={`img-${elements.length}`} className="my-4">
            <img 
              src={url} 
              alt={alt}
              className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
              loading="lazy"
              onError={(e) => {
                // Fallback to master branch if main fails
                const img = e.target as HTMLImageElement
                if (img.src.includes('/main/')) {
                  img.src = img.src.replace('/main/', '/master/')
                }
              }}
            />
          </div>
        )
      }
      i++
      continue
    }

    // Regular paragraphs
    if (line.trim()) {
      // Check if line contains images
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/
      if (imageRegex.test(line)) {
        // Skip, already handled above
        i++
        continue
      }
      
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
