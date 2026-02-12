import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@packages/db/client'
import type { Lead } from '@packages/db/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    // TODO: Add getLeadById to packages/db/queries/leads.ts
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data as Lead)
  } catch {
    return NextResponse.json({ error: 'Failed to get audit results' }, { status: 500 })
  }
}
