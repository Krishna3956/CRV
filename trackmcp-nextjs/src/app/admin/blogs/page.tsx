'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { AdminDashboard } from '@/components/admin-dashboard'

export default function AdminBlogsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check password
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      setError('Invalid password')
      setPassword('')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border shadow-lg p-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-6">Enter your password to access</p>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="font-medium text-red-900">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                Login
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> This is a private admin area. Only authorized users should have access to this password.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Blog Submissions Admin</h1>
              <p className="text-muted-foreground">Review and approve blog submissions</p>
            </div>
            <Button
              onClick={() => {
                setIsAuthenticated(false)
                setPassword('')
              }}
              variant="outline"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <AdminDashboard adminPassword={password} />
      </div>
    </div>
  )
}
