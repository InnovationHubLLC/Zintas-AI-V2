import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getKeywordsByClient } from '@packages/db/queries'
import type { Keyword } from '@packages/db/types'

type SortField = 'search_volume' | 'difficulty' | 'position' | 'keyword'

function sortKeywords(
  keywords: Keyword[],
  sort: SortField,
  order: 'asc' | 'desc'
): Keyword[] {
  return [...keywords].sort((a, b) => {
    let comparison = 0

    switch (sort) {
      case 'search_volume':
        comparison = a.search_volume - b.search_volume
        break
      case 'difficulty':
        comparison = a.difficulty - b.difficulty
        break
      case 'position':
        comparison = (a.current_position ?? 999) - (b.current_position ?? 999)
        break
      case 'keyword':
        comparison = a.keyword.localeCompare(b.keyword)
        break
    }

    return order === 'desc' ? -comparison : comparison
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { clientId } = await params
    const searchParams = request.nextUrl.searchParams

    // Parse query params
    const type = searchParams.get('type') ?? undefined
    const sort = (searchParams.get('sort') ?? 'search_volume') as SortField
    const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))

    // Fetch keywords (with optional type filter)
    const keywords = await getKeywordsByClient(clientId, type)

    // Sort
    const sorted = sortKeywords(keywords, sort, order)

    // Paginate
    const total = sorted.length
    const offset = (page - 1) * limit
    const paginated = sorted.slice(offset, offset + limit)

    return NextResponse.json({
      keywords: paginated,
      total,
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
  }
}
