import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { populatePracticeProfile } from '@packages/agents/practice-intelligence'

const PopulateSchema = z.object({
  clientId: z.string().uuid(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const body = PopulateSchema.parse(await request.json())
    const profile = await populatePracticeProfile(body.clientId)

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to populate practice profile' },
      { status: 500 }
    )
  }
}
