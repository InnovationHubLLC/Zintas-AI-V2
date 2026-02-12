import React from 'react'
import type { Severity } from '@packages/db/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Props for the SeverityBadge component */
interface SeverityBadgeProps {
  /** Severity level */
  severity: Severity
  /** Additional CSS classes */
  className?: string
}

const SEVERITY_CONFIG = {
  critical: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  info: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
} as const

/**
 * Badge with a colored dot indicating critical, warning, or info severity.
 */
export function SeverityBadge({ severity, className }: SeverityBadgeProps): React.JSX.Element {
  const config = SEVERITY_CONFIG[severity]

  return (
    <Badge variant="outline" className={cn('gap-1.5', config.bg, config.text, className)}>
      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  )
}
