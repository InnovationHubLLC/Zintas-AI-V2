import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import {
  getContentById,
  updateContent,
  getClientById,
} from '@packages/db/queries'
import { supabaseServer } from '@packages/db/client'
import { WordPressClient } from '@packages/agents/integrations/wordpress'
import type { AgentAction } from '@packages/db/types'

interface WPCredentials {
  username: string
  applicationPassword: string
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params

    const content = await getContentById(id)
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    if (content.status !== 'published') {
      return NextResponse.json(
        { error: 'Only published content can be rolled back' },
        { status: 400 }
      )
    }

    // Find the deployed agent_action linked to this content
    const supabase = supabaseServer()
    const { data: actions } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('content_piece_id', id)
      .eq('status', 'deployed')
      .order('deployed_at', { ascending: false })
      .limit(1)

    const action = (actions as AgentAction[] | null)?.[0]
    if (!action) {
      return NextResponse.json(
        { error: 'No deployed action found for this content' },
        { status: 404 }
      )
    }

    const rollbackData = action.rollback_data as Record<string, unknown>
    const wpPostId = rollbackData?.wordpress_post_id as number | undefined

    if (!wpPostId) {
      return NextResponse.json(
        { error: 'No WordPress post ID in rollback_data' },
        { status: 400 }
      )
    }

    // Get client and CMS credentials
    const client = await getClientById(content.client_id)
    if (!client || !client.cms_credentials) {
      return NextResponse.json(
        { error: 'Client CMS credentials not found' },
        { status: 400 }
      )
    }

    const creds = client.cms_credentials as unknown as WPCredentials
    const wpClient = new WordPressClient(client.domain, creds)

    // Unpublish the WordPress post (set to draft)
    await wpClient.unpublishPost(wpPostId)

    // Reset content piece status
    await updateContent(id, {
      status: 'approved',
      published_url: null,
      published_at: null,
    })

    // Update action status to rolled_back
    await supabase
      .from('agent_actions')
      .update({ status: 'rolled_back' })
      .eq('id', action.id)

    return NextResponse.json({ success: true, contentId: id })
  } catch {
    return NextResponse.json(
      { error: 'Failed to rollback content' },
      { status: 500 }
    )
  }
}
