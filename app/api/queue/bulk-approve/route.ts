import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import {
  getQueueItemById,
  approveQueueItem,
  updateQueueItem,
  getContentById,
  getClientById,
  publishContent,
} from '@packages/db/queries'
import { WordPressClient } from '@packages/agents/integrations/wordpress'

interface WPCredentials {
  username: string
  applicationPassword: string
}

const BulkApproveSchema = z.object({
  actionIds: z.array(z.string().uuid()).min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const body = BulkApproveSchema.parse(await request.json())

    let approved = 0
    let failed = 0
    const errors: string[] = []

    for (const actionId of body.actionIds) {
      try {
        const item = await getQueueItemById(actionId)
        if (!item || item.status !== 'pending') {
          failed++
          errors.push(`${actionId}: not found or not pending`)
          continue
        }

        await approveQueueItem(actionId, authResult.userId)

        const isContentAction =
          item.action_type === 'content_new' || item.action_type === 'content_edit'

        if (isContentAction && item.content_piece_id) {
          try {
            const content = await getContentById(item.content_piece_id)
            const client = await getClientById(item.client_id)

            if (content && client?.cms_type === 'wordpress' && client.cms_credentials) {
              const creds = client.cms_credentials as unknown as WPCredentials
              const wpClient = new WordPressClient(client.domain, creds)

              const wpPost = await wpClient.publishPost({
                title: content.title,
                content: content.body_html ?? '',
                status: 'publish',
                excerpt: content.meta_description ?? undefined,
                meta: {
                  yoast_wpseo_title: content.meta_title ?? undefined,
                  yoast_wpseo_metadesc: content.meta_description ?? undefined,
                },
              })

              await publishContent(item.content_piece_id, wpPost.link)
              await updateQueueItem(actionId, {
                status: 'deployed',
                deployed_at: new Date().toISOString(),
                rollback_data: { wordpress_post_id: wpPost.id },
              })
            }
          } catch {
            errors.push(`${actionId}: approved but deployment failed`)
          }
        }

        approved++
      } catch {
        failed++
        errors.push(`${actionId}: approval failed`)
      }
    }

    return NextResponse.json({ approved, failed, errors })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to bulk approve' },
      { status: 500 }
    )
  }
}
