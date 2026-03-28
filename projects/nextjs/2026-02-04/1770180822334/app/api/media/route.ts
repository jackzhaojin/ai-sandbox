import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { media, mediaUsage } from '@/lib/db/schema'
import { eq, and, or, ilike, sql, inArray } from 'drizzle-orm'

// GET - Search and filter media
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const folderId = searchParams.get('folderId')
    const search = searchParams.get('search')
    const mimeType = searchParams.get('mimeType')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const uploadedBy = searchParams.get('uploadedBy')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    // Build query conditions
    const conditions = [eq(media.siteId, siteId)]

    if (folderId) {
      conditions.push(eq(media.folderId, folderId))
    } else if (folderId === '') {
      // Root folder (null folderId)
      conditions.push(sql`${media.folderId} IS NULL`)
    }

    if (search) {
      conditions.push(
        or(
          ilike(media.filename, `%${search}%`),
          ilike(media.originalFilename, `%${search}%`),
          ilike(media.altText, `%${search}%`),
          ilike(media.caption, `%${search}%`)
        )!
      )
    }

    if (mimeType) {
      conditions.push(ilike(media.mimeType, `${mimeType}%`))
    }

    if (tags && tags.length > 0) {
      conditions.push(sql`${media.tags} && ARRAY[${tags.map(t => `'${t}'`).join(',')}]::text[]`)
    }

    if (uploadedBy) {
      conditions.push(eq(media.uploadedBy, uploadedBy))
    }

    if (dateFrom) {
      conditions.push(sql`${media.uploadedAt} >= ${dateFrom}`)
    }

    if (dateTo) {
      conditions.push(sql`${media.uploadedAt} <= ${dateTo}`)
    }

    if (minSize) {
      conditions.push(sql`${media.fileSize} >= ${parseInt(minSize)}`)
    }

    if (maxSize) {
      conditions.push(sql`${media.fileSize} <= ${parseInt(maxSize)}`)
    }

    // Fetch media
    const mediaFiles = await db.query.media.findMany({
      where: and(...conditions),
      orderBy: (media, { desc }) => [desc(media.uploadedAt)],
      with: {
        folder: true,
      },
    })

    // Get usage counts
    const mediaIds = mediaFiles.map(m => m.id)
    const usageCounts: Record<string, number> = {}

    if (mediaIds.length > 0) {
      const usageResults = await db
        .select({
          mediaId: mediaUsage.mediaId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(mediaUsage)
        .where(inArray(mediaUsage.mediaId, mediaIds))
        .groupBy(mediaUsage.mediaId)

      usageResults.forEach(result => {
        usageCounts[result.mediaId] = result.count
      })
    }

    // Get public URLs
    const mediaWithUrls = mediaFiles.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(file.storagePath)

      return {
        ...file,
        url: publicUrl,
        thumbnailUrl: file.width && file.height
          ? `${publicUrl}?width=200&height=200&resize=cover`
          : publicUrl,
        usageCount: usageCounts[file.id] || 0,
      }
    })

    return NextResponse.json({ media: mediaWithUrls })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
