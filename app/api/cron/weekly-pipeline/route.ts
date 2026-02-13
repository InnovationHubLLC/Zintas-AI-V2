import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@packages/db/client'
import { runConductor } from '@packages/agents/conductor'
import type { Client } from '@packages/db/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query all active clients
    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('account_health', 'active')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to query clients' },
        { status: 500 }
      )
    }

    const activeClients = (clients as Client[]) ?? []
    const results: { clientId: string; status: string }[] = []

    // Run conductor for each active client
    for (const client of activeClients) {
      try {
        const result = await runConductor(client.id, client.org_id)
        results.push({ clientId: client.id, status: result.status })
      } catch {
        results.push({ clientId: client.id, status: 'error' })
      }
    }

    return NextResponse.json({
      triggered: activeClients.length,
      results,
    })
  } catch {
    return NextResponse.json(
      { error: 'Weekly pipeline failed' },
      { status: 500 }
    )
  }
}
