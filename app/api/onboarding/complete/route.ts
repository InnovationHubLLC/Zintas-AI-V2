import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getClientByOrgId, updateClient } from '@packages/db/queries'

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    if (!authResult.orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    await updateClient(client.id, {
      onboarding_completed_at: new Date().toISOString(),
    })

    // TODO: Trigger Conductor agent for initial analysis (TASK-34)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }
}
