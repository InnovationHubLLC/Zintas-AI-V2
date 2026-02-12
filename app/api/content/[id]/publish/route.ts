import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { publishContent } from '@packages/db/queries'

const PublishSchema = z.object({
  publishedUrl: z.string().url(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params
    const body = PublishSchema.parse(await request.json())

    // TODO: Push content to CMS (TASK-30)
    const content = await publishContent(id, body.publishedUrl)

    return NextResponse.json(content)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 })
  }
}
