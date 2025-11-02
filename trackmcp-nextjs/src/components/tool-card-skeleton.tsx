export function ToolCardSkeleton() {
  return (
    <div className="group relative overflow-hidden card-gradient border-2 rounded-lg p-6 h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            {/* Avatar skeleton */}
            <div className="h-5 w-5 rounded-full bg-muted" />
            {/* Title skeleton */}
            <div className="h-6 w-32 bg-muted rounded" />
          </div>
          {/* Description skeleton */}
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
        {/* Button skeleton */}
        <div className="h-10 w-10 bg-muted rounded-md shrink-0" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-4">
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>

      {/* Topics */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <div className="h-6 w-16 bg-muted rounded-full" />
        <div className="h-6 w-20 bg-muted rounded-full" />
        <div className="h-6 w-14 bg-muted rounded-full" />
      </div>
    </div>
  )
}
