import { NextRequest, NextResponse } from 'next/server'
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

async function deployToWordPress(
  contentPieceId: string,
  clientId: string
): Promise<{ postId: number; link: string } | null> {
  const content = await getContentById(contentPieceId)
  if (!content) return null

  const client = await getClientById(clientId)
  if (!client || !client.cms_credentials || client.cms_type !== 'wordpress') {
    return null
  }

  const creds = client.cms_credentials as unknown as WPCredentials
  const wpClient = new WordPressClient(client.domain, creds)

  const wpPost = await wpClient.publishPost({
    title: content.title,
    content: content.body_html ?? '',
    status: 'publish',
    slug: content.target_keyword?.toLowerCase().replace(/\s+/g, '-'),
    excerpt: content.meta_description ?? undefined,
    meta: {
      yoast_wpseo_title: content.meta_title ?? undefined,
      yoast_wpseo_metadesc: content.meta_description ?? undefined,
    },
  })

  await publishContent(contentPieceId, wpPost.link)

  return { postId: wpPost.id, link: wpPost.link }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params

    const item = await getQueueItemById(id)
    if (!item) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 })
    }

    if (item.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending items can be approved' },
        { status: 400 }
      )
    }

    const approved = await approveQueueItem(id, authResult.userId)

    const isContentAction =
      item.action_type === 'content_new' || item.action_type === 'content_edit'

    if (isContentAction && item.content_piece_id) {
      try {
        const deployment = await deployToWordPress(
          item.content_piece_id,
          item.client_id
        )

        if (deployment) {
          await updateQueueItem(id, {
            status: 'deployed',
            deployed_at: new Date().toISOString(),
            rollback_data: { wordpress_post_id: deployment.postId },
          })

          return NextResponse.json({
            ...approved,
            status: 'deployed',
            deployed_at: new Date().toISOString(),
            published_url: deployment.link,
          })
        }
      } catch {
        // Deployment failed but approval stands
        return NextResponse.json({
          ...approved,
          deployment_error: 'WordPress publishing failed',
        })
      }
    }

    return NextResponse.json(approved)
  } catch {
    return NextResponse.json(
      { error: 'Failed to approve item' },
      { status: 500 }
    )
  }
}
