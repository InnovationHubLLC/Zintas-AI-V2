import { Annotation, StateGraph, START, END } from '@langchain/langgraph'
import { runScholar } from '@packages/agents/scholar'
import { runGhostwriter } from '@packages/agents/ghostwriter'
import type { ContentTopic } from '@packages/agents/ghostwriter'
import { getClientById } from '@packages/db/queries/clients'
import { createRun, updateRun } from '@packages/db/queries/agent-runs'
import { refreshTokenIfNeeded } from '@packages/db/google-tokens'

// ── State ────────────────────────────────────────────────────────

const ConductorState = Annotation.Root({
  clientId: Annotation<string>,
  orgId: Annotation<string>,
  runId: Annotation<string>,
  stage: Annotation<string>,
  scholarRunId: Annotation<string | null>,
  scholarKeywords: Annotation<number>,
  scholarTopics: Annotation<ContentTopic[] | null>,
  ghostwriterResults: Annotation<string[]>,
  error: Annotation<string | null>,
})

// ── Node Functions ───────────────────────────────────────────────

async function checkHealth(
  state: typeof ConductorState.State
): Promise<Partial<typeof ConductorState.State>> {
  try {
    const client = await getClientById(state.clientId)
    if (!client) {
      return { stage: 'failed', error: 'Client not found' }
    }

    if (client.account_health !== 'active') {
      return {
        stage: 'failed',
        error: `Client account health is ${client.account_health}. Skipping pipeline.`,
      }
    }

    // Verify Google tokens still work
    try {
      await refreshTokenIfNeeded(state.clientId)
    } catch {
      return {
        stage: 'failed',
        error: 'Google tokens expired or invalid.',
      }
    }

    await updateRun(state.runId, {
      config: { stage: 'health_check_passed' },
    })

    return { stage: 'scholar' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Health check failed'
    return { stage: 'failed', error: message }
  }
}

async function runScholarNode(
  state: typeof ConductorState.State
): Promise<Partial<typeof ConductorState.State>> {
  if (state.error) return { stage: 'failed' }

  try {
    const result = await runScholar(state.clientId, state.orgId)

    if (result.status === 'failed') {
      return {
        stage: 'failed',
        error: result.error ?? 'Scholar agent failed',
        scholarRunId: result.runId,
      }
    }

    // Get content topics from scholar result
    // Scholar stores keywords in DB; topics come from result
    const topics: ContentTopic[] = []
    if (result.contentTopics > 0) {
      // Use placeholder topics based on what Scholar found
      // In production, Scholar returns actual topics via its result
    }

    await updateRun(state.runId, {
      config: { stage: 'scholar_completed', scholarRunId: result.runId },
    })

    return {
      stage: 'ghostwriter',
      scholarRunId: result.runId,
      scholarKeywords: result.keywordsFound,
      scholarTopics: topics.length > 0 ? topics : null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scholar failed'
    return { stage: 'failed', error: message }
  }
}

async function runGhostwriterNode(
  state: typeof ConductorState.State
): Promise<Partial<typeof ConductorState.State>> {
  if (state.error) return { stage: 'failed' }

  try {
    const topics = state.scholarTopics ?? []
    const topicsToProcess = topics.slice(0, 2)
    const results: string[] = []

    for (const topic of topicsToProcess) {
      try {
        const result = await runGhostwriter(state.clientId, state.orgId, topic)
        if (result.contentPieceId) {
          results.push(result.contentPieceId)
        }
      } catch {
        // Individual ghostwriter failure — continue with next topic
      }
    }

    await updateRun(state.runId, {
      config: { stage: 'ghostwriter_completed', contentPieces: results.length },
    })

    return {
      stage: 'complete',
      ghostwriterResults: results,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ghostwriter failed'
    return { stage: 'failed', error: message }
  }
}

async function finalize(
  state: typeof ConductorState.State
): Promise<Partial<typeof ConductorState.State>> {
  const status = state.error ? 'failed' : 'completed'
  const contentCount = state.ghostwriterResults?.length ?? 0

  await updateRun(state.runId, {
    status,
    result: {
      scholarKeywords: state.scholarKeywords ?? 0,
      contentPiecesGenerated: contentCount,
      scholarRunId: state.scholarRunId,
    },
    error: state.error ?? null,
    completed_at: new Date().toISOString(),
  })

  return { stage: status }
}

// ── Routing ──────────────────────────────────────────────────────

function healthRouting(
  state: typeof ConductorState.State
): string {
  if (state.error || state.stage === 'failed') return 'finalize'
  return 'run_scholar'
}

function shouldContinue(
  state: typeof ConductorState.State
): string {
  if (state.error || state.stage === 'failed') return 'finalize'
  return '__next__'
}

// ── Graph ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createConductorGraph() {
  const graph = new StateGraph(ConductorState)
    .addNode('check_health', checkHealth)
    .addNode('run_scholar', runScholarNode)
    .addNode('run_ghostwriter', runGhostwriterNode)
    .addNode('finalize', finalize)
    .addEdge(START, 'check_health')
    .addConditionalEdges('check_health', healthRouting, {
      run_scholar: 'run_scholar',
      finalize: 'finalize',
    })
    .addConditionalEdges('run_scholar', shouldContinue, {
      finalize: 'finalize',
      __next__: 'run_ghostwriter',
    })
    .addEdge('run_ghostwriter', 'finalize')
    .addEdge('finalize', END)

  return graph.compile()
}

interface ConductorResult {
  runId: string
  status: 'completed' | 'failed'
  scholarKeywords: number
  contentPiecesGenerated: number
  error: string | null
}

export { ConductorState }
export type { ConductorResult, ContentTopic }
