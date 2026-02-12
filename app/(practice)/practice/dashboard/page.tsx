'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, FileText, Target, ArrowUp, ArrowDown, Clock } from 'lucide-react'
import { useMemo } from 'react'

const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const mockTrafficData = [
  { date: 'Jan 1', visitors: 320 },
  { date: 'Jan 8', visitors: 380 },
  { date: 'Jan 15', visitors: 420 },
  { date: 'Jan 22', visitors: 510 },
  { date: 'Jan 29', visitors: 580 },
  { date: 'Feb 5', visitors: 650 },
  { date: 'Feb 12', visitors: 720 },
]

const mockRecentWins = [
  { id: 1, title: 'Ranked #1 for "dental implants bentonville"', timestamp: '2025-02-10T14:30:00Z', impact: 'high' },
  { id: 2, title: 'Blog post "Teeth Whitening Guide" got 250 views', timestamp: '2025-02-11T09:15:00Z', impact: 'medium' },
  { id: 3, title: 'Moved up 3 positions for "family dentist near me"', timestamp: '2025-02-11T16:45:00Z', impact: 'high' },
  { id: 4, title: 'New blog post published and indexed by Google', timestamp: '2025-02-12T08:00:00Z', impact: 'medium' },
]

const mockKeyMetrics = {
  totalVisitors: 2580,
  visitorChange: 15.3,
  leadConversions: 47,
  conversionChange: 8.2,
  contentPublished: 12,
  contentChange: 20,
  avgKeywordPosition: 4.2,
  positionChange: -1.8,
}

export default function PracticeDashboard() {
  const metrics = useMemo(() => [
    {
      label: 'Website Visitors',
      value: mockKeyMetrics.totalVisitors.toLocaleString(),
      change: mockKeyMetrics.visitorChange,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Lead Conversions',
      value: mockKeyMetrics.leadConversions,
      change: mockKeyMetrics.conversionChange,
      icon: Target,
      color: 'green',
    },
    {
      label: 'Content Published',
      value: mockKeyMetrics.contentPublished,
      change: mockKeyMetrics.contentChange,
      icon: FileText,
      color: 'cyan',
    },
    {
      label: 'Avg. Keyword Position',
      value: mockKeyMetrics.avgKeywordPosition.toFixed(1),
      change: mockKeyMetrics.positionChange,
      icon: TrendingUp,
      color: 'orange',
      inverse: true,
    },
  ], [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, Dr. Smith. Here's what's happening with your practice.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          const isPositive = metric.inverse ? metric.change < 0 : metric.change > 0
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            cyan: 'from-cyan-500 to-cyan-600',
            orange: 'from-orange-500 to-orange-600',
          }

          return (
            <div
              key={index}
              className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[metric.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50" style={{
                backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
              }} />
            </div>
          )
        })}
      </div>

      {/* Traffic Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Website Traffic</h2>
            <p className="text-sm text-gray-600">Last 7 weeks</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-600">Visitors</span>
          </div>
        </div>
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
                fill="url(#colorVisitors)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Wins */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Wins</h2>
        <div className="space-y-4">
          {mockRecentWins.map((win) => (
            <div
              key={win.id}
              className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">{win.title}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(win.timestamp)}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    win.impact === 'high'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {win.impact} impact
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
