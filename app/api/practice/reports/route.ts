import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import {
  getClientByOrgId,
  getKeywordTrends,
  getKeywordsByClient,
  getContentByClient,
} from '@packages/db/queries'

interface TrafficDataPoint {
  date: string
  visitors: number
}

interface RankingsChartItem {
  range: string
  count: number
  color: string
}

interface ContentPerformanceItem {
  id: string
  title: string
  content_type: string
  published_at: string | null
  target_keyword: string | null
  word_count: number
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    const [trends, keywords, content] = await Promise.all([
      getKeywordTrends(client.id),
      getKeywordsByClient(client.id),
      getContentByClient(client.id),
    ])

    // Metrics
    const rankingsImproving = trends.filter((t) => t.change !== null && t.change > 0).length
    const page1 = keywords.filter(
      (k) => k.current_position !== null && k.current_position <= 10
    ).length
    const contentPublished = content.filter((c) => c.status === 'published').length

    // Rankings chart: group by position range
    const page1Count = keywords.filter(
      (k) => k.current_position !== null && k.current_position <= 10
    ).length
    const page2Count = keywords.filter(
      (k) => k.current_position !== null && k.current_position > 10 && k.current_position <= 20
    ).length
    const page3PlusCount = keywords.filter(
      (k) => k.current_position !== null && k.current_position > 20
    ).length

    const rankingsChart: RankingsChartItem[] = [
      { range: 'Page 1 (1-10)', count: page1Count, color: '#22C55E' },
      { range: 'Page 2 (11-20)', count: page2Count, color: '#EAB308' },
      { range: 'Page 3+ (21+)', count: page3PlusCount, color: '#9CA3AF' },
    ]

    // Content performance: published content sorted by word count as proxy
    const contentPerformance: ContentPerformanceItem[] = content
      .filter((c) => c.status === 'published')
      .map((c) => ({
        id: c.id,
        title: c.title,
        content_type: c.content_type,
        published_at: c.published_at,
        target_keyword: c.target_keyword,
        word_count: c.word_count,
      }))

    // Traffic chart: from GSC snapshots or empty
    const trafficChart: TrafficDataPoint[] = []

    return NextResponse.json({
      metrics: {
        totalKeywords: keywords.length,
        rankingsImproving,
        page1,
        contentPublished,
        totalContent: content.length,
      },
      trafficChart,
      rankingsChart,
      keywordTrends: trends,
      contentPerformance,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}
