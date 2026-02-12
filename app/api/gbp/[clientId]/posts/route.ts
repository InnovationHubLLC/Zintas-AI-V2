import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { getGbpPosts, createGbpPost } from '@packages/db/queries'

const CreateGbpPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { clientId } = await params
    const posts = await getGbpPosts(clientId)

    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GBP posts' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { clientId } = await params
    const body = CreateGbpPostSchema.parse(await request.json())

    const post = await createGbpPost({
      org_id: authResult.orgId,
      client_id: clientId,
      post_type: 'standard',
      title: body.title,
      body: body.body,
      image_url: null,
      cta_type: null,
      cta_url: null,
      status: body.scheduledAt ? 'scheduled' : 'draft',
      scheduled_at: body.scheduledAt ?? null,
      published_at: null,
      gbp_post_id: null,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create GBP post' }, { status: 500 })
  }
}
