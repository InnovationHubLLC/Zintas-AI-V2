'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Activity, TrendingUp, FileText, Search, AlertCircle, CheckCircle, Clock, XCircle, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  {
    id: 6,
    agent: 'scholar',
    task: 'Attempted to fetch competitor rankings',
    status: 'failed',
    timestamp: '2025-02-09T08:00:00Z',
  },
]

const mockKeyMetrics = {
  weeklyVisitors: 610,
  keywordRankings: 42,
  contentPublished: 8,
  conversionRate: 3.2,
}

export default function ClientOverview({ params }: { params: Promise<{ client: string }> }) {
  const { client: clientId } = use(params)

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
          { label: 'Weekly Visitors', value: mockKeyMetrics.weeklyVisitors, icon: TrendingUp, color: 'blue' },
          { label: 'Keyword Rankings', value: mockKeyMetrics.keywordRankings, icon: Search, color: 'green' },
          { label: 'Content Published', value: mockKeyMetrics.contentPublished, icon: FileText, color: 'purple' },
          { label: 'Conversion Rate', value: `${mockKeyMetrics.conversionRate}%`, icon: Activity, color: 'orange' },
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
