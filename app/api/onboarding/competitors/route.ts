import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'

const CompetitorsSchema = z.object({
  domain: z.string().min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = CompetitorsSchema.parse(await request.json())

    // TODO: Use SE Ranking or Google search to find competitors (TASK-19)
    return NextResponse.json({
      competitors: [],
      domain: body.domain,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to find competitors' }, { status: 500 })
  }
}
