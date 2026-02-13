'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Search, FileText, Target, Activity } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────

interface ReportsMetrics {
  totalKeywords: number
  rankingsImproving: number
  page1: number
  contentPublished: number
  totalContent: number
}

interface TrafficDataPoint {
  date: string
  visitors: number
}

interface RankingsChartItem {
  range: string
  count: number
  color: string
}

interface KeywordTrend {
  keyword: string
  current_position: number | null
  previous_position: number | null
  change: number | null
  search_volume: number
}

interface ContentPerformanceItem {
  id: string
  title: string
  content_type: string
  published_at: string | null
  target_keyword: string | null
  word_count: number
}

interface ReportsData {
  metrics: ReportsMetrics
  trafficChart: TrafficDataPoint[]
  rankingsChart: RankingsChartItem[]
  keywordTrends: KeywordTrend[]
  contentPerformance: ContentPerformanceItem[]
}

type TabType = 'traffic' | 'rankings' | 'content'

// ── Skeleton ─────────────────────────────────────────────────────

function MetricsSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
          <div className="w-16 h-8 bg-gray-200 rounded mb-2" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="w-48 h-6 bg-gray-200 rounded mb-6" />
      <div className="h-80 bg-gray-100 rounded-xl" />
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────

export default function PracticeReports(): React.ReactElement {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('traffic')

  useEffect(() => {
    async function fetchReports(): Promise<void> {
      try {
        const response = await fetch('/api/practice/reports')
        if (response.ok) {
          const result: ReportsData = await response.json()
          setData(result)
        }
      } catch {
        // Failed to load
      } finally {
        setLoading(false)
      }
    }

    void fetchReports()
  }, [])

  const metrics = data?.metrics
  const trafficChart = data?.trafficChart ?? []
  const rankingsChart = data?.rankingsChart ?? []
  const keywordTrends = data?.keywordTrends ?? []
  const contentPerformance = data?.contentPerformance ?? []

  const tabs: { id: TabType; label: string }[] = [
    { id: 'traffic', label: 'Traffic' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'content', label: 'Content' },
  ]

  const metricCards = [
    { label: 'Total Keywords', value: metrics?.totalKeywords ?? 0, icon: Search, color: 'blue' },
    { label: 'Rankings Improving', value: metrics?.rankingsImproving ?? 0, icon: TrendingUp, color: 'green' },
    { label: 'Page 1 Keywords', value: metrics?.page1 ?? 0, icon: Target, color: 'orange' },
    { label: 'Content Published', value: metrics?.contentPublished ?? 0, icon: FileText, color: 'cyan' },
  ]

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    cyan: 'from-cyan-500 to-cyan-600',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Track your SEO performance and content engagement.</p>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[metric.color]} rounded-xl flex items-center justify-center shadow-lg mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm inline-flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <ChartSkeleton />}

      {/* Traffic Tab */}
      {!loading && activeTab === 'traffic' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Website Traffic Overview</h2>
          {trafficChart.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficChart}>
                  <defs>
                    <linearGradient id="colorVisitorsReport" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorVisitorsReport)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No traffic data yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Traffic data will appear once Google Search Console data starts flowing.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rankings Tab */}
      {!loading && activeTab === 'rankings' && (
        <div className="space-y-6">
          {/* Rankings by Position Range */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Keywords by Position Range</h2>
            {rankingsChart.some((r) => r.count > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingsChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis dataKey="range" type="category" width={130} stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {rankingsChart.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No ranking data yet</p>
                  <p className="text-gray-400 text-sm mt-1">Rankings will appear after keyword tracking begins.</p>
                </div>
              </div>
            )}
          </div>

          {/* Keyword Details Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Keyword Performance</h2>
            {keywordTrends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Keyword</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Position</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Change</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordTrends.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{row.keyword}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            {row.current_position ?? '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {row.change !== null && row.change > 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-600">+{row.change}</span>
                              </>
                            ) : row.change !== null && row.change < 0 ? (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-semibold text-red-600">{row.change}</span>
                              </>
                            ) : (
                              <Minus className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-600">
                          {row.search_volume.toLocaleString()}/mo
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No keyword data yet</p>
                <p className="text-gray-400 text-sm mt-1">Keywords will appear after research is complete.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Tab */}
      {!loading && activeTab === 'content' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Content Performance</h2>
          {contentPerformance.length > 0 ? (
            <div className="space-y-4">
              {contentPerformance.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {item.content_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                    {item.target_keyword && (
                      <p className="text-xs text-blue-600 mt-1">Target: {item.target_keyword}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-gray-900">{item.word_count} words</div>
                    {item.published_at && (
                      <div className="text-xs text-gray-500">
                        {new Date(item.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nothing yet</p>
              <p className="text-gray-400 text-sm mt-1">Published content performance will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
