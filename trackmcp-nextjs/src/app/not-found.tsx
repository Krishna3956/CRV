import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <h1 className="text-6xl font-bold gradient-text">404</h1>
          
          <h2 className="text-3xl font-semibold">Page Not Found</h2>
          
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="pt-6">
            <Link href="/">
              <Button size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
