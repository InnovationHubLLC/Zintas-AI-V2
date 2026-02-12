'use client'

import { useState, useMemo } from 'react'
import { Filter, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

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

type QueueItem = {
  id: string
  clientName: string
  actionType: string
  description: string
  severity: 'low' | 'medium' | 'high'
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  proposedData?: {
    oldTitle?: string
    newTitle?: string
    complianceNote?: string
  }
}

const mockQueueItems: QueueItem[] = [
  {
    id: 'q1',
    clientName: 'Smith Family Dental',
    actionType: 'Content: Blog Post',
    description: 'New blog post: "10 Signs You Need a Dental Crown"',
    severity: 'low',
    submittedAt: '2025-02-11T14:30:00Z',
    status: 'pending',
    proposedData: {
      oldTitle: '',
      newTitle: '10 Signs You Need a Dental Crown',
      complianceNote: 'Medical claims verified',
    },
  },
  {
    id: 'q2',
    clientName: 'Rogers Dental Studio',
    actionType: 'SEO: Meta Update',
    description: 'Update meta description for services page',
    severity: 'medium',
    submittedAt: '2025-02-11T10:15:00Z',
    status: 'pending',
    proposedData: {
      oldTitle: 'Dental Services in Rogers',
      newTitle: 'Expert Dental Services in Rogers AR | Rogers Dental Studio',
    },
  },
  {
    id: 'q3',
    clientName: 'NWA Pediatric Dentistry',
    actionType: 'Content: Blog Post',
    description: 'Blog post draft: "Cavity Prevention Tips for Kids"',
    severity: 'high',
    submittedAt: '2025-02-10T16:45:00Z',
    status: 'pending',
  },
  {
    id: 'q4',
    clientName: 'Pinnacle Cosmetic Dental',
    actionType: 'Social: Instagram Post',
    description: 'Social media post about teeth whitening promotion',
    severity: 'low',
    submittedAt: '2025-02-10T09:00:00Z',
    status: 'pending',
  },
  {
    id: 'q5',
    clientName: 'Smith Family Dental',
    actionType: 'SEO: Keyword Target',
    description: 'Add new keyword targeting for "dental implants bentonville"',
    severity: 'medium',
    submittedAt: '2025-02-09T11:30:00Z',
    status: 'pending',
  },
]

type FilterType = 'all' | 'low' | 'medium' | 'high'

export default function ApprovalQueue() {
  const [items, setItems] = useState<QueueItem[]>(mockQueueItems)
  const [clientFilter, setClientFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState<FilterType>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const uniqueClients = useMemo(() => Array.from(new Set(items.map((i) => i.clientName))), [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesClient = clientFilter === 'all' || item.clientName === clientFilter
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter
      const matchesType =
        typeFilter === 'all' ||
        item.actionType.toLowerCase().includes(typeFilter.toLowerCase())
      return matchesClient && matchesSeverity && matchesType && item.status === 'pending'
    })
  }, [items, clientFilter, severityFilter, typeFilter])

  const handleApprove = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' as const } : item))
    )
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    alert('Item approved!')
  }

  const handleReject = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' as const } : item))
    )
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    alert('Item rejected!')
  }

  const handleBulkApprove = () => {
    setItems((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, status: 'approved' as const } : item
      )
    )
    setSelectedIds(new Set())
    alert(`${selectedIds.size} items approved!`)
  }

  const handleBulkReject = () => {
    setItems((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, status: 'rejected' as const } : item
      )
    )
    setSelectedIds(new Set())
    alert(`${selectedIds.size} items rejected!`)
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)))
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const severityConfig = {
    low: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle },
    high: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approval Queue</h1>
        <p className="text-gray-600">
          Review and approve content and changes from your AI agents.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as FilterType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="content">Content</option>
              <option value="seo">SEO</option>
              <option value="social">Social</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                    onChange={toggleAll}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
                  Client
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
                  Action Type
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
                  Severity
                </th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
                  Submitted
                </th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const SeverityIcon = severityConfig[item.severity].icon
                const isExpanded = expandedRowId === item.id

                return (
                  <>
                    <tr
                      key={item.id}
                      onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelection(item.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {item.clientName}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">{item.actionType}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{item.description}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${severityConfig[item.severity].bg} ${severityConfig[item.severity].color}`}
                        >
                          <SeverityIcon className="w-3 h-3" />
                          <span className="capitalize">{item.severity}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-gray-600">
                        {formatRelativeTime(item.submittedAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className="flex items-center justify-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 p-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Full Description
                              </h4>
                              <p className="text-sm text-gray-700">{item.description}</p>
                            </div>

                            {item.proposedData?.oldTitle && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Proposed Changes
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs text-red-600 font-semibold mb-1">
                                      Old
                                    </p>
                                    <p className="text-sm text-gray-900 line-through">
                                      {item.proposedData.oldTitle}
                                    </p>
                                  </div>
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs text-green-600 font-semibold mb-1">
                                      New
                                    </p>
                                    <p className="text-sm text-gray-900">
                                      {item.proposedData.newTitle}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.proposedData?.complianceNote && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-600 font-semibold mb-1">
                                  Compliance Note
                                </p>
                                <p className="text-sm text-gray-700">
                                  {item.proposedData.complianceNote}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center space-x-3 pt-4">
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                              >
                                <CheckCircle className="w-5 h-5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                              >
                                <XCircle className="w-5 h-5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending items</h3>
              <p className="text-gray-600">All items have been reviewed</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center space-x-6 animate-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="h-6 w-px bg-gray-700" />
          <button
            onClick={handleBulkApprove}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve Selected</span>
          </button>
          <button
            onClick={handleBulkReject}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Selected</span>
          </button>
        </div>
      )}
    </div>
  )
}
