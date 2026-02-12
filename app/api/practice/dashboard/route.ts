import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getClientByOrgId, getKeywordsByClient } from '@packages/db/queries'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    // Aggregate keyword data
    const keywords = await getKeywordsByClient(client.id)
    const keywordCount = keywords.length
    const keywordsRanked = keywords.filter((k) => k.current_position !== null).length
    const rankingsImproving = keywords.filter(
      (k) =>
        k.current_position !== null &&
        k.previous_position !== null &&
        k.current_position < k.previous_position
    ).length

    return NextResponse.json({
      client,
      kpis: {
        healthScore: client.health_score,
        keywordCount,
        keywordsRanked,
        rankingsImproving,
        contentCount: 0,
        pendingActions: 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
