import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'

const DetectCmsSchema = z.object({
  url: z.string().url(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = DetectCmsSchema.parse(await request.json())

    // TODO: Fetch website and detect CMS (TASK-19)
    // Check for WordPress, Wix, Squarespace, Webflow signatures
    return NextResponse.json({
      cms: null,
      confidence: 0,
      url: body.url,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to detect CMS' }, { status: 500 })
  }
}
