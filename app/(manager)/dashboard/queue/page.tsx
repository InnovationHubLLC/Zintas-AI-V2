'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────

interface AgentAction {
  id: string
  org_id: string
  client_id: string
  agent: string
  action_type: string
  autonomy_tier: number
  status: string
  severity: string
  description: string
  proposed_data: Record<string, unknown>
  rollback_data: Record<string, unknown>
  content_piece_id: string | null
  approved_by: string | null
  approved_at: string | null
  deployed_at: string | null
  created_at: string
}

interface ClientInfo {
  id: string
  name: string
}

// ── Helpers ──────────────────────────────────────────────────────

const PAGE_SIZE = 25

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const severityConfig: Record<
  string,
  { color: string; bg: string; icon: typeof AlertTriangle }
> = {
  critical: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
  warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle },
  info: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Info },
}

function actionTypeBadgeColor(actionType: string): string {
  if (actionType.includes('content')) return 'bg-purple-100 text-purple-700'
  if (actionType.includes('keyword')) return 'bg-blue-100 text-blue-700'
  if (actionType.includes('meta')) return 'bg-cyan-100 text-cyan-700'
  if (actionType.includes('gbp')) return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-700'
}

// ── Component ────────────────────────────────────────────────────

export default function ApprovalQueue(): React.ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [items, setItems] = useState<AgentAction[]>([])
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Read filters from URL
  const clientFilter = searchParams.get('client') ?? ''
  const severityFilter = searchParams.get('severity') ?? ''
  const typeFilter = searchParams.get('type') ?? ''
  const statusFilter = searchParams.get('status') ?? 'pending'

  // Client name lookup
  const clientMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of clients) map.set(c.id, c.name)
    return map
  }, [clients])

  // Update URL filters
  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`?${params.toString()}`)
    },
    [searchParams, router]
  )

  const clearFilters = useCallback(() => {
    router.push('?status=pending')
  }, [router])

  const activeFilterCount = [clientFilter, severityFilter, typeFilter].filter(Boolean).length

  // Fetch clients
  useEffect(() => {
    async function loadClients(): Promise<void> {
      try {
        const res = await fetch('/api/clients')
        if (res.ok) {
          const data = (await res.json()) as ClientInfo[]
          setClients(data)
        }
      } catch {
        // silently ignore
      }
    }
    void loadClients()
  }, [])

  // Fetch queue items
  useEffect(() => {
    async function loadQueue(): Promise<void> {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (clientFilter) params.set('clientId', clientFilter)
        if (severityFilter) params.set('severity', severityFilter)
        if (typeFilter) params.set('actionType', typeFilter)
        if (statusFilter) params.set('status', statusFilter)
        params.set('limit', String(PAGE_SIZE))
        params.set('offset', String(page * PAGE_SIZE))

        const res = await fetch(`/api/queue?${params.toString()}`)
        if (res.ok) {
          const data = (await res.json()) as AgentAction[]
          setItems(data)
          setTotalCount(data.length < PAGE_SIZE ? page * PAGE_SIZE + data.length : (page + 1) * PAGE_SIZE + 1)
        }
      } finally {
        setLoading(false)
      }
    }
    void loadQueue()
  }, [clientFilter, severityFilter, typeFilter, statusFilter, page])

  // Approve single item
  const handleApprove = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/queue/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        setSelectedIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch {
      // approval failed
    }
  }, [])

  // Reject single item
  const handleReject = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/queue/${id}/reject`, { method: 'POST' })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        setSelectedIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch {
      // rejection failed
    }
  }, [])

  // Bulk approve
  const handleBulkApprove = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/queue/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIds: Array.from(selectedIds) }),
      })
      if (res.ok) {
        const result = (await res.json()) as { approved: number; failed: number; errors: string[] }
        setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)))
        setSelectedIds(new Set())
        if (result.failed > 0) {
          alert(`Approved: ${result.approved}, Failed: ${result.failed}`)
        }
      }
    } catch {
      // bulk approve failed
    }
  }, [selectedIds])

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }, [selectedIds.size, items])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'j') {
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1))
      } else if (e.key === 'k') {
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'a' && focusedIndex >= 0 && focusedIndex < items.length) {
        void handleApprove(items[focusedIndex].id)
      } else if (e.key === 'r' && focusedIndex >= 0 && focusedIndex < items.length) {
        void handleReject(items[focusedIndex].id)
      } else if (e.key === 'x' && focusedIndex >= 0 && focusedIndex < items.length) {
        toggleSelection(items[focusedIndex].id)
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < items.length) {
        const item = items[focusedIndex]
        setExpandedRowId((prev) => (prev === item.id ? null : item.id))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, focusedIndex, handleApprove, handleReject, toggleSelection])

  // Pagination
  const hasNextPage = items.length === PAGE_SIZE
  const hasPrevPage = page > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approval Queue</h1>
        <p className="text-gray-600">
          Review and approve content and changes from your AI agents.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              value={clientFilter}
              onChange={(e) => setFilter('client', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setFilter('severity', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setFilter('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="content_new">Content: New</option>
              <option value="content_edit">Content: Edit</option>
              <option value="keyword_research">Keyword Research</option>
              <option value="meta_update">Meta Update</option>
              <option value="gbp_post">GBP Post</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setFilter('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="deployed">Deployed</option>
              <option value="rejected">Rejected</option>
              <option value="">All Status</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {clientFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                Client: {clientMap.get(clientFilter) ?? clientFilter}
                <button onClick={() => setFilter('client', '')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {severityFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                Severity: {severityFilter}
                <button onClick={() => setFilter('severity', '')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                Type: {typeFilter}
                <button onClick={() => setFilter('type', '')}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-gray-500 mt-3">
          Showing {items.length} result{items.length !== 1 ? 's' : ''}
          {page > 0 && ` (page ${page + 1})`}
        </p>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-4 text-left w-12">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedIds.size === items.length}
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
                    Created
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const isExpanded = expandedRowId === item.id
                  const isFocused = focusedIndex === index
                  const sev = severityConfig[item.severity] ?? severityConfig.info
                  const SeverityIcon = sev.icon

                  return (
                    <tbody key={item.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isFocused ? 'ring-2 ring-inset ring-blue-400' : ''
                        }`}
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
                          <Link
                            href={`/dashboard/${item.client_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {clientMap.get(item.client_id) ?? item.client_id}
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${actionTypeBadgeColor(item.action_type)}`}
                          >
                            {item.action_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700 max-w-xs truncate">
                          {item.description}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${sev.bg} ${sev.color}`}
                          >
                            <SeverityIcon className="w-3 h-3" />
                            <span className="capitalize">{item.severity}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-600">
                          {formatRelativeTime(item.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <div
                            className="flex items-center justify-center space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => void handleApprove(item.id)}
                                  className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                                  title="Approve (a)"
                                >
                                  <CheckCircle className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                                </button>
                                <button
                                  onClick={() => void handleReject(item.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                  title="Reject (r)"
                                >
                                  <XCircle className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                                </button>
                              </>
                            )}
                            {item.content_piece_id && (
                              <Link
                                href={`/dashboard/${item.client_id}/content/${item.content_piece_id}/edit`}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                                title="Edit Content"
                              >
                                <Clock className="w-5 h-5" />
                              </Link>
                            )}
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

                              {Object.keys(item.proposed_data).length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                    Proposed Changes
                                  </h4>
                                  <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-48">
                                    {JSON.stringify(item.proposed_data, null, 2)}
                                  </pre>
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Agent: {item.agent}</span>
                                <span>Tier: {item.autonomy_tier}</span>
                                <span>Status: {item.status}</span>
                                {item.approved_by && (
                                  <span>Approved by: {item.approved_by}</span>
                                )}
                              </div>

                              {item.status === 'pending' && (
                                <div className="flex items-center space-x-3 pt-4">
                                  <button
                                    onClick={() => void handleApprove(item.id)}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => void handleReject(item.id)}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                                  >
                                    <XCircle className="w-5 h-5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  )
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {items.length === 0 && !loading && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No pending items
                </h3>
                <p className="text-gray-600">
                  Your clients are running smoothly — nothing to review right now.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {(hasPrevPage || hasNextPage) && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrevPage}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center space-x-6 z-50">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="h-6 w-px bg-gray-700" />
          <button
            onClick={() => void handleBulkApprove()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve Selected</span>
          </button>
          <button
            onClick={() => {
              setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)))
              setSelectedIds(new Set())
            }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Selected</span>
          </button>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-xs text-gray-400 pb-4">
        Keyboard: j/k navigate &middot; a approve &middot; r reject &middot; x select &middot; Enter expand
      </div>
    </div>
  )
}
