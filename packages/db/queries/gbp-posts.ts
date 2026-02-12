import type {
  GbpPost,
  CreateGbpPostInput,
  UpdateGbpPostInput,
} from '@packages/db/types'
import { supabaseServer, supabaseAdmin } from '@packages/db/client'

/**
 * Get all GBP posts for a client.
 * Uses RLS — filtered by JWT org_id claim.
 */
export async function getGbpPosts(
  clientId: string
): Promise<GbpPost[]> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('gbp_posts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get GBP posts: ${error.message}`)
  }

  return (data as GbpPost[]) || []
}

/**
 * Create a new GBP post.
 * Uses RLS — org_id must match JWT claim.
 */
export async function createGbpPost(
  data: CreateGbpPostInput
): Promise<GbpPost> {
  const supabase = supabaseServer()
  const { data: post, error } = await supabase
    .from('gbp_posts')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create GBP post: ${error.message}`)
  }

  return post as GbpPost
}

/**
 * Update an existing GBP post.
 * Uses RLS — org_id must match JWT claim.
 */
export async function updateGbpPost(
  postId: string,
  data: UpdateGbpPostInput
): Promise<GbpPost> {
  const supabase = supabaseServer()
  const { data: post, error } = await supabase
    .from('gbp_posts')
    .update(data)
    .eq('id', postId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update GBP post: ${error.message}`)
  }

  return post as GbpPost
}

/**
 * Get all scheduled posts that are due for publishing.
 * Uses supabaseAdmin — cross-org, for cron job processing.
 */
export async function getScheduledPosts(): Promise<GbpPost[]> {
  const { data, error } = await supabaseAdmin
    .from('gbp_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get scheduled posts: ${error.message}`)
  }

  return (data as GbpPost[]) || []
}
