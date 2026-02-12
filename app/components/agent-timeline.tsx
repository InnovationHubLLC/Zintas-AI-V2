import React from 'react'
import type { AgentName } from '@packages/db/types'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/** A single item in the agent timeline */
interface AgentTimelineItem {
  /** Unique identifier */
  id: string
  /** Which agent performed the action */
  agent: AgentName
  /** Description of the action */
  description: string
  /** ISO timestamp */
  timestamp: string
  /** Status of the action */
  status: 'completed' | 'pending' | 'failed'
}

/** Props for the AgentTimeline component */
interface AgentTimelineProps {
  /** List of timeline items */
  items: AgentTimelineItem[]
  /** Additional CSS classes */
  className?: string
}

const AGENT_COLORS = {
  conductor: 'bg-green-500',
  scholar: 'bg-blue-500',
  ghostwriter: 'bg-purple-500',
  analyst: 'bg-orange-500',
} as const

const STATUS_ICONS = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
} as const

const STATUS_COLORS = {
  completed: 'text-green-600',
  pending: 'text-gray-400',
  failed: 'text-red-600',
} as const

/**
 * Vertical timeline of agent actions with color-coded dots and relative timestamps.
 */
export function AgentTimeline({ items, className }: AgentTimelineProps): React.JSX.Element {
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => {
        const StatusIcon = STATUS_ICONS[item.status]
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className="flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <div className={cn('w-3 h-3 rounded-full shrink-0 mt-1', AGENT_COLORS[item.agent])} />
              {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 capitalize">{item.agent}</span>
                <StatusIcon className={cn('w-3.5 h-3.5', STATUS_COLORS[item.status])} />
              </div>
              <p className="text-sm text-gray-900">{item.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export type { AgentTimelineItem }
