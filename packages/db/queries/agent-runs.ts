import type {
  AgentRun,
  CreateAgentRunInput,
  UpdateAgentRunInput,
} from '@packages/db/types'
import { supabaseServer, supabaseAdmin } from '@packages/db/client'

/**
 * Create a new agent run.
 * Uses supabaseAdmin — agents create their own runs server-side.
 */
export async function createRun(
  data: CreateAgentRunInput
): Promise<AgentRun> {
  const { data: run, error } = await supabaseAdmin
    .from('agent_runs')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create agent run: ${error.message}`)
  }

  return run as AgentRun
}

/**
 * Update an agent run.
 * Uses supabaseAdmin — agents update their own runs server-side.
 */
export async function updateRun(
  runId: string,
  data: UpdateAgentRunInput
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('agent_runs')
    .update(data)
    .eq('id', runId)

  if (error) {
    throw new Error(`Failed to update agent run: ${error.message}`)
  }
}

/**
 * Get all runs for a client.
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getRunsByClient(
  clientId: string
): Promise<AgentRun[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('client_id', clientId)
    .order('started_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get runs by client: ${error.message}`)
  }

  return (data as AgentRun[]) || []
}

/**
 * Get all currently running agent runs across all orgs.
 * Uses supabaseAdmin — cross-org, for monitoring.
 */
export async function getActiveRuns(): Promise<AgentRun[]> {
  const { data, error } = await supabaseAdmin
    .from('agent_runs')
    .select('*')
    .eq('status', 'running')
    .order('started_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get active runs: ${error.message}`)
  }

  return (data as AgentRun[]) || []
}
