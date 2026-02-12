import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getKeywordsByClient } from '@packages/db/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { clientId } = await params
    const keywords = await getKeywordsByClient(clientId)

    return NextResponse.json(keywords)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
  }
}
