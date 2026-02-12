import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { createRun } from '@packages/db/queries'

const RunAgentSchema = z.object({
  clientId: z.string().uuid(),
  agentName: z.enum(['conductor', 'scholar', 'ghostwriter', 'analyst']),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const body = RunAgentSchema.parse(await request.json())

    // TODO: Dispatch to LangGraph agent (TASK-20)
    const run = await createRun({
      org_id: authResult.orgId,
      client_id: body.clientId,
      agent: body.agentName,
      graph_id: null,
      status: 'running',
      trigger: 'manual',
      config: {},
      result: {},
      error: null,
      completed_at: null,
      checkpoint_data: {},
    })

    return NextResponse.json(run, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to start agent run' }, { status: 500 })
  }
}
