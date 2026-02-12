import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import { detectCMS } from '@packages/audit-engine/detect-cms'

const DetectCmsSchema = z.object({
  url: z.string().url(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = DetectCmsSchema.parse(await request.json())

    const result = await detectCMS(body.url)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to detect CMS' }, { status: 500 })
  }
}
