'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Copy, Check } from 'lucide-react'

export function BlogAdminForm() {
  const [blogUrl, setBlogUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [copied, setCopied] = useState(false)

  const generatedCode = `{
  url: '${blogUrl}',
  isFeatured: ${isFeatured},
},`

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setBlogUrl('')
    setIsFeatured(false)
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Add Featured Blog</h3>
      
      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Blog URL</label>
          <input
            type="url"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
            placeholder="https://example.com/blog/post"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Featured Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="featured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
            Mark as "Community Pick"
          </label>
        </div>

        {/* Generated Code */}
        {blogUrl && (
          <div>
            <label className="block text-sm font-medium mb-2">Add to featured-blogs.ts</label>
            <div className="relative">
              <pre className="p-3 rounded-lg bg-muted text-xs overflow-x-auto">
                <code>{generatedCode}</code>
              </pre>
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Copy this code and paste it into <code className="bg-muted px-1 py-0.5 rounded">src/data/featured-blogs.ts</code>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            disabled={!blogUrl}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Code
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground">
          <strong>How to add blogs:</strong> Enter a blog URL above, copy the generated code, and paste it into the <code className="bg-primary/10 px-1 py-0.5 rounded">FEATURED_BLOGS</code> array in <code className="bg-primary/10 px-1 py-0.5 rounded">src/data/featured-blogs.ts</code>. Metadata will auto-fetch on page load.
        </p>
      </div>
    </div>
  )
}
