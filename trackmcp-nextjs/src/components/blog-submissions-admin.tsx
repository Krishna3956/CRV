'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Clock, Trash2, Copy, Check } from 'lucide-react'
import Image from 'next/image'

interface BlogSubmission {
  id: string
  title: string
  description: string
  hero_image: string
  author_name: string
  author_image: string
  blog_url: string
  submitted_at: string
  status: 'pending' | 'approved' | 'rejected'
}

export function BlogSubmissionsAdmin() {
  const [submissions, setSubmissions] = useState<BlogSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN
      const response = await fetch('/api/blogs/submit', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    const code = `{
  url: '${text}',
  isFeatured: true,
},`
    navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-900">{error}</p>
        </div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending submissions
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Hero Image */}
            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
              <Image
                src={submission.hero_image}
                alt={submission.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Content */}
            <div className="md:col-span-2 space-y-2">
              <h3 className="font-semibold text-foreground">{submission.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {submission.description}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={submission.author_image}
                    alt={submission.author_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{submission.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => copyToClipboard(submission.blog_url, submission.id)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {copied === submission.id ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Code
                  </>
                )}
              </Button>
              <a
                href={submission.blog_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline text-center"
              >
                View Blog →
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
