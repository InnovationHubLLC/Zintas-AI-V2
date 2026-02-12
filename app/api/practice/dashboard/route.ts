import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getClientByOrgId } from '@packages/db/queries'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    // TODO: Aggregate KPI data from keywords, content, agent_actions (TASK-34)
    return NextResponse.json({
      client,
      kpis: {
        healthScore: client.health_score,
        contentCount: 0,
        keywordCount: 0,
        pendingActions: 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
