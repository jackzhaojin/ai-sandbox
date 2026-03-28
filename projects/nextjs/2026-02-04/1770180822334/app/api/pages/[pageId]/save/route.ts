import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, pageVersions, activityLog } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

interface SavePageRequest {
  components: Array<{
    id: string
    type: string
    props: Record<string, unknown>
  }>
  changeSummary?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    // Get user profile
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { pageId } = await params
    const body: SavePageRequest = await request.json()
    const { components, changeSummary } = body

    // Validate components
    if (!Array.isArray(components)) {
      return NextResponse.json(
        { error: 'Invalid components data' },
        { status: 400 }
      )
    }

    // Check if page exists and user has access
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Get the latest version number for this page
    const latestVersion = await db.query.pageVersions.findFirst({
      where: eq(pageVersions.pageId, pageId),
      orderBy: [desc(pageVersions.versionNumber)],
    })

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1

    // Create new version
    const newVersion = await db.insert(pageVersions).values({
      pageId,
      versionNumber: newVersionNumber,
      content: { components }, // Store components in content field
      layout: {}, // Placeholder for layout settings (future use)
      metadata: {
        savedAt: new Date().toISOString(),
        componentCount: components.length,
      },
      createdBy: profile.id,
      changeSummary: changeSummary || `Version ${newVersionNumber}`,
      isPublished: false,
    }).returning()

    // Update page's updated_at and updated_by
    await db
      .update(pages)
      .set({
        updatedBy: profile.id,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))

    // Log activity
    await db.insert(activityLog).values({
      userId: profile.id,
      siteId: page.siteId,
      entityType: 'page',
      entityId: pageId,
      action: 'updated',
      metadata: {
        versionNumber: newVersionNumber,
        changeSummary: changeSummary || `Version ${newVersionNumber}`,
        componentCount: components.length,
      },
    })

    return NextResponse.json({
      success: true,
      version: {
        id: newVersion[0].id,
        versionNumber: newVersionNumber,
        createdAt: newVersion[0].createdAt,
      },
    })
  } catch (error) {
    console.error('Error saving page:', error)
    return NextResponse.json(
      { error: 'Failed to save page' },
      { status: 500 }
    )
  }
}
