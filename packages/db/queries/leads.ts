import type {
  Lead,
  CreateLeadInput,
} from '@packages/db/types'
import { supabaseAdmin } from '@packages/db/client'

interface LeadFilters {
  converted?: boolean
  minScore?: number
}

/**
 * Create a new lead from the free audit tool.
 * Uses supabaseAdmin — leads table has no RLS.
 */
export async function createLead(
  data: CreateLeadInput
): Promise<Lead> {
  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`)
  }

  return lead as Lead
}

/**
 * Get a lead by its ID.
 * Uses supabaseAdmin — leads table has no RLS.
 */
export async function getLeadById(
  leadId: string
): Promise<Lead | null> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get lead: ${error.message}`)
  }

  return data as Lead
}

/**
 * Get leads with optional filters.
 * Uses supabaseAdmin — leads table has no RLS.
 */
export async function getLeads(
  filters?: LeadFilters
): Promise<Lead[]> {
  let query = supabaseAdmin.from('leads').select('*')

  if (filters?.converted !== undefined) {
    query = query.eq('converted', filters.converted)
  }
  if (filters?.minScore !== undefined) {
    query = query.gte('audit_score', filters.minScore)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get leads: ${error.message}`)
  }

  return (data as Lead[]) || []
}

/**
 * Mark a lead as converted.
 * Uses supabaseAdmin — leads table has no RLS.
 */
export async function markLeadConverted(
  leadId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('leads')
    .update({
      converted: true,
      converted_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (error) {
    throw new Error(`Failed to mark lead converted: ${error.message}`)
  }
}
