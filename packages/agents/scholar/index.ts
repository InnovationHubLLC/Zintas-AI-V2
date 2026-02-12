export {
  createScholarGraph,
  type PrioritizedKeyword,
  type ContentTopic,
  type CompetitorKeywordSet,
  type PracticeProfile,
} from './graph'

import { createScholarGraph } from './graph'
import { createRun, updateRun } from '@packages/db/queries/agent-runs'
import { getClientById } from '@packages/db/queries/clients'
import type { PracticeProfile } from './graph'

interface ScholarResult {
  runId: string
  status: 'completed' | 'failed'
  keywordsFound: number
  contentTopics: number
  error: string | null
}

export async function runScholar(
  clientId: string,
  orgId: string
): Promise<ScholarResult> {
  const run = await createRun({
    org_id: orgId,
    client_id: clientId,
    agent: 'scholar',
    graph_id: null,
    status: 'running',
    trigger: 'manual',
    config: {},
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
      keywordsFound: 0,
      contentTopics: 0,
      error: 'Client not found',
    }
  }

  try {
    const graph = createScholarGraph()
    const result = await graph.invoke({
      clientId,
      orgId,
      runId: run.id,
      practiceProfile: client.practice_profile as PracticeProfile,
      siteUrl: `sc-domain:${client.domain}`,
      gscData: [],
      researchedKeywords: [],
      competitorKeywords: [],
      gapAnalysis: [],
      prioritizedKeywords: [],
      contentTopics: [],
      error: null,
    })

    return {
      runId: run.id,
      status: result.error ? 'failed' : 'completed',
      keywordsFound: result.prioritizedKeywords?.length ?? 0,
      contentTopics: result.contentTopics?.length ?? 0,
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
      keywordsFound: 0,
      contentTopics: 0,
      error: message,
    }
  }
}

export type { ScholarResult }
