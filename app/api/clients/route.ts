import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { createClient } from '@packages/db/queries'
import { supabaseAdmin } from '@packages/db/client'
import type { Client, AgentAction } from '@packages/db/types'

interface ClientWithMeta extends Record<string, unknown> {
  pending_count: number
  last_activity: string | null
}

const CreateClientSchema = z.object({
  name: z.string().min(1),
  domain: z.string().url(),
})

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    // Fetch all clients via supabaseAdmin (cross-org)
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (clientError) {
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    const allClients = (clients as Client[]) ?? []

    // Fetch pending counts and last activity from agent_actions in one query
    const { data: pendingActions } = await supabaseAdmin
      .from('agent_actions')
      .select('client_id, status, created_at')
      .in('status', ['pending', 'deployed', 'approved'])
      .order('created_at', { ascending: false })

    const actionsByClient = new Map<string, { pending_count: number; last_activity: string | null }>()

    for (const action of (pendingActions as Pick<AgentAction, 'client_id' | 'status' | 'created_at'>[]) ?? []) {
      const existing = actionsByClient.get(action.client_id) ?? { pending_count: 0, last_activity: null }

      if (action.status === 'pending') {
        existing.pending_count++
      }

      if (!existing.last_activity || action.created_at > existing.last_activity) {
        existing.last_activity = action.created_at
      }

      actionsByClient.set(action.client_id, existing)
    }

    // Merge client data with meta
    const enrichedClients: ClientWithMeta[] = allClients.map((client) => {
      const meta = actionsByClient.get(client.id) ?? { pending_count: 0, last_activity: null }
      return {
        ...(client as unknown as Record<string, unknown>),
        pending_count: meta.pending_count,
        last_activity: meta.last_activity,
      }
    })

    return NextResponse.json(enrichedClients)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const body = CreateClientSchema.parse(await request.json())

    const client = await createClient({
      org_id: authResult.orgId,
      name: body.name,
      domain: body.domain,
      management_mode: 'managed',
      vertical: 'dental',
      health_score: 0,
      practice_profile: {},
      google_tokens: {},
      cms_type: null,
      cms_credentials: {},
      account_health: 'active',
      competitors: [],
      onboarding_step: null,
      onboarding_completed_at: null,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
