'use client'

import React from 'react'
import type { ComplianceStatus } from '@packages/db/types'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { CheckCircle, AlertTriangle, ShieldX } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Props for the ComplianceBadge component */
interface ComplianceBadgeProps {
  /** Compliance check status */
  status: ComplianceStatus
  /** Optional detail items shown in popover on click */
  details?: string[]
  /** Additional CSS classes */
  className?: string
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle, label: 'Pass', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  warn: { icon: AlertTriangle, label: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  block: { icon: ShieldX, label: 'Blocked', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
} as const

/**
 * Shows compliance status (pass/warn/block) with an optional popover for details.
 */
export function ComplianceBadge({ status, details, className }: ComplianceBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  const badge = (
    <Badge
      variant="outline"
      className={cn('gap-1.5 cursor-default', config.bg, config.color, className)}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  )

  if (!details || details.length === 0) {
    return badge
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer">
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">Compliance Details</p>
        <ul className="space-y-1">
          {details.map((detail, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', config.color === 'text-green-600' ? 'bg-green-500' : config.color === 'text-amber-600' ? 'bg-amber-500' : 'bg-red-500')} />
              {detail}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
