import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getClientByOrgId, getKeywordTrends, getContentByClient } from '@packages/db/queries'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    const [trends, content] = await Promise.all([
      getKeywordTrends(client.id),
      getContentByClient(client.id),
    ])

    return NextResponse.json({
      keywordTrends: trends,
      contentCount: content.length,
      publishedCount: content.filter((c) => c.status === 'published').length,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}
