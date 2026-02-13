'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, FileText, Calendar, Filter, CheckCircle, Clock, AlertCircle, Grid3X3, List, Tag, ExternalLink } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────

interface ContentItem {
  id: string
  title: string
  content_type: string
  status: string
  published_at: string | null
  created_at: string
  word_count: number
  target_keyword: string | null
  published_url: string | null
  html_body: string | null
}

type FilterType = 'all' | 'published' | 'in_review' | 'draft'
type ViewMode = 'grid' | 'list'

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

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  published: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Published' },
  approved: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Approved' },
  in_review: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'In Review' },
  draft: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Draft' },
  rejected: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
}

// ── Skeleton ─────────────────────────────────────────────────────

function ContentSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-20 h-6 bg-gray-200 rounded-full" />
            <div className="w-16 h-5 bg-gray-200 rounded" />
          </div>
          <div className="w-3/4 h-5 bg-gray-200 rounded mb-3" />
          <div className="w-1/2 h-4 bg-gray-200 rounded mb-4" />
          <div className="flex justify-between">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────

export default function ContentLibrary(): React.ReactElement {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    async function fetchContent(): Promise<void> {
      try {
        const response = await fetch('/api/practice/content')
        if (response.ok) {
          const data: ContentItem[] = await response.json()
          setItems(data)
        }
      } catch {
        // Failed to load
      } finally {
        setLoading(false)
      }
    }

    void fetchContent()
  }, [])

  const filteredContent = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter =
        activeFilter === 'all' ||
        item.status === activeFilter ||
        (activeFilter === 'in_review' && item.status === 'in_review')
      return matchesSearch && matchesFilter
    })
  }, [items, searchQuery, activeFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Library</h1>
        <p className="text-gray-600">Manage your blog posts, articles, and marketing content.</p>
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {(['all', 'published', 'in_review', 'draft'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'all'
                  ? 'All'
                  : filter.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              title="Grid view"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && <ContentSkeleton />}

      {/* Content Grid */}
      {!loading && viewMode === 'grid' && filteredContent.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContent.map((item) => {
            const statusInfo = statusConfig[item.status] ?? statusConfig.draft

            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center space-x-1 px-3 py-1 ${statusInfo.bg} rounded-full`}>
                      <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                      <span className={`text-xs font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 capitalize">
                      {item.content_type.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  {item.target_keyword && (
                    <div className="flex items-center space-x-1 mb-3">
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">{item.target_keyword}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatRelativeTime(item.published_at ?? item.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{item.word_count} words</span>
                    </div>
                  </div>

                  {item.published_url && (
                    <a
                      href={item.published_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View published</span>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Content List */}
      {!loading && viewMode === 'list' && filteredContent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Title</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Type</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Keyword</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Words</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((item) => {
                const statusInfo = statusConfig[item.status] ?? statusConfig.draft

                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600 capitalize">
                      {item.content_type.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 ${statusInfo.bg} rounded-full`}>
                        <statusInfo.icon className={`w-3 h-3 ${statusInfo.color}`} />
                        <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">
                      {item.target_keyword ?? '-'}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">{item.word_count}</td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">
                      {formatRelativeTime(item.published_at ?? item.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredContent.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {items.length === 0 ? 'No content yet' : 'No content found'}
          </h3>
          <p className="text-gray-600">
            {items.length === 0
              ? 'Content will appear here as Zintas creates it for your practice. Get started!'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      )}
    </div>
  )
}
