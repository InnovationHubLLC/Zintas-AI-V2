import type {
  Keyword,
  CreateKeywordInput,
} from '@packages/db/types'
import { supabaseServer } from '@packages/db/client'

export interface KeywordTrend {
  keyword: string
  current_position: number | null
  previous_position: number | null
  change: number | null
  search_volume: number
}

/**
 * Get all keywords for a client, optionally filtered by type.
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getKeywordsByClient(
  clientId: string,
  type?: string
): Promise<Keyword[]> {
  const supabase = supabaseServer()
  let query = supabase
    .from('keywords')
    .select('*')
    .eq('client_id', clientId)

  if (type) {
    query = query.eq('keyword_type', type)
  }

  const { data, error } = await query.order('search_volume', { ascending: false })

  if (error) {
    throw new Error(`Failed to get keywords by client: ${error.message}`)
  }

  return (data as Keyword[]) || []
}

/**
 * Upsert a single keyword.
 * Uses RLS — org_id must match JWT claim.
 * Note: Requires UNIQUE(client_id, keyword) constraint in the DB.
 */
export async function upsertKeyword(
  data: CreateKeywordInput
): Promise<Keyword> {
  const supabase = supabaseServer()
  const { data: keyword, error } = await supabase
    .from('keywords')
    .upsert(data, { onConflict: 'client_id,keyword' })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to upsert keyword: ${error.message}`)
  }

  return keyword as Keyword
}

/**
 * Bulk upsert keywords for a client.
 * Uses RLS — org_id must match JWT claim.
 */
export async function bulkUpsertKeywords(
  _clientId: string,
  keywords: CreateKeywordInput[]
): Promise<void> {
  const supabase = supabaseServer()
  const { error } = await supabase
    .from('keywords')
    .upsert(keywords, { onConflict: 'client_id,keyword' })

  if (error) {
    throw new Error(`Failed to bulk upsert keywords: ${error.message}`)
  }
}

/**
 * Get keyword trends for a client (position changes).
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getKeywordTrends(
  clientId: string
): Promise<KeywordTrend[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('keywords')
    .select('keyword, current_position, previous_position, search_volume')
    .eq('client_id', clientId)
    .not('current_position', 'is', null)
    .order('search_volume', { ascending: false })

  if (error) {
    throw new Error(`Failed to get keyword trends: ${error.message}`)
  }

  return ((data as Pick<Keyword, 'keyword' | 'current_position' | 'previous_position' | 'search_volume'>[]) || []).map(
    (row) => ({
      keyword: row.keyword,
      current_position: row.current_position,
      previous_position: row.previous_position,
      change:
        row.current_position !== null && row.previous_position !== null
          ? row.previous_position - row.current_position
          : null,
      search_volume: row.search_volume,
    })
  )
}
