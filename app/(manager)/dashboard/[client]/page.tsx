'use client'

import { use, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  Activity,
  TrendingUp,
  TrendingDown,
  FileText,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface KeywordRow {
  id: string
  keyword: string
  current_position: number | null
  previous_position: number | null
  search_volume: number
  difficulty: number
  keyword_type: string
  source: string
}

interface KeywordsResponse {
  keywords: KeywordRow[]
  total: number
  page: number
  limit: number
}

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

const agentColors = {
  ghostwriter: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  scholar: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  conductor: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  analyst: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
}

const statusIcons = {
  completed: { icon: CheckCircle, color: 'text-green-600' },
  pending: { icon: Clock, color: 'text-yellow-600' },
  failed: { icon: XCircle, color: 'text-red-600' },
}

const mockClient = {
  id: 'cl1',
  name: 'Smith Family Dental',
  domain: 'smithdental.com',
  healthScore: 85,
  managementMode: 'managed',
  pendingCount: 3,
}

const mockTrafficData = [
  { date: 'Week 1', visitors: 420 },
  { date: 'Week 2', visitors: 480 },
  { date: 'Week 3', visitors: 520 },
  { date: 'Week 4', visitors: 610 },
]

const mockAgentActivity = [
  {
    id: 1,
    agent: 'ghostwriter',
    task: 'Published blog post: "10 Signs You Need a Dental Crown"',
    status: 'completed',
    timestamp: '2025-02-11T14:30:00Z',
  },
  {
    id: 2,
    agent: 'scholar',
    task: 'Completed keyword research for "dental implants bentonville"',
    status: 'completed',
    timestamp: '2025-02-11T10:15:00Z',
  },
  {
    id: 3,
    agent: 'conductor',
    task: 'Optimized 5 images across website for faster loading',
    status: 'completed',
    timestamp: '2025-02-10T16:45:00Z',
  },
  {
    id: 4,
    agent: 'ghostwriter',
    task: 'Drafted blog post: "Understanding Root Canal Treatment"',
    status: 'pending',
    timestamp: '2025-02-10T09:00:00Z',
  },
  {
    id: 5,
    agent: 'analyst',
    task: 'Generated monthly SEO performance report',
    status: 'completed',
    timestamp: '2025-02-09T11:30:00Z',
  },
]

type SortField = 'keyword' | 'position' | 'search_volume' | 'difficulty'
type SortOrder = 'asc' | 'desc'

function PositionChange({ current, previous }: { current: number | null; previous: number | null }): React.ReactElement {
  if (current === null) {
    return <span className="text-gray-400 text-sm">—</span>
  }
  if (previous === null) {
    return <span className="text-gray-500 text-xs font-medium px-2 py-0.5 bg-gray-100 rounded-full">NEW</span>
  }

  const change = previous - current
  if (change > 0) {
    return (
      <span className="flex items-center text-green-600 text-sm font-medium">
        <ArrowUp className="w-3 h-3 mr-0.5" />
        {change}
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="flex items-center text-red-600 text-sm font-medium">
        <ArrowDown className="w-3 h-3 mr-0.5" />
        {Math.abs(change)}
      </span>
    )
  }
  return (
    <span className="flex items-center text-gray-400 text-sm">
      <Minus className="w-3 h-3 mr-0.5" />
      0
    </span>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: number }): React.ReactElement {
  const color = difficulty < 30
    ? 'bg-green-100 text-green-700'
    : difficulty < 60
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700'

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {difficulty}
    </span>
  )
}

