import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getQueueItems } from '@packages/db/queries'
import type { ActionStatus, Severity } from '@packages/db/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const searchParams = request.nextUrl.searchParams
    const items = await getQueueItems({
      clientId: searchParams.get('clientId') || undefined,
      status: (searchParams.get('status') as ActionStatus) || undefined,
      severity: (searchParams.get('severity') as Severity) || undefined,
      actionType: searchParams.get('actionType') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    })

    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }
}
