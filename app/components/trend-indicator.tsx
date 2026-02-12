import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Props for the TrendIndicator component */
interface TrendIndicatorProps {
  /** Current period value */
  current: number
  /** Previous period value */
  previous: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Shows an up/down arrow with percentage change between two values.
 * Green for improvement, red for decline, gray for no change.
 */
export function TrendIndicator({ current, previous, className }: TrendIndicatorProps): React.JSX.Element {
  if (previous === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm text-gray-500', className)}>
        <Minus className="w-4 h-4" />
        <span>0%</span>
      </span>
    )
  }

  const change = ((current - previous) / previous) * 100
  const rounded = Math.abs(change).toFixed(1)

  if (change === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm text-gray-500', className)}>
        <Minus className="w-4 h-4" />
        <span>0%</span>
      </span>
    )
  }

  if (change > 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm text-green-600', className)}>
        <TrendingUp className="w-4 h-4" />
        <span>+{rounded}%</span>
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm text-red-600', className)}>
      <TrendingDown className="w-4 h-4" />
      <span>-{rounded}%</span>
    </span>
  )
}
