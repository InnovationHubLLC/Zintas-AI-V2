import type {
  AgentAction,
  ActionStatus,
  Severity,
} from '@packages/db/types'
import { supabaseServer, supabaseAdmin } from '@packages/db/client'

export interface QueueFilters {
  clientId?: string
  status?: ActionStatus
  severity?: Severity
  actionType?: string
  limit?: number
  offset?: number
}

/**
 * Get queue items with optional filters.
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getQueueItems(
  filters: QueueFilters
): Promise<AgentAction[]> {
  const supabase = supabaseServer()
  let query = supabase.from('agent_actions').select('*')

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity)
  }
  if (filters.actionType) {
    query = query.eq('action_type', filters.actionType)
  }

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 25

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get queue items: ${error.message}`)
  }

  return (data as AgentAction[]) || []
}

/**
 * Get a single queue item by ID.
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getQueueItemById(
  actionId: string
): Promise<AgentAction | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('id', actionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get queue item: ${error.message}`)
  }

  return data as AgentAction
}

/**
 * Approve a queue item.
 * Uses RLS — org_id must match JWT claim.
 */
export async function approveQueueItem(
  actionId: string,
  approvedBy: string
): Promise<AgentAction> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('agent_actions')
    .update({
      status: 'approved' as const,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', actionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to approve queue item: ${error.message}`)
  }

  return data as AgentAction
}

/**
 * Reject a queue item.
 * Uses RLS — org_id must match JWT claim.
 */
export async function rejectQueueItem(
  actionId: string
): Promise<AgentAction> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('agent_actions')
    .update({ status: 'rejected' as const })
    .eq('id', actionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to reject queue item: ${error.message}`)
  }

  return data as AgentAction
}

/**
 * Bulk approve multiple queue items.
 * Uses RLS — org_id must match JWT claim.
 */
export async function bulkApprove(
  actionIds: string[],
  approvedBy: string
): Promise<AgentAction[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('agent_actions')
    .update({
      status: 'approved' as const,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .in('id', actionIds)
    .select()

  if (error) {
    throw new Error(`Failed to bulk approve queue items: ${error.message}`)
  }

  return (data as AgentAction[]) || []
}

/**
 * Get count of pending queue items.
 * Uses supabaseAdmin — cross-org count for manager dashboard.
 */
export async function getPendingCount(
  orgId?: string
): Promise<number> {
  let query = supabaseAdmin
    .from('agent_actions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`Failed to get pending count: ${error.message}`)
  }

  return count ?? 0
}
