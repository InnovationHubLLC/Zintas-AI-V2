import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { bulkApprove } from '@packages/db/queries'

const BulkApproveSchema = z.object({
  actionIds: z.array(z.string().uuid()).min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const body = BulkApproveSchema.parse(await request.json())
    const items = await bulkApprove(body.actionIds, authResult.userId)

    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to bulk approve' }, { status: 500 })
  }
}
