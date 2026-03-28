import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { contentFragments, fragmentVersions, activityLog } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/fragments
 * Fetch all fragments for a site
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    // Fetch fragments for the site
    const siteFragments = await db.query.contentFragments.findMany({
      where: eq(contentFragments.siteId, siteId),
      orderBy: (contentFragments, { desc }) => [desc(contentFragments.updatedAt)],
    })

    return NextResponse.json({ fragments: siteFragments })
  } catch (error) {
    console.error('Error fetching fragments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fragments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/fragments
 * Create a new content fragment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { siteId, name, type, content, description, tags } = body

    if (!siteId || !name || !type || !content) {
      return NextResponse.json(
        { error: 'siteId, name, type, and content are required' },
        { status: 400 }
      )
    }

    // Validate fragment type
    const validTypes = ['text', 'media', 'layout', 'data']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid fragment type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create fragment
    const [newFragment] = await db
      .insert(contentFragments)
      .values({
        siteId,
        name,
        type,
        content,
        tags: tags || [],
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning()

    // Create initial version
    await db.insert(fragmentVersions).values({
      fragmentId: newFragment.id,
      versionNumber: 1,
      content,
      createdBy: user.id,
      changeSummary: 'Initial version',
    })

    // Log activity
    await db.insert(activityLog).values({
      userId: user.id,
      action: 'created',
      entityType: 'fragment',
      entityId: newFragment.id,
      metadata: {
        fragmentName: name,
        fragmentType: type,
      },
    })

    return NextResponse.json({ fragment: newFragment }, { status: 201 })
  } catch (error) {
    console.error('Error creating fragment:', error)
    return NextResponse.json(
      { error: 'Failed to create fragment' },
      { status: 500 }
    )
  }
}
