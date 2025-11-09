import { Metadata } from 'next'
import { BlogSubmissionForm } from '@/components/blog-submission-form'
import { FileText, CheckCircle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Submit Your Blog | Track MCP',
  description: 'Share your MCP-related blog post with our community. Submit your blog for a chance to be featured on Track MCP.',
  openGraph: {
    title: 'Submit Your Blog | Track MCP',
    description: 'Share your MCP-related blog post with our community.',
    type: 'website',
  },
}

export default function BlogRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold gradient-text">Submit Your Blog</h1>
          </div>
          <p className="text-muted-foreground">
            Share your MCP-related blog post with our community and get featured on Track MCP
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border shadow-sm p-8">
              <BlogSubmissionForm />
            </div>
          </div>

          {/* Sidebar - Info */}
          <div className="space-y-6">
            {/* What We Look For */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                What We Look For
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>High-quality, original content about MCP</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Well-written and engaging posts</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Relevant to developers and AI builders</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Professional author information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Clear, high-quality hero image</span>
                </li>
              </ul>
            </div>

            {/* Timeline */}
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl border border-accent/20 p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Review Timeline
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">Submission</p>
                  <p className="text-muted-foreground">Instant</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Review</p>
                  <p className="text-muted-foreground">24-48 hours</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Featured</p>
                  <p className="text-muted-foreground">If approved</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-3">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Use a high-quality, relevant hero image</li>
                <li>• Keep descriptions concise and engaging</li>
                <li>• Ensure all URLs are publicly accessible</li>
                <li>• Use a professional author photo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
