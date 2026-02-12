'use client'

import { useState, useMemo } from 'react'
import { Search, FileText, Calendar, Eye, ThumbsUp, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react'

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

const mockContent = [
  {
    id: 1,
    title: '10 Signs You Need a Dental Crown',
    type: 'blog',
    status: 'published',
    publishedDate: '2025-02-08T10:00:00Z',
    views: 342,
    engagement: 28,
    thumbnail: 'https://images.pexels.com/photos/3845653/pexels-photo-3845653.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    title: 'The Complete Guide to Teeth Whitening',
    type: 'blog',
    status: 'published',
    publishedDate: '2025-02-05T14:30:00Z',
    views: 521,
    engagement: 45,
    thumbnail: 'https://images.pexels.com/photos/3762453/pexels-photo-3762453.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    title: 'Dental Implants vs. Dentures: Which is Right for You?',
    type: 'blog',
    status: 'in_review',
    publishedDate: '2025-02-10T09:00:00Z',
    views: 0,
    engagement: 0,
    thumbnail: 'https://images.pexels.com/photos/6528928/pexels-photo-6528928.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 4,
    title: 'How to Maintain Your Oral Health After 50',
    type: 'blog',
    status: 'published',
    publishedDate: '2025-02-01T11:15:00Z',
    views: 687,
    engagement: 52,
    thumbnail: 'https://images.pexels.com/photos/5355919/pexels-photo-5355919.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 5,
    title: 'Understanding Root Canal Treatment',
    type: 'blog',
    status: 'draft',
    publishedDate: '2025-02-12T08:00:00Z',
    views: 0,
    engagement: 0,
    thumbnail: 'https://images.pexels.com/photos/3845653/pexels-photo-3845653.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 6,
    title: 'Top 5 Foods That Strengthen Your Teeth',
    type: 'blog',
    status: 'published',
    publishedDate: '2025-01-28T15:45:00Z',
    views: 893,
    engagement: 67,
    thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
]

type FilterType = 'all' | 'published' | 'in_review' | 'draft'

export default function ContentLibrary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredContent = useMemo(() => {
    return mockContent.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = activeFilter === 'all' ? true : item.status === activeFilter
      return matchesSearch && matchesFilter
    })
  }, [searchQuery, activeFilter])

  const statusConfig = {
    published: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Published' },
    in_review: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'In Review' },
    draft: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Draft' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Library</h1>
        <p className="text-gray-600">Manage your blog posts, articles, and marketing content.</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
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
                {filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredContent.map((item) => {
          const StatusIcon = statusConfig[item.status as keyof typeof statusConfig].icon
          const statusInfo = statusConfig[item.status as keyof typeof statusConfig]

          return (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <div className={`flex items-center space-x-1 px-3 py-1 ${statusInfo.bg} rounded-full backdrop-blur-sm`}>
                    <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                    <span className={`text-xs font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatRelativeTime(item.publishedDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span className="capitalize">{item.type}</span>
                  </div>
                </div>

                {item.status === 'published' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span>{item.views}</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{item.engagement}</span>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                )}

                {item.status !== 'published' && (
                  <div className="pt-4 border-t border-gray-100">
                    <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                      {item.status === 'in_review' ? 'Review Content' : 'Continue Editing'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredContent.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
