'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, ExternalLink, FileText, Settings, Activity, AlertCircle, TrendingUp } from 'lucide-react'

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

const mockClients = [
  {
    id: 'cl1',
    name: 'Smith Family Dental',
    domain: 'smithdental.com',
    healthScore: 85,
    managementMode: 'managed',
    pendingCount: 3,
    lastActivity: '2025-02-10T10:30:00Z',
  },
  {
    id: 'cl2',
    name: 'Rogers Dental Studio',
    domain: 'rogersdental.com',
    healthScore: 72,
    managementMode: 'self_service',
    pendingCount: 0,
    lastActivity: '2025-02-11T14:00:00Z',
  },
  {
    id: 'cl3',
    name: 'NWA Pediatric Dentistry',
    domain: 'nwapediatric.com',
    healthScore: 45,
    managementMode: 'managed',
    pendingCount: 5,
    lastActivity: '2025-02-12T09:00:00Z',
  },
  {
    id: 'cl4',
    name: 'Pinnacle Cosmetic Dental',
    domain: 'pinnacledental.com',
    healthScore: 91,
    managementMode: 'managed',
    pendingCount: 2,
    lastActivity: '2025-02-11T16:00:00Z',
  },
  {
    id: 'cl5',
    name: 'Bentonville Family Dentist',
    domain: 'bentonvillefamily.com',
    healthScore: 58,
    managementMode: 'self_service',
    pendingCount: 8,
    lastActivity: '2025-02-09T11:00:00Z',
  },
  {
    id: 'cl6',
    name: 'Ozark Dental Group',
    domain: 'ozarkdental.com',
    healthScore: 34,
    managementMode: 'managed',
    pendingCount: 0,
    lastActivity: '2025-02-08T08:00:00Z',
  },
]

const mockMetrics = {
  totalClients: 6,
  totalPending: 18,
  avgHealthScore: 64,
  auditLeadsThisWeek: 12,
}

type FilterType = 'all' | 'critical' | 'pending'

export default function ManagerPortfolio() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredClients = useMemo(() => {
    return mockClients.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'critical'
          ? c.healthScore < 60
          : activeFilter === 'pending'
          ? c.pendingCount > 0
          : true
      return matchesSearch && matchesFilter
    })
  }, [searchQuery, activeFilter])

  const getHealthColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-500' }
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-500' }
    return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-500' }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Portfolio</h1>
        <p className="text-gray-600">Manage and monitor all your dental practice clients.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-gray-500">Total</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{mockMetrics.totalClients}</div>
          <div className="text-sm text-gray-600">Active Clients</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className={`w-5 h-5 ${mockMetrics.totalPending > 15 ? 'text-red-600' : mockMetrics.totalPending > 5 ? 'text-orange-600' : 'text-blue-600'}`} />
            <span className="text-xs font-medium text-gray-500">Queue</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{mockMetrics.totalPending}</div>
          <div className="text-sm text-gray-600">Pending Approvals</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="relative w-10 h-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - mockMetrics.avgHealthScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">{mockMetrics.avgHealthScore}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-500">Average</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{mockMetrics.avgHealthScore}</div>
          <div className="text-sm text-gray-600">Health Score</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-cyan-600" />
            <span className="text-xs font-medium text-gray-500">This Week</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{mockMetrics.auditLeadsThisWeek}</div>
          <div className="text-sm text-gray-600">Audit Leads</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {(['all', 'critical', 'pending'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'critical' ? 'Critical Health' : 'Has Pending'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const healthColor = getHealthColor(client.healthScore)

          return (
            <Link
              key={client.id}
              href={`/dashboard/${client.id}`}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">
                    {client.name}
                  </h3>
                  <a
                    href={`https://${client.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{client.domain}</span>
                  </a>
                </div>

                {/* Health Score Badge */}
                <div className={`relative w-14 h-14 shrink-0 ml-3`}>
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="currentColor"
                      className={healthColor.text}
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - client.healthScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold ${healthColor.text}`}>{client.healthScore}</span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="text-xs text-gray-600">
                  Last activity: <span className="font-medium text-gray-900">{formatRelativeTime(client.lastActivity)}</span>
                </div>
                {client.pendingCount > 0 && (
                  <div
                    className="cursor-pointer px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold hover:bg-orange-200 transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    {client.pendingCount} pending
                  </div>
                )}
              </div>

              {/* Management Mode */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    client.managementMode === 'managed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {client.managementMode === 'managed' ? 'Managed' : 'Self-Service'}
                </span>

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Search Console"
                  >
                    <Search className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Content"
                  >
                    <FileText className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
