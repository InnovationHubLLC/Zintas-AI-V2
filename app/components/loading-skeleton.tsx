import React from 'react'

// ── Shared Skeleton Primitives ───────────────────────────────────

function SkeletonBox({ className }: { className?: string }): React.ReactElement {
  return <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />
}

// ── DashboardSkeleton ────────────────────────────────────────────
// 4 KPI card skeletons + timeline skeleton

export function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <SkeletonBox className="w-10 h-10 mb-3" />
            <SkeletonBox className="w-16 h-8 mb-2" />
            <SkeletonBox className="w-24 h-4" />
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <SkeletonBox className="w-32 h-6 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <SkeletonBox className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="w-3/4 h-4" />
                <SkeletonBox className="w-1/2 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TableSkeleton ────────────────────────────────────────────────
// Filter bar skeleton + table row skeletons

export function TableSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <div className="flex flex-col md:flex-row gap-4">
          <SkeletonBox className="flex-1 h-12" />
          <div className="flex gap-2">
            <SkeletonBox className="w-24 h-10" />
            <SkeletonBox className="w-24 h-10" />
            <SkeletonBox className="w-24 h-10" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
        {/* Header row */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} className="flex-1 h-4 mx-2" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex px-6 py-4 border-b border-gray-100">
            {Array.from({ length: 6 }).map((_, j) => (
              <SkeletonBox key={j} className="flex-1 h-4 mx-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── EditorSkeleton ───────────────────────────────────────────────
// 3-panel skeleton for content editor

export function EditorSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* Left panel - outline */}
      <div className="col-span-3 bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <SkeletonBox className="w-24 h-6 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} className="w-full h-8" />
          ))}
        </div>
      </div>

      {/* Center panel - editor */}
      <div className="col-span-6 bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <SkeletonBox className="w-3/4 h-8 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonBox key={i} className={`h-4 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`} />
          ))}
        </div>
      </div>

      {/* Right panel - meta/settings */}
      <div className="col-span-3 bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <SkeletonBox className="w-20 h-6 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <SkeletonBox className="w-16 h-3 mb-2" />
              <SkeletonBox className="w-full h-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
