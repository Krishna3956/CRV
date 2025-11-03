export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-accent/5 to-background pt-8 pb-12">
        <div className="container relative mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge skeleton */}
            <div className="inline-flex h-10 w-32 rounded-full bg-muted/50 animate-pulse mx-auto" />
            
            {/* Title skeleton */}
            <div className="space-y-4">
              <div className="h-16 bg-muted/50 rounded-lg animate-pulse max-w-3xl mx-auto" />
              <div className="h-16 bg-muted/50 rounded-lg animate-pulse max-w-2xl mx-auto" />
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-6 bg-muted/50 rounded animate-pulse max-w-2xl mx-auto" />
              <div className="h-6 bg-muted/50 rounded animate-pulse max-w-xl mx-auto" />
            </div>
            
            {/* Search bar skeleton */}
            <div className="h-14 bg-muted/50 rounded-lg animate-pulse max-w-2xl mx-auto mt-8" />
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-64 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  )
}
