'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

type ApprovalType = 'content' | 'fix' | 'seo'

/** Props for the ApprovalCard component */
interface ApprovalCardProps {
  /** Type of approval */
  type: ApprovalType
  /** Action title */
  title: string
  /** Plain-English benefit description */
  benefit: string
  /** Lucide icon for the card */
  icon: LucideIcon
  /** ISO timestamp of when the action was created */
  timestamp: string
  /** Callback when approved */
  onApprove: () => void
  /** Callback when rejected */
  onReject: () => void
  /** Callback to preview the action */
  onPreview?: () => void
  /** Additional CSS classes */
  className?: string
}

const TYPE_CONFIG = {
  content: { border: 'border-l-purple-500', label: 'Content', badge: 'bg-purple-100 text-purple-700' },
  fix: { border: 'border-l-orange-500', label: 'Fix', badge: 'bg-orange-100 text-orange-700' },
  seo: { border: 'border-l-blue-500', label: 'SEO', badge: 'bg-blue-100 text-blue-700' },
} as const

/**
 * Plain-English approval card for the practice portal.
 * Color-coded left border by type with friendly language.
 */
export function ApprovalCard({
  type,
  title,
  benefit,
  icon: Icon,
  timestamp,
  onApprove,
  onReject,
  onPreview,
  className,
}: ApprovalCardProps): React.JSX.Element {
  const config = TYPE_CONFIG[type]

  return (
    <Card className={cn('border-l-4', config.border, className)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn('text-xs', config.badge)}>
                {config.label}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{benefit}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-13">
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onReject}>
            Reject
          </Button>
          {onPreview && (
            <Button size="sm" variant="ghost" onClick={onPreview}>
              Preview
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
