'use client'

import { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Eye, ThumbsUp } from 'lucide-react'

const mockTrafficData = [
  { date: 'Jan 1', visitors: 320, pageViews: 850 },
  { date: 'Jan 8', visitors: 380, pageViews: 980 },
  { date: 'Jan 15', visitors: 420, pageViews: 1120 },
  { date: 'Jan 22', visitors: 510, pageViews: 1350 },
  { date: 'Jan 29', visitors: 580, pageViews: 1520 },
  { date: 'Feb 5', visitors: 650, pageViews: 1680 },
  { date: 'Feb 12', visitors: 720, pageViews: 1850 },
]

const mockRankingsData = [
  { keyword: 'dental implants', position: 3 },
  { keyword: 'teeth whitening', position: 5 },
  { keyword: 'family dentist', position: 7 },
  { keyword: 'cosmetic dentistry', position: 4 },
  { keyword: 'emergency dental', position: 9 },
]

const mockKeywordDetails = [
  {
    keyword: 'dental implants bentonville',
    position: 3,
    previousPosition: 5,
    volume: 1200,
    clicks: 85,
  },
  {
    keyword: 'teeth whitening near me',
    position: 5,
    previousPosition: 4,
    volume: 2400,
    clicks: 120,
  },
  {
    keyword: 'family dentist rogers ar',
    position: 7,
    previousPosition: 7,
    volume: 890,
    clicks: 42,
  },
  {
    keyword: 'cosmetic dentistry bentonville',
    position: 4,
    previousPosition: 8,
    volume: 650,
    clicks: 58,
  },
  {
    keyword: 'emergency dental care',
    position: 9,
    previousPosition: 12,
    volume: 1500,
    clicks: 68,
  },
]

const mockContentPerformance = [
  {
    title: 'Top 5 Foods That Strengthen Your Teeth',
    publishedDate: '2025-01-28',
    viewsThisMonth: 893,
    engagement: 67,
  },
  {
    title: 'How to Maintain Your Oral Health After 50',
    publishedDate: '2025-02-01',
    viewsThisMonth: 687,
    engagement: 52,
  },
  {
    title: 'The Complete Guide to Teeth Whitening',
    publishedDate: '2025-02-05',
    viewsThisMonth: 521,
    engagement: 45,
  },
  {
    title: '10 Signs You Need a Dental Crown',
    publishedDate: '2025-02-08',
    viewsThisMonth: 342,
    engagement: 28,
  },
]

type TabType = 'traffic' | 'rankings' | 'content'

export default function PracticeReports() {
  const [activeTab, setActiveTab] = useState<TabType>('traffic')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'traffic', label: 'Traffic' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'content', label: 'Content' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Track your SEO performance and content engagement.</p>
      </div>

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

      {/* Traffic Tab */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Website Traffic Overview</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrafficData}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPageViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-gray-600">Visitors</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-600">Page Views</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          {/* Rankings Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Keywords Average Position</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRankingsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="keyword" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <YAxis reversed domain={[0, 10]} stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="position" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Keyword Details Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Keyword Performance Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Keyword</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Position</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Change</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Volume</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {mockKeywordDetails.map((row, index) => {
                    const change = row.previousPosition - row.position
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">{row.keyword}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            {row.position}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {change > 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-600">+{change}</span>
                              </>
                            ) : change < 0 ? (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-semibold text-red-600">{change}</span>
                              </>
                            ) : (
                              <Minus className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-600">
                          {row.volume.toLocaleString()}/mo
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
                          {row.clicks}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Content Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockContentPerformance
                .sort((a, b) => b.viewsThisMonth - a.viewsThisMonth)
                .map((content, index) => (
                  <div
                    key={index}
                    className="group p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {content.title}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {content.viewsThisMonth}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ThumbsUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {content.engagement}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600">
                      Published: {new Date(content.publishedDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
