'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, FileText, Target, ArrowUp, ArrowDown, Clock, Search, Activity } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { ApiError } from '@/app/components/api-error'

// ── Types ────────────────────────────────────────────────────────

interface DashboardKPIs {
  healthScore: number
  keywordCount: number
  keywordsRanked: number
  rankingsImproving: number
  page1: number
  contentPublished: number
  contentThisMonth: number
  pendingActions: number
}

interface Win {
  message: string
  impact: 'high' | 'medium' | 'low'
  timestamp: string
  actionType: string
}

interface TrafficDataPoint {
  date: string
  visitors: number
}

interface DashboardData {
  client: {
    name: string
    domain: string
  }
  kpis: DashboardKPIs
  wins: Win[]
  trafficChart: TrafficDataPoint[]
}

// ── Helpers ──────────────────────────────────────────────────────

const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const impactColors: Record<string, string> = {
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
}

// ── Skeleton Components ──────────────────────────────────────────

function KPISkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded mb-2" />
          <div className="w-28 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="w-40 h-6 bg-gray-200 rounded mb-2" />
      <div className="w-24 h-4 bg-gray-200 rounded mb-6" />
      <div className="h-80 bg-gray-100 rounded-xl" />
    </div>
  )
}

function WinsSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="w-32 h-6 bg-gray-200 rounded mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-4 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
          <div className="flex-1">
            <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
            <div className="w-1/3 h-3 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────

export default function PracticeDashboard(): React.ReactElement {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<number | 'network' | null>(null)

  const fetchDashboard = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/practice/dashboard')
      if (!response.ok) {
        setError(response.status)
        return
      }
      const data: DashboardData = await response.json()
      setDashboardData(data)
    } catch {
      setError('network')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDashboard()
  }, [fetchDashboard])

  const kpis = dashboardData?.kpis
  const wins = dashboardData?.wins ?? []
  const trafficChart = dashboardData?.trafficChart ?? []

  const metrics = useMemo(() => [
    {
      label: 'Health Score',
      value: kpis?.healthScore ?? 0,
      suffix: '/100',
      icon: Activity,
      color: 'blue',
    },
    {
      label: 'Rankings Improving',
      value: kpis?.rankingsImproving ?? 0,
      suffix: ` of ${kpis?.keywordCount ?? 0}`,
      icon: Search,
      color: 'green',
    },
    {
      label: 'Content Published',
      value: kpis?.contentPublished ?? 0,
      suffix: kpis?.contentThisMonth ? ` (${kpis.contentThisMonth} this month)` : '',
      icon: FileText,
      color: 'cyan',
    },
    {
      label: 'Page 1 Rankings',
      value: kpis?.page1 ?? 0,
      suffix: ' keywords',
      icon: Target,
      color: 'orange',
    },
  ], [kpis])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-80 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
        <KPISkeleton />
        <ChartSkeleton />
        <WinsSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back. Here&apos;s what&apos;s happening with your practice.</p>
        </div>
        <ApiError status={error} onRetry={() => void fetchDashboard()} />
      </div>
    )
  }

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    cyan: 'from-cyan-500 to-cyan-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back{dashboardData?.client?.name ? `, ${dashboardData.client.name}` : ''}. Here&apos;s what&apos;s happening with your practice.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon

          return (
            <div
              key={index}
              className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[metric.color]} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {metric.value}<span className="text-sm font-normal text-gray-500">{metric.suffix}</span>
              </div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </div>
          )
        })}
      </div>

      {/* Traffic Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Website Traffic</h2>
            <p className="text-sm text-gray-600">Organic search visitors</p>
          </div>
          {trafficChart.length > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-600">Visitors</span>
            </div>
          )}
        </div>
        {trafficChart.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficChart}>
                <defs>
                  <linearGradient id="colorVisitorsPractice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVisitorsPractice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No traffic data yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Traffic data will appear once Google Search Console is connected and data starts flowing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Wins */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Wins</h2>
        {wins.length > 0 ? (
          <div className="space-y-4">
            {wins.map((win, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">{win.message}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(win.timestamp)}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${impactColors[win.impact] ?? impactColors.low}`}>
                      {win.impact} impact
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nothing yet — get started!</p>
            <p className="text-gray-400 text-sm mt-1">
              Wins will appear here as Zintas works on your SEO. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
