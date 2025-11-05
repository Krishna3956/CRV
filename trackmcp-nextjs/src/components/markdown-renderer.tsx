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

const renderInlineMarkdown = (text: string) => {
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
      parts.push(...processTextFormatting(beforeCode, key++))
    }
    parts.push(
      <code key={`code-${key++}`} className="bg-slate-900 text-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
        {codeMatch[1]}
      </code>
    )
    lastIndex = codeMatch.index + codeMatch[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push(...processTextFormatting(text.slice(lastIndex), key++))
  }
  
  return parts.length > 0 ? parts : text
}

const processTextFormatting = (text: string, startKey: number) => {
  const parts: (string | JSX.Element)[] = []
  let key = startKey
  
  // Process links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let linkMatch
  let lastIndex = 0
  
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    if (linkMatch.index > lastIndex) {
      const beforeLink = text.slice(lastIndex, linkMatch.index)
      parts.push(...processBoldItalic(beforeLink, key++))
    }
    parts.push(
      <a 
        key={`link-${key++}`} 
        href={linkMatch[2]} 
        target="_blank" 
        rel="noopener noreferrer"
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
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      )
      i++
      continue
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold mt-6 mb-3">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      )
      i++
      continue
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-bold mt-5 mb-2">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-lg font-bold mt-4 mb-2">
          {renderInlineMarkdown(line.slice(5))}
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
            {renderInlineMarkdown(itemText)}
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
              {renderInlineMarkdown(quoteLine)}
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
          {renderInlineMarkdown(line)}
        </p>
      )
    }

    i++
  }

  return <div className="prose prose-slate dark:prose-invert max-w-none">{elements}</div>
}
