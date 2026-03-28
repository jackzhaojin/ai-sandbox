import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { media, mediaUsage } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - Get single media with details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const mediaFile = await db.query.media.findFirst({
      where: eq(media.id, id),
      with: {
        folder: true,
      },
    })

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Get usage count
    const [usageResult] = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(mediaUsage)
      .where(eq(mediaUsage.mediaId, id))

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(mediaFile.storagePath)

    return NextResponse.json({
      ...mediaFile,
      url: publicUrl,
      thumbnailUrl: mediaFile.width && mediaFile.height
        ? `${publicUrl}?width=200&height=200&resize=cover`
        : publicUrl,
      mediumUrl: mediaFile.width && mediaFile.height
        ? `${publicUrl}?width=800&height=800&resize=inside`
        : publicUrl,
      largeUrl: mediaFile.width && mediaFile.height
        ? `${publicUrl}?width=1600&height=1600&resize=inside`
        : publicUrl,
      usageCount: usageResult?.count || 0,
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update media metadata
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { altText, caption, tags, folderId } = body

    // Check media exists
    const existingMedia = await db.query.media.findFirst({
      where: eq(media.id, id),
    })

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Update media
    const updateData: any = {}
    if (altText !== undefined) updateData.altText = altText
    if (caption !== undefined) updateData.caption = caption
    if (tags !== undefined) updateData.tags = tags
    if (folderId !== undefined) updateData.folderId = folderId

    const [updatedMedia] = await db
      .update(media)
      .set(updateData)
      .where(eq(media.id, id))
      .returning()

    return NextResponse.json(updatedMedia)
  } catch (error) {
    console.error('Error updating media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete media
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Get media
    const mediaFile = await db.query.media.findFirst({
      where: eq(media.id, id),
    })

    if (!mediaFile) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Check usage
    const [usageResult] = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(mediaUsage)
      .where(eq(mediaUsage.mediaId, id))

    if (usageResult && usageResult.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete media that is used on ${usageResult.count} page(s)` },
        { status: 400 }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([mediaFile.storagePath])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
