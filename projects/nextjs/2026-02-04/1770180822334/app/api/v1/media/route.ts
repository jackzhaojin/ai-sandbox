import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { media } from '@/lib/db/schema'
import { eq, and, desc, ilike, arrayContains } from 'drizzle-orm'
import { withApiAuth, hasPermission } from '@/lib/api-auth'

/**
 * GET /api/v1/media - List media with pagination and filters
 */
export const GET = withApiAuth(async (request: NextRequest, { apiKey }) => {
  try {
    // Check permission
    if (!hasPermission(apiKey.permissions, 'read:media')) {
      return NextResponse.json(
        { error: 'Missing permission: read:media' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const folder = searchParams.get('folder')
    const tag = searchParams.get('tag')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = [eq(media.siteId, apiKey.siteId)]

    if (folder) {
      conditions.push(eq(media.folderId, folder))
    }

    if (tag) {
      conditions.push(arrayContains(media.tags, [tag]))
    }

    if (type) {
      conditions.push(ilike(media.mimeType, `${type}%`))
    }

    if (search) {
      conditions.push(ilike(media.filename, `%${search}%`))
    }

    // Fetch media
    const mediaResult = await db
      .select({
        id: media.id,
        filename: media.filename,
        originalFilename: media.originalFilename,
        storagePath: media.storagePath,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
        width: media.width,
        height: media.height,
        altText: media.altText,
        caption: media.caption,
        tags: media.tags,
        uploadedAt: media.uploadedAt,
      })
      .from(media)
      .where(and(...conditions))
      .orderBy(desc(media.uploadedAt))
      .limit(limit)
      .offset(offset)

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }

    return NextResponse.json(
      {
        data: mediaResult,
        pagination: {
          limit,
          offset,
          total: mediaResult.length,
          hasMore: mediaResult.length === limit,
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('API media list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS /api/v1/media - CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    }
  )
}
