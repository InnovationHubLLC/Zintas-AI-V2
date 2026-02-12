import React from 'react'
import { cn } from '@/lib/utils'

/** Props for the HealthScoreGauge component */
interface HealthScoreGaugeProps {
  /** Score value from 0-100 */
  score: number
  /** Gauge size: sm (40px), md (56px), lg (80px) */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

const SIZE_CONFIG = {
  sm: { dimension: 40, radius: 16, strokeWidth: 3, fontSize: 'text-xs' },
  md: { dimension: 56, radius: 24, strokeWidth: 4, fontSize: 'text-sm' },
  lg: { dimension: 80, radius: 32, strokeWidth: 6, fontSize: 'text-lg' },
} as const

/**
 * Circular SVG gauge showing a 0-100 health score.
 * Color-coded: red (<60), yellow (60-80), green (>80).
 */
export function HealthScoreGauge({ score, size = 'md', className }: HealthScoreGaugeProps): React.JSX.Element {
  const config = SIZE_CONFIG[size]
  const circumference = 2 * Math.PI * config.radius
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100)
  const center = config.dimension / 2

  const strokeColor =
    score < 60
      ? 'text-red-500'
      : score <= 80
        ? 'text-amber-500'
        : 'text-green-500'

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.dimension}
        height={config.dimension}
        className="transform -rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={strokeColor}
        />
      </svg>
      <span className={cn('absolute font-bold text-gray-900', config.fontSize)}>
        {score}
      </span>
    </div>
  )
}
