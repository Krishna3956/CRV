'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          
          <h1 className="text-4xl font-bold">Something went wrong!</h1>
          
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            An unexpected error occurred. Please try again.
          </p>
          
          <div className="pt-6">
            <Button onClick={reset} size="lg">
              Try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
