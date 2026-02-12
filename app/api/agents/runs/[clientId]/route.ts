import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getRunsByClient } from '@packages/db/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { clientId } = await params
    const runs = await getRunsByClient(clientId)

    return NextResponse.json(runs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch agent runs' }, { status: 500 })
  }
}
