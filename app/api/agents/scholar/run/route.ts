import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAgentKey } from '@/lib/auth-helpers'

const ScholarRunSchema = z.object({
  clientId: z.string().uuid(),
  keywords: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAgentKey(request)
  if (authError) return authError

  try {
    const body = ScholarRunSchema.parse(await request.json())

    // TODO: Run Scholar agent via LangGraph (TASK-21)
    return NextResponse.json({
      status: 'accepted',
      clientId: body.clientId,
      keywordCount: body.keywords.length,
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Scholar agent failed' }, { status: 500 })
  }
}
