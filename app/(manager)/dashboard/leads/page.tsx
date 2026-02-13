'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  Search,
  Download,
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  BarChart3,
  CheckCircle,
  AtSign,
  X,
} from 'lucide-react'
import { ApiError } from '@/app/components/api-error'
import { useToast } from '@/app/components/toast'

// ── Types ────────────────────────────────────────────────────────

interface LeadItem {
  id: string
  domain: string
  email: string | null
  audit_score: number | null
  audit_results: Record<string, unknown>
  converted: boolean
  converted_at: string | null
  source: string | null
  created_at: string
}

type SortField = 'audit_score' | 'created_at' | 'converted'
type SortDir = 'asc' | 'desc'
type FilterConverted = 'all' | 'converted' | 'not_converted'

// ── Helpers ──────────────────────────────────────────────────────

function getGrade(score: number | null): { label: string; color: string } {
  if (score === null) return { label: 'N/A', color: 'bg-gray-100 text-gray-600' }
  if (score >= 90) return { label: 'A+', color: 'bg-green-100 text-green-700' }
  if (score >= 80) return { label: 'A', color: 'bg-green-100 text-green-700' }
  if (score >= 70) return { label: 'B', color: 'bg-blue-100 text-blue-700' }
  if (score >= 60) return { label: 'C', color: 'bg-yellow-100 text-yellow-700' }
  if (score >= 50) return { label: 'D', color: 'bg-orange-100 text-orange-700' }
  return { label: 'F', color: 'bg-red-100 text-red-700' }
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#9CA3AF'
  if (score >= 80) return '#10B981'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function leadsToCSV(leads: LeadItem[]): string {
  const headers = ['Domain', 'Email', 'Score', 'Grade', 'Source', 'Date', 'Converted']
  const rows = leads.map((l) => [
    l.domain,
    l.email ?? '',
    String(l.audit_score ?? ''),
    getGrade(l.audit_score).label,
    l.source ?? '',
    formatDate(l.created_at),
    l.converted ? 'Yes' : 'No',
  ])
  return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
}

// ── Skeleton ─────────────────────────────────────────────────────

function LeadsSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded mb-3" />
            <div className="w-16 h-8 bg-gray-200 rounded mb-2" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Email Dialog ─────────────────────────────────────────────────

function EmailDialog({
  lead,
  onClose,
  onSent,
}: {
  lead: LeadItem
  onClose: () => void
  onSent: () => void
}): React.ReactElement {
  const [sending, setSending] = useState(false)
  const { toast } = useToast()
  const score = lead.audit_score ?? 0

  const template = `Hi, you recently audited ${lead.domain} and scored ${score}/100. We can fix these issues automatically. Start your free trial at zintas.ai/sign-up`

  async function handleSend(): Promise<void> {
    setSending(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}/email`, { method: 'POST' })
      if (response.ok) {
        toast('success', 'Follow-up email sent successfully!')
        onSent()
      } else if (response.status === 429) {
        toast('error', 'This lead was already emailed recently.')
      } else {
        toast('error', 'Failed to send email. Please try again.')
      }
    } catch {
      toast('error', 'Network error. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Send Follow-Up Email</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
              {lead.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Template <span className="text-xs text-gray-400 font-normal">(auto-generated)</span>
            </label>
            <div className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed">
              {template}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSend()}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────

export default function ManagerLeads(): React.ReactElement {
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<number | 'network' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('audit_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterConverted, setFilterConverted] = useState<FilterConverted>('all')
  const [minScore, setMinScore] = useState<number>(0)
  const [hasEmail, setHasEmail] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [emailDialogLead, setEmailDialogLead] = useState<LeadItem | null>(null)

  function doFetch(): void {
    setError(null)
    setLoading(true)
    void fetchLeads()
  }

  async function fetchLeads(): Promise<void> {
    try {
      const response = await fetch('/api/leads')
      if (!response.ok) {
        setError(response.status)
        return
      }
      const data: LeadItem[] = await response.json()
      setLeads(data)
    } catch {
      setError('network')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLeads()
  }, [])

  // ── Computed stats ─────────────────────────────
  const totalLeads = leads.length
  const withEmail = leads.filter((l) => l.email !== null).length
  const scoredLeads = leads.filter((l) => l.audit_score !== null)
  const avgScore =
    scoredLeads.length > 0
      ? Math.round(
          scoredLeads.reduce((sum, l) => sum + (l.audit_score ?? 0), 0) / scoredLeads.length
        )
      : 0
  const convertedCount = leads.filter((l) => l.converted).length
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0

  // ── Filtered + sorted ─────────────────────────
  const processedLeads = useMemo(() => {
    let filtered = leads.filter((l) => {
      const matchesSearch = l.domain.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesConverted =
        filterConverted === 'all'
          ? true
          : filterConverted === 'converted'
            ? l.converted
            : !l.converted
      const matchesMinScore = (l.audit_score ?? 0) >= minScore
      const matchesHasEmail = hasEmail ? l.email !== null : true
      return matchesSearch && matchesConverted && matchesMinScore && matchesHasEmail
    })

    filtered = [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'audit_score') {
        return ((a.audit_score ?? 0) - (b.audit_score ?? 0)) * dir
      }
      if (sortField === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
      }
      // converted
      return (Number(a.converted) - Number(b.converted)) * dir
    })

    return filtered
  }, [leads, searchQuery, sortField, sortDir, filterConverted, minScore, hasEmail])

  function handleSort(field: SortField): void {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function handleExportCSV(): void {
    const csv = leadsToCSV(processedLeads)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
          <p className="text-gray-600">Manage leads captured from the free audit tool.</p>
        </div>
        <LeadsSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
          <p className="text-gray-600">Manage leads captured from the free audit tool.</p>
        </div>
        <ApiError status={error} onRetry={doFetch} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
        <p className="text-gray-600">Manage leads captured from the free audit tool.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-gray-500">Total</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalLeads}</div>
          <div className="text-sm text-gray-600">Total Leads</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AtSign className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium text-gray-500">Contactable</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{withEmail}</div>
          <div className="text-sm text-gray-600">Leads with Email</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            <span className="text-xs font-medium text-gray-500">Average</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgScore}</div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-gray-500">Rate</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{conversionRate}%</div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterConverted}
              onChange={(e) => setFilterConverted(e.target.value as FilterConverted)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Leads</option>
              <option value="converted">Converted</option>
              <option value="not_converted">Not Converted</option>
            </select>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Min Score:</label>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEmail}
                onChange={(e) => setHasEmail(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Has Email</span>
            </label>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Domain</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  <button
                    onClick={() => handleSort('audit_score')}
                    className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                  >
                    <span>Score</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  <button
                    onClick={() => handleSort('converted')}
                    className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                  >
                    <span>Converted</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                  >
                    <span>Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedLeads.map((lead) => {
                const grade = getGrade(lead.audit_score)
                const scoreColor = getScoreColor(lead.audit_score)
                const isExpanded = expandedRow === lead.id

                return (
                  <Fragment key={lead.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(isExpanded ? null : lead.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-900">{lead.domain}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.email ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {/* Score gauge */}
                          <div className="relative w-10 h-10">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="20" cy="20" r="16" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke={scoreColor}
                                strokeWidth="3"
                                strokeDasharray={`${2 * Math.PI * 16}`}
                                strokeDashoffset={`${2 * Math.PI * 16 * (1 - (lead.audit_score ?? 0) / 100)}`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-900">{lead.audit_score ?? '—'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${grade.color}`}>
                          {grade.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.source ?? '—'}</td>
                      <td className="px-6 py-4">
                        {lead.converted ? (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(lead.created_at)}</td>
                      <td className="px-6 py-4">
                        {lead.email && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEmailDialogLead(lead)
                            }}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                            title="Send Follow-Up Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Follow Up</span>
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded audit_results */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <div className="ml-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Audit Details</h4>
                            {Object.keys(lead.audit_results).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(lead.audit_results).map(([key, value]) => (
                                  <div key={key} className="flex items-start space-x-2 text-sm">
                                    <span className="font-medium text-gray-700 min-w-[140px]">
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:
                                    </span>
                                    <span className="text-gray-600">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No audit details available.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {processedLeads.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Email Dialog */}
      {emailDialogLead && (
        <EmailDialog
          lead={emailDialogLead}
          onClose={() => setEmailDialogLead(null)}
          onSent={() => setEmailDialogLead(null)}
        />
      )}
    </div>
  )
}
