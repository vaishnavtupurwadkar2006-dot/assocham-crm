// src/components/ui/LoadingState.tsx
// Reusable skeleton screens for each page type

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-white/[0.05] animate-pulse ${className}`} />
  );
}

/** Four stat card skeletons */
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#0E1628] border border-white/[0.07] rounded-xl p-5 space-y-4"
        >
          <SkeletonBox className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <SkeletonBox className="h-7 w-16" />
            <SkeletonBox className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Charts area skeleton */
export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-[#0E1628] border border-white/[0.07] rounded-xl p-5 space-y-4">
        <SkeletonBox className="h-4 w-40" />
        <SkeletonBox className="h-56 w-full" />
      </div>
      <div className="bg-[#0E1628] border border-white/[0.07] rounded-xl p-5 space-y-4">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-48 w-full" />
      </div>
      <div className="lg:col-span-3 bg-[#0E1628] border border-white/[0.07] rounded-xl p-5 space-y-3">
        <SkeletonBox className="h-4 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Contacts table skeleton — uses inline div widths via className only */
const COL_WIDTHS = ["w-44", "w-28", "w-36", "w-24", "w-20", "w-36", "w-16"];

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-[#0E1628] border border-white/[0.07] rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="border-b border-white/[0.06] px-4 py-3 flex gap-4">
        {COL_WIDTHS.map((w, i) => (
          <SkeletonBox key={i} className={`h-3 ${w} flex-shrink-0`} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="border-b border-white/[0.04] last:border-0 px-4 py-3.5 flex items-center gap-4"
        >
          {/* Avatar + name column */}
          <div className="flex items-center gap-3 w-44 flex-shrink-0">
            <SkeletonBox className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-2.5 w-10" />
            </div>
          </div>
          <SkeletonBox className="h-3 w-28 flex-shrink-0" />
          <SkeletonBox className="h-3 w-36 flex-shrink-0" />
          <SkeletonBox className="h-5 w-20 rounded-md flex-shrink-0" />
          <SkeletonBox className="h-3 w-20 flex-shrink-0" />
          <div className="space-y-1.5 w-36 flex-shrink-0">
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-3 w-full" />
          </div>
          <SkeletonBox className="h-5 w-16 rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Contact detail page skeleton */
export function ContactDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Hero */}
      <div className="bg-[#0E1628] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <SkeletonBox className="w-16 h-16 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <SkeletonBox className="h-6 w-56" />
            <SkeletonBox className="h-4 w-40" />
            <SkeletonBox className="h-4 w-32" />
            <div className="flex gap-2 pt-1">
              <SkeletonBox className="h-8 w-36 rounded-lg" />
              <SkeletonBox className="h-8 w-44 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {["h-32", "h-48", "h-40", "h-28"].map((h, i) => (
            <div key={i} className="bg-[#0E1628] border border-white/[0.07] rounded-xl p-5 space-y-3">
              <SkeletonBox className="h-4 w-32" />
              <SkeletonBox className={`${h} w-full`} />
            </div>
          ))}
        </div>
        <div className="space-y-5">
          {["h-28", "h-44", "h-36"].map((h, i) => (
            <div key={i} className="bg-[#0E1628] border border-white/[0.07] rounded-xl p-5 space-y-3">
              <SkeletonBox className="h-4 w-24" />
              <SkeletonBox className={`${h} w-full`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
