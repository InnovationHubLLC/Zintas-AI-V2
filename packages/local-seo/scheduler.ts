import { ChatAnthropic } from '@langchain/anthropic'
import { GBPService } from './gbp-service'
import {
  getScheduledPosts,
  createGbpPost,
  updateGbpPost,
} from '@packages/db/queries/gbp-posts'
import { getClientById } from '@packages/db/queries/clients'
import type { GbpPost } from '@packages/db/types'

// ── Types ────────────────────────────────────────────────────────

interface SchedulePostInput {
  clientId: string
  orgId: string
  title?: string
  body: string
  postType?: string
  imageUrl?: string
  ctaType?: string
  ctaUrl?: string
  scheduledAt: Date
}

interface GBPPostDraft {
  title: string
  body: string
  ctaType: string
}

interface PublishResult {
  published: number
  failed: number
}

// ── Functions ────────────────────────────────────────────────────

/**
 * Schedule a GBP post for future publishing.
 */
export async function schedulePost(
  input: SchedulePostInput
): Promise<GbpPost> {
  return createGbpPost({
    org_id: input.orgId,
    client_id: input.clientId,
    post_type: input.postType ?? 'update',
    title: input.title ?? null,
    body: input.body,
    image_url: input.imageUrl ?? null,
    cta_type: input.ctaType ?? null,
    cta_url: input.ctaUrl ?? null,
    status: 'scheduled',
    scheduled_at: input.scheduledAt.toISOString(),
    published_at: null,
    gbp_post_id: null,
  })
}

/**
 * Publish all scheduled posts whose scheduled_at has passed.
 * Designed for cron job context — uses admin client, handles errors per-post.
 */
export async function publishScheduledPosts(): Promise<PublishResult> {
  const posts = await getScheduledPosts()

  let published = 0
  let failed = 0

  for (const post of posts) {
    try {
      const gbpService = new GBPService(post.client_id)

      // Get client's GBP locations
      const locations = await gbpService.getLocations()
      if (locations.length === 0) {
        failed++
        continue
      }

      const locationId = locations[0].locationId

      const result = await gbpService.createPost(locationId, {
        body: post.body,
        topicType: 'STANDARD',
        callToAction: post.cta_type
          ? { actionType: post.cta_type, url: post.cta_url ?? '' }
          : undefined,
        mediaUrl: post.image_url ?? undefined,
      })

      await updateGbpPost(post.id, {
        status: 'published',
        published_at: new Date().toISOString(),
        gbp_post_id: result.name,
      })

      published++
    } catch {
      // Leave post as 'scheduled' for retry on next cron run
      failed++
    }
  }

  return { published, failed }
}

/**
 * Generate 2 weekly GBP post drafts for a dental practice using AI.
 */
export async function generateWeeklyGBPPosts(
  clientId: string
): Promise<GBPPostDraft[]> {
  const client = await getClientById(clientId)
  if (!client) {
    throw new Error(`Client not found: ${clientId}`)
  }

  const practiceProfile = client.practice_profile as Record<string, unknown>
  const practiceName = (practiceProfile.name as string) ?? client.name

  const llm = new ChatAnthropic({
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 1024,
  })

  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'long' })

  const prompt = `You are a dental marketing assistant creating Google Business Profile posts.

Practice: ${practiceName}
Domain: ${client.domain}
Month: ${month}

Generate exactly 2 GBP post drafts in JSON format. Each post should be:
- 150-300 words
- Engaging, professional dental practice tone
- Include a seasonal or educational angle relevant to ${month}
- Avoid medical claims or guarantees
- Include a call-to-action

Return ONLY a JSON array with this structure:
[
  {
    "title": "Post title",
    "body": "Post body text...",
    "ctaType": "BOOK" or "CALL" or "LEARN_MORE"
  }
]`

  const response = await llm.invoke(prompt)
  const text = typeof response.content === 'string'
    ? response.content
    : String(response.content)

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const drafts = JSON.parse(jsonMatch[0]) as GBPPostDraft[]
    return drafts.slice(0, 2)
  } catch {
    return []
  }
}

export type { SchedulePostInput, GBPPostDraft, PublishResult }
