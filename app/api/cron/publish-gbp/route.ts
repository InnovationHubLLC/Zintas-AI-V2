import { NextRequest, NextResponse } from 'next/server'
import { publishScheduledPosts } from '@packages/local-seo/scheduler'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = request.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await publishScheduledPosts()

    return NextResponse.json({
      published: result.published,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
