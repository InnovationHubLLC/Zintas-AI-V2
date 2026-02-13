import { createConductorGraph, ConductorState } from './graph'
import type { ConductorResult, ContentTopic } from './graph'
import { createRun } from '@packages/db/queries/agent-runs'

/**
 * Run the Conductor pipeline for a given client.
 * Orchestrates: Health Check → Scholar → Ghostwriter → Finalize
 */
export async function runConductor(
  clientId: string,
  orgId: string
): Promise<ConductorResult> {
  // Create the run record
  const run = await createRun({
    org_id: orgId,
    client_id: clientId,
    agent: 'conductor',
    graph_id: 'conductor-v1',
    status: 'running',
    trigger: 'manual',
    config: {},
    result: {},
    error: null,
    completed_at: null,
    checkpoint_data: {},
  })

  const graph = createConductorGraph()

  const initialState: typeof ConductorState.State = {
    clientId,
    orgId,
    runId: run.id,
    stage: 'init',
    scholarRunId: null,
    scholarKeywords: 0,
    scholarTopics: null,
    ghostwriterResults: [],
    error: null,
  }

  const finalState = await graph.invoke(initialState)

  return {
    runId: run.id,
    status: finalState.error ? 'failed' : 'completed',
    scholarKeywords: finalState.scholarKeywords ?? 0,
    contentPiecesGenerated: finalState.ghostwriterResults?.length ?? 0,
    error: finalState.error ?? null,
  }
}

export { createConductorGraph, ConductorState } from './graph'
export type { ConductorResult, ContentTopic } from './graph'
