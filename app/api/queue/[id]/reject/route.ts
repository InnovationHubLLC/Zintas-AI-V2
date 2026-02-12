import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import {
  getQueueItemById,
  rejectQueueItem,
  updateContent,
} from '@packages/db/queries'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params

    const item = await getQueueItemById(id)
    if (!item) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 })
    }

    if (item.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending items can be rejected' },
        { status: 400 }
      )
    }

    const rejected = await rejectQueueItem(id)

    if (item.content_piece_id) {
      await updateContent(item.content_piece_id, {
        status: 'rejected',
      })
    }

    return NextResponse.json(rejected)
  } catch {
    return NextResponse.json(
      { error: 'Failed to reject item' },
      { status: 500 }
    )
  }
}
