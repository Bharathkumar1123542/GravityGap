// components/ExplorerSkeleton.tsx — Loading state for Explorer
// spec §6.4 — FR-UI-02
export function ExplorerSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Weights panel skeleton */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-surface-raised rounded-md p-4 border border-border-strong">
            <h2 className="text-lg font-semibold mb-4 text-text">
              Environment Weights
            </h2>
            <div className="space-y-4">
              <div className="h-12 bg-surface animate-pulse rounded" />
              <div className="h-12 bg-surface animate-pulse rounded" />
            </div>
          </div>
        </aside>

        {/* Main content skeleton */}
        <div className="flex-1">
          <div className="mb-4 space-y-4">
            <div className="h-10 bg-surface-raised animate-pulse rounded" />
            <div className="h-10 bg-surface-raised animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-surface-raised animate-pulse rounded border border-border"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
