import type {
  ContentPiece,
  CreateContentPieceInput,
  UpdateContentPieceInput,
  ContentStatus,
  ContentType,
} from '@packages/db/types'
import { supabaseServer } from '@packages/db/client'

interface ContentFilters {
  status?: ContentStatus
  type?: ContentType
}

/**
 * Get all content pieces for a client, with optional filters.
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getContentByClient(
  clientId: string,
  filters?: ContentFilters
): Promise<ContentPiece[]> {
  const supabase = supabaseServer()
  let query = supabase
    .from('content_pieces')
    .select('*')
    .eq('client_id', clientId)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.type) {
    query = query.eq('content_type', filters.type)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get content by client: ${error.message}`)
  }

  return (data as ContentPiece[]) || []
}

/**
 * Get a single content piece by ID.
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getContentById(
  contentId: string
): Promise<ContentPiece | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('id', contentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get content by id: ${error.message}`)
  }

  return data as ContentPiece
}

/**
 * Create a new content piece.
 * Uses RLS — org_id must match JWT claim.
 */
export async function createContent(
  data: CreateContentPieceInput
): Promise<ContentPiece> {
  const supabase = supabaseServer()
  const { data: content, error } = await supabase
    .from('content_pieces')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create content: ${error.message}`)
  }

  return content as ContentPiece
}

/**
 * Update an existing content piece.
 * Uses RLS — org_id must match JWT claim.
 */
export async function updateContent(
  contentId: string,
  data: UpdateContentPieceInput
): Promise<ContentPiece> {
  const supabase = supabaseServer()
  const { data: content, error } = await supabase
    .from('content_pieces')
    .update(data)
    .eq('id', contentId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update content: ${error.message}`)
  }

  return content as ContentPiece
}

/**
 * Publish a content piece by setting status and published URL.
 * Uses RLS — org_id must match JWT claim.
 */
export async function publishContent(
  contentId: string,
  publishedUrl: string
): Promise<ContentPiece> {
  const supabase = supabaseServer()
  const { data: content, error } = await supabase
    .from('content_pieces')
    .update({
      status: 'published' as const,
      published_url: publishedUrl,
      published_at: new Date().toISOString(),
    })
    .eq('id', contentId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to publish content: ${error.message}`)
  }

  return content as ContentPiece
}
