import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAgentKey } from '@/lib/auth-helpers'

const ConductorRunSchema = z.object({
  clientId: z.string().uuid(),
  trigger: z.enum(['scheduled', 'manual', 'webhook']),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAgentKey(request)
  if (authError) return authError

  try {
    const body = ConductorRunSchema.parse(await request.json())

    // TODO: Run Conductor orchestrator via LangGraph (TASK-20)
    return NextResponse.json({
      status: 'accepted',
      clientId: body.clientId,
      trigger: body.trigger,
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Conductor agent failed' }, { status: 500 })
  }
}
