'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Trash2, Eye, ExternalLink } from 'lucide-react'
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

interface AdminDashboardProps {
  adminPassword: string
}

export function AdminDashboard({ adminPassword }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState<BlogSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('blog_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (fetchError) {
        setError('Failed to fetch submissions')
        return
      }

      setSubmissions(data || [])
    } catch (err) {
      setError('Error fetching submissions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    setApprovingId(submissionId)
    try {
      const response = await fetch('/api/blogs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action: 'approve',
          adminPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to approve')
        return
      }

      setSuccessMessage('✅ Blog approved and added to featured list!')
      setTimeout(() => setSuccessMessage(''), 3000)

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, status: 'approved' } : sub
        )
      )
    } catch (err) {
      setError('Error approving submission')
      console.error(err)
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (submissionId: string) => {
    setRejectingId(submissionId)
    try {
      const response = await fetch('/api/blogs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action: 'reject',
          adminPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reject')
        return
      }

      setSuccessMessage('❌ Blog rejected.')
      setTimeout(() => setSuccessMessage(''), 3000)

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, status: 'rejected' } : sub
        )
      )
    } catch (err) {
      setError('Error rejecting submission')
      console.error(err)
    } finally {
      setRejectingId(null)
    }
  }

  const handleDelete = async (submissionId: string) => {
    setDeletingId(submissionId)
    try {
      const response = await fetch('/api/blogs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action: 'delete',
          adminPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete')
        return
      }

      setSuccessMessage('🗑️ Blog deleted from featured list!')
      setTimeout(() => setSuccessMessage(''), 3000)

      // Remove from local state
      setSubmissions(prev =>
        prev.filter(sub => sub.id !== submissionId)
      )
    } catch (err) {
      setError('Error deleting blog')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'pending')
  const approvedSubmissions = submissions.filter(s => s.status === 'approved')
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected')

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium text-green-900">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium text-red-900">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-blue-900">{pendingSubmissions.length}</p>
        </div>
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-900">{approvedSubmissions.length}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600 font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-900">{rejectedSubmissions.length}</p>
        </div>
      </div>

      {/* Pending Submissions */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-foreground">
          ⏳ Pending Submissions ({pendingSubmissions.length})
        </h2>
        {pendingSubmissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No pending submissions</p>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map(submission => (
              <div
                key={submission.id}
                className="border rounded-lg p-6 bg-white hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Hero Image */}
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={submission.hero_image}
                      alt={submission.title}
                      fill
                      loading="lazy"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Content */}
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="font-bold text-lg text-foreground">{submission.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {submission.description}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={submission.author_image}
                          alt={submission.author_name}
                          fill
                          loading="lazy"
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
                    <a
                      href={submission.blog_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Blog
                      </Button>
                    </a>
                    <Button
                      onClick={() => handleApprove(submission.id)}
                      disabled={approvingId === submission.id}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      {approvingId === submission.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Confirm
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(submission.id)}
                      disabled={rejectingId === submission.id}
                      size="sm"
                      variant="destructive"
                      className="w-full gap-2"
                    >
                      {rejectingId === submission.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Submissions */}
      {approvedSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-green-900">
            ✅ Approved ({approvedSubmissions.length})
          </h2>
          <div className="space-y-3">
            {approvedSubmissions.map(submission => (
              <div
                key={submission.id}
                className="border rounded-lg p-4 bg-green-50 border-green-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-green-900">{submission.title}</p>
                    <p className="text-sm text-green-700">{submission.author_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={submission.blog_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </a>
                    <Button
                      onClick={() => handleDelete(submission.id)}
                      disabled={deletingId === submission.id}
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                    >
                      {deletingId === submission.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Submissions */}
      {rejectedSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-red-900">
            ❌ Rejected ({rejectedSubmissions.length})
          </h2>
          <div className="space-y-3">
            {rejectedSubmissions.map(submission => (
              <div
                key={submission.id}
                className="border rounded-lg p-4 bg-red-50 border-red-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-red-900">{submission.title}</p>
                    <p className="text-sm text-red-700">{submission.author_name}</p>
                  </div>
                  <a
                    href={submission.blog_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
