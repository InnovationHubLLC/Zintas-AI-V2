import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from '@packages/db/types'
import { supabaseServer, supabaseAdmin } from '@packages/db/client'

/**
 * Get a client by their organization ID.
 * Uses RLS - filtered by JWT org_id claim.
 */
export async function getClientByOrgId(orgId: string): Promise<Client | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Failed to get client by org_id: ${error.message}`)
  }

  return data as Client
}

/**
 * Get a client by their ID.
 * Uses RLS - filtered by JWT org_id claim.
 */
export async function getClientById(clientId: string): Promise<Client | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Failed to get client by id: ${error.message}`)
  }

  return data as Client
}

/**
 * Get a client by their domain (cross-org uniqueness check).
 * Uses admin client to bypass RLS — needed to check if domain is already registered.
 */
export async function getClientByDomain(domain: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('domain', domain)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Failed to get client by domain: ${error.message}`)
  }

  return data as Client
}

/**
 * Get all clients (admin operation).
 * Bypasses RLS - use only for agent/server operations.
 */
export async function getAllClients(): Promise<Client[]> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get all clients: ${error.message}`)
  }

  return (data as Client[]) || []
}

/**
 * Create a new client.
 * Uses RLS - org_id must match JWT claim.
 */
export async function createClient(
  data: CreateClientInput
): Promise<Client> {
  const supabase = supabaseServer()
  const { data: client, error } = await supabase
    .from('clients')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`)
  }

  return client as Client
}

/**
 * Update an existing client.
 * Uses RLS - org_id must match JWT claim.
 */
export async function updateClient(
  clientId: string,
  data: UpdateClientInput
): Promise<Client> {
  const supabase = supabaseServer()
  const { data: client, error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', clientId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`)
  }

  return client as Client
}

/**
 * Update a client's health score.
 * Uses RLS - org_id must match JWT claim.
 */
export async function updateClientHealth(
  clientId: string,
  score: number
): Promise<void> {
  const supabase = supabaseServer()
  const { error } = await supabase
    .from('clients')
    .update({ health_score: score })
    .eq('id', clientId)

  if (error) {
    throw new Error(`Failed to update client health: ${error.message}`)
  }
}
