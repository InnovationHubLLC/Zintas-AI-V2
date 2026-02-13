import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { getClientById, updateClient, getKeywordsByClient, getContentByClient } from '@packages/db/queries'
import { supabaseAdmin } from '@packages/db/client'
import type { AgentAction } from '@packages/db/types'

const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().url().optional(),
  management_mode: z.enum(['managed', 'self_service']).optional(),
  practice_profile: z.record(z.unknown()).optional(),
})

interface ClientDetailResponse {
  client: Record<string, unknown>
  recent_actions: AgentAction[]
  pending_count: number
  keyword_summary: {
    total: number
    improving_count: number
    page_1_count: number
  }
  content_count: number
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params
    const client = await getClientById(id)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch recent agent actions (last 10)
    const { data: actions } = await supabaseAdmin
      .from('agent_actions')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentActions = (actions as AgentAction[] | null) ?? []

    // Pending count
    const { count: pendingCount } = await supabaseAdmin
      .from('agent_actions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .eq('status', 'pending')

    // Keyword summary
    const keywords = await getKeywordsByClient(id)
    const improving_count = keywords.filter(
      (k) =>
        k.current_position !== null &&
        k.previous_position !== null &&
        k.current_position < k.previous_position
    ).length
    const page_1_count = keywords.filter(
      (k) => k.current_position !== null && k.current_position <= 10
    ).length

    // Content count
    const content = await getContentByClient(id)
    const content_count = content.filter((c) => c.status === 'published').length

    const response: ClientDetailResponse = {
      client: client as unknown as Record<string, unknown>,
      recent_actions: recentActions,
      pending_count: pendingCount ?? 0,
      keyword_summary: {
        total: keywords.length,
        improving_count,
        page_1_count,
      },
      content_count,
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params
    const body = UpdateClientSchema.parse(await request.json())
    const client = await updateClient(id, body)

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}
