import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getClientByOrgId, getKeywordsByClient, getContentByClient } from '@packages/db/queries'
import { supabaseAdmin } from '@packages/db/client'
import { toPlainEnglishWin } from '@packages/plain-english'
import type { AgentAction } from '@packages/db/types'
import type { PlainEnglishWin } from '@packages/plain-english'

interface TrafficDataPoint {
  date: string
  visitors: number
}

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
    const page1 = keywords.filter(
      (k) => k.current_position !== null && k.current_position <= 10
    ).length

    // Aggregate content data
    const content = await getContentByClient(client.id)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const contentPublished = content.filter((c) => c.status === 'published').length
    const contentThisMonth = content.filter(
      (c) => c.published_at && new Date(c.published_at) >= thirtyDaysAgo
    ).length

    // Fetch recent wins from agent_actions (deployed, last 30 days)
    const { data: actions } = await supabaseAdmin
      .from('agent_actions')
      .select('*')
      .eq('client_id', client.id)
      .eq('status', 'deployed')
      .gte('deployed_at', thirtyDaysAgo.toISOString())
      .order('deployed_at', { ascending: false })
      .limit(10)

    const wins: PlainEnglishWin[] = (actions as AgentAction[] | null)?.map(
      (action) => toPlainEnglishWin(action)
    ) ?? []

    // Traffic chart data (from stored GSC snapshots or empty)
    const trafficChart: TrafficDataPoint[] = buildTrafficChart(client.id)

    return NextResponse.json({
      client: {
        name: client.name,
        domain: client.domain,
      },
      kpis: {
        healthScore: client.health_score,
        keywordCount,
        keywordsRanked,
        rankingsImproving,
        page1,
        contentPublished,
        contentThisMonth,
        pendingActions: 0,
      },
      wins,
      trafficChart,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}

function buildTrafficChart(_clientId: string): TrafficDataPoint[] {
  // In production, this queries stored GSC snapshots
  // For now, return empty array — UI handles empty state
  return []
}
