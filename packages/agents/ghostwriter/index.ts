export {
  createGhostwriterGraph,
  type ContentBrief,
  type GeneratedContent,
  type ContentTopic,
  type PracticeProfile,
} from './graph'

import { createGhostwriterGraph } from './graph'
import type { ContentTopic, PracticeProfile } from './graph'
import { createRun, updateRun } from '@packages/db/queries/agent-runs'
import { getClientById } from '@packages/db/queries/clients'

interface GhostwriterResult {
  runId: string
  status: 'completed' | 'failed'
  contentPieceId: string | null
  seoScore: number
  complianceStatus: string | null
  error: string | null
}

export async function runGhostwriter(
  clientId: string,
  orgId: string,
  topic: ContentTopic
): Promise<GhostwriterResult> {
  const run = await createRun({
    org_id: orgId,
    client_id: clientId,
    agent: 'ghostwriter',
    graph_id: null,
    status: 'running',
    trigger: 'manual',
    config: { topic },
    result: {},
    error: null,
    completed_at: null,
    checkpoint_data: {},
  })

  const client = await getClientById(clientId)
  if (!client) {
    await updateRun(run.id, {
      status: 'failed',
      error: 'Client not found',
      completed_at: new Date().toISOString(),
    })
    return {
      runId: run.id,
      status: 'failed',
      contentPieceId: null,
      seoScore: 0,
      complianceStatus: null,
      error: 'Client not found',
    }
  }

  try {
    const graph = createGhostwriterGraph()
    const result = await graph.invoke({
      clientId,
      orgId,
      runId: run.id,
      practiceProfile: client.practice_profile as PracticeProfile,
      topic,
      brief: null,
      content: null,
      metaTitle: null,
      metaDescription: null,
      seoScore: 0,
      complianceResult: null,
      contentPieceId: null,
      queueItemId: null,
      rewriteAttempts: 0,
      error: null,
    })

    return {
      runId: run.id,
      status: result.error ? 'failed' : 'completed',
      contentPieceId: result.contentPieceId ?? null,
      seoScore: result.seoScore ?? 0,
      complianceStatus: result.complianceResult?.status ?? null,
      error: result.error ?? null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await updateRun(run.id, {
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    })
    return {
      runId: run.id,
      status: 'failed',
      contentPieceId: null,
      seoScore: 0,
      complianceStatus: null,
      error: message,
    }
  }
}

export type { GhostwriterResult }