export default function ClientOverview({ params }: { params: Promise<{ client: string }> }) {
  const { client: clientId } = use(params)
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords'>('overview')
  const [keywords, setKeywords] = useState<KeywordRow[]>([])
  const [totalKeywords, setTotalKeywords] = useState(0)
  const [sortField, setSortField] = useState<SortField>('search_volume')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const fetchKeywords = useCallback(async (): Promise<void> => {
    try {
      const params = new URLSearchParams()
      params.set('sort', sortField)
      params.set('order', sortOrder)
      params.set('limit', '100')
      if (typeFilter) params.set('type', typeFilter)

      const response = await fetch(`/api/keywords/${clientId}?${params.toString()}`)
      if (response.ok) {
        const data: KeywordsResponse = await response.json()
        setKeywords(data.keywords)
        setTotalKeywords(data.total)
      }
    } catch {
      // Silently fail — UI will show empty state
    }
  }, [clientId, sortField, sortOrder, typeFilter])

  useEffect(() => {
    void fetchKeywords()
  }, [fetchKeywords])

  const keywordsRanked = useMemo(
    () => keywords.filter((k) => k.current_position !== null).length,
    [keywords]
  )

  const rankingsImproving = useMemo(
    () =>
      keywords.filter(
        (k) =>
          k.current_position !== null &&
          k.previous_position !== null &&
          k.current_position < k.previous_position
      ).length,
    [keywords]
  )

  const topMovements = useMemo(
    () =>
      keywords
        .filter((k) => k.current_position !== null && k.previous_position !== null)
        .map((k) => ({
          ...k,
          change: (k.previous_position ?? 0) - (k.current_position ?? 0),
        }))
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 5),
    [keywords]
  )

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mockClient.name}</h1>
            <a
              href={`https://${mockClient.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{mockClient.domain}</span>
            </a>
          </div>
        </div>

        {/* Health Score */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Health Score</div>
            <div className="text-2xl font-bold text-gray-900">{mockClient.healthScore}/100</div>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#10B981"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - mockClient.healthScore / 100)}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Keywords Ranked', value: keywordsRanked, icon: Search, color: 'green' },
          { label: 'Rankings Improving', value: rankingsImproving, icon: TrendingUp, color: 'blue' },
          { label: 'Content Published', value: 8, icon: FileText, color: 'purple' },
          { label: 'Conversion Rate', value: '3.2%', icon: Activity, color: 'orange' },
        ].map((metric, index) => {
          const Icon = metric.icon
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
          }

          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[metric.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center shadow-lg mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </div>
          )
        })}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'keywords'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Keywords ({totalKeywords})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Traffic Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Website Traffic Trend</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrafficData}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
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
                    fill="url(#colorVisitors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Keyword Movements */}
          {topMovements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Top Keyword Movements</h2>
              </div>
              <div className="space-y-3">
                {topMovements.map((kw) => (
                  <div
                    key={kw.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{kw.keyword}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        Position {kw.current_position}
                      </span>
                    </div>
                    <PositionChange current={kw.current_position} previous={kw.previous_position} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Activity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Agent Activity</h2>
            </div>

            <div className="space-y-4">
              {mockAgentActivity.map((activity) => {
                const agentColor = agentColors[activity.agent as keyof typeof agentColors]
                const StatusInfo = statusIcons[activity.status as keyof typeof statusIcons]
                const StatusIcon = StatusInfo.icon

                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className={`px-3 py-1 ${agentColor.bg} ${agentColor.text} rounded-lg text-xs font-semibold uppercase shrink-0 border ${agentColor.border}`}>
                      {activity.agent}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">{activity.task}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span>{formatRelativeTime(activity.timestamp)}</span>
                        <div className={`flex items-center space-x-1 ${StatusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="font-medium capitalize">{activity.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Keyword Rankings</h2>
            <div className="flex items-center space-x-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="target">Target</option>
                <option value="gap">Gap</option>
                <option value="tracked">Tracked</option>
              </select>
            </div>
          </div>

          {/* Keywords Table */}
          {keywords.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No keywords found. Run the Scholar agent to discover keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th
                      className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('keyword')}
                    >
                      Keyword {sortField === 'keyword' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('position')}
                    >
                      Position {sortField === 'position' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Change
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('search_volume')}
                    >
                      Volume {sortField === 'search_volume' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('difficulty')}
                    >
                      Difficulty {sortField === 'difficulty' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr
                      key={kw.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">{kw.keyword}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-700">
                          {kw.current_position ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <PositionChange current={kw.current_position} previous={kw.previous_position} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-700">
                          {kw.search_volume.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DifficultyBadge difficulty={kw.difficulty} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {kw.keyword_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending Items */}
      {mockClient.pendingCount > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-transparent rounded-2xl border border-orange-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-orange-600 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {mockClient.pendingCount} Items Awaiting Approval
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  These items require your review before they can be published or implemented.
                </p>
                <Link
                  href="/dashboard/queue"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  <span>View Approval Queue</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
