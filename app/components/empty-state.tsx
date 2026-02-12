import React from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Props for the EmptyState component */
interface EmptyStateProps {
  /** Optional Lucide icon to display */
  icon?: LucideIcon
  /** Main title text */
  title: string
  /** Description text */
  description: string
  /** Optional action element (button, link, etc.) */
  action?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Reusable empty state component with icon, title, description, and optional action.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps): React.JSX.Element {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
