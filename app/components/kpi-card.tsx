'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendIndicator } from './trend-indicator'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { cn } from '@/lib/utils'

/** Props for the KpiCard component */
interface KpiCardProps {
  /** Card title/label */
  title: string
  /** Main metric value */
  value: string | number
  /** Subtitle or context text */
  subtitle?: string
  /** Optional lucide icon */
  icon?: LucideIcon
  /** Optional trend data: current and previous values */
  trend?: { current: number; previous: number }
  /** Optional sparkline data points */
  sparklineData?: Array<{ value: number }>
  /** Additional CSS classes */
  className?: string
}

/**
 * Reusable KPI metric card with optional trend indicator and sparkline.
 */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  sparklineData,
  className,
}: KpiCardProps): React.JSX.Element {
  return (
    <Card className={cn('p-6', className)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          {trend && <TrendIndicator current={trend.current} previous={trend.previous} />}
        </div>

        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>

        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
