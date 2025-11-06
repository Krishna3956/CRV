export function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <section className="relative min-h-[45vh] flex items-center justify-center overflow-x-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="h-16 bg-muted/30 rounded-lg w-3/4 mx-auto mb-6 animate-pulse" />
          <div className="h-6 bg-muted/20 rounded-lg w-1/2 mx-auto mb-8 animate-pulse" />
          <div className="h-12 bg-muted/30 rounded-lg w-48 mx-auto animate-pulse" />
        </div>
      </section>

      {/* Content Skeleton */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-card rounded-lg p-4 border border-border/30 space-y-3">
                <div className="h-6 bg-muted/50 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-full" />
                  <div className="h-4 bg-muted/50 rounded w-5/6" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-6 bg-muted/50 rounded-full w-16" />
                  <div className="h-6 bg-muted/50 rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
