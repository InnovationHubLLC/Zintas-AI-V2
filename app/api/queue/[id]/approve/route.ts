import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { approveQueueItem } from '@packages/db/queries'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params
    const item = await approveQueueItem(id, authResult.userId)

    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Failed to approve item' }, { status: 500 })
  }
}
