import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, pageVersions, profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getUserProfile } from '@/lib/auth/session'

export async function GET(
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

    // Get all versions for this page with creator info
    const versions = await db
      .select({
        id: pageVersions.id,
        versionNumber: pageVersions.versionNumber,
        content: pageVersions.content,
        layout: pageVersions.layout,
        metadata: pageVersions.metadata,
        createdAt: pageVersions.createdAt,
        changeSummary: pageVersions.changeSummary,
        isPublished: pageVersions.isPublished,
        createdBy: {
          id: profiles.id,
          name: profiles.name,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(pageVersions)
      .leftJoin(profiles, eq(pageVersions.createdBy, profiles.id))
      .where(eq(pageVersions.pageId, pageId))
      .orderBy(desc(pageVersions.versionNumber))

    return NextResponse.json({
      versions: versions.map(v => ({
        id: v.id,
        versionNumber: v.versionNumber,
        content: v.content,
        layout: v.layout,
        metadata: v.metadata,
        createdAt: v.createdAt,
        changeSummary: v.changeSummary,
        isPublished: v.isPublished,
        createdBy: v.createdBy,
      })),
    })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}
