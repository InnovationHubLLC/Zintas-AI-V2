import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { runScholar } from '@packages/agents/scholar'
import { runConductor } from '@packages/agents/conductor'
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

    if (body.agentName === 'scholar') {
      const result = await runScholar(body.clientId, authResult.orgId)

      return NextResponse.json({
        runId: result.runId,
        agent: 'scholar',
        status: result.status,
        keywordsFound: result.keywordsFound,
        contentTopics: result.contentTopics,
      }, { status: 202 })
    }

    if (body.agentName === 'conductor') {
      const result = await runConductor(body.clientId, authResult.orgId)

      return NextResponse.json({
        runId: result.runId,
        agent: 'conductor',
        status: result.status,
        scholarKeywords: result.scholarKeywords,
        contentPiecesGenerated: result.contentPiecesGenerated,
      }, { status: 202 })
    }

    // For other agents, create a run record (dispatch implemented in future tasks)
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

    return NextResponse.json({
      runId: run.id,
      agent: body.agentName,
      status: 'running',
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to start agent run' }, { status: 500 })
  }
}
