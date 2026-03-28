import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { contentFragments, fragmentVersions, activityLog, pageVersions } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

/**
 * GET /api/fragments/[fragmentId]
 * Fetch a specific fragment by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fragmentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fragmentId } = await params

    // Fetch fragment
    const fragment = await db.query.contentFragments.findFirst({
      where: eq(contentFragments.id, fragmentId),
    })

    if (!fragment) {
      return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
    }

    return NextResponse.json({ fragment })
  } catch (error) {
    console.error('Error fetching fragment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fragment' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/fragments/[fragmentId]
 * Update a fragment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fragmentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fragmentId } = await params
    const body = await request.json()
    const { name, type, content, description, tags, changeSummary } = body

    // Fetch existing fragment
    const existingFragment = await db.query.contentFragments.findFirst({
      where: eq(contentFragments.id, fragmentId),
    })

    if (!existingFragment) {
      return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
    }

    // Get the latest version number
    const latestVersion = await db.query.fragmentVersions.findFirst({
      where: eq(fragmentVersions.fragmentId, fragmentId),
      orderBy: desc(fragmentVersions.versionNumber),
    })

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1

    // Update fragment
    const [updatedFragment] = await db
      .update(contentFragments)
      .set({
        name: name !== undefined ? name : existingFragment.name,
        type: type !== undefined ? type : existingFragment.type,
        content: content !== undefined ? content : existingFragment.content,
        tags: tags !== undefined ? tags : existingFragment.tags,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(contentFragments.id, fragmentId))
      .returning()

    // Create new version if content changed
    if (content !== undefined) {
      await db.insert(fragmentVersions).values({
        fragmentId,
        versionNumber: nextVersionNumber,
        content,
        createdBy: user.id,
        changeSummary: changeSummary || `Version ${nextVersionNumber}`,
      })
    }

    // Log activity
    await db.insert(activityLog).values({
      userId: user.id,
      action: 'updated',
      entityType: 'fragment',
      entityId: fragmentId,
      metadata: {
        fragmentName: updatedFragment.name,
        versionNumber: nextVersionNumber,
      },
    })

    return NextResponse.json({ fragment: updatedFragment })
  } catch (error) {
    console.error('Error updating fragment:', error)
    return NextResponse.json(
      { error: 'Failed to update fragment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/fragments/[fragmentId]
 * Delete a fragment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fragmentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fragmentId } = await params

    // Fetch fragment
    const fragment = await db.query.contentFragments.findFirst({
      where: eq(contentFragments.id, fragmentId),
    })

    if (!fragment) {
      return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
    }

    // Delete fragment (cascade will delete versions)
    await db.delete(contentFragments).where(eq(contentFragments.id, fragmentId))

    // Log activity
    await db.insert(activityLog).values({
      userId: user.id,
      action: 'deleted',
      entityType: 'fragment',
      entityId: fragmentId,
      metadata: {
        fragmentName: fragment.name,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fragment:', error)
    return NextResponse.json(
      { error: 'Failed to delete fragment' },
      { status: 500 }
    )
  }
}
