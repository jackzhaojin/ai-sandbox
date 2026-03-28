import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, pageVersions } from '@/lib/db/schema'
import { eq, and, desc, ilike, or } from 'drizzle-orm'
import { withApiAuth, hasPermission } from '@/lib/api-auth'

/**
 * GET /api/v1/pages - List published pages with pagination and filters
 */
export const GET = withApiAuth(async (request: NextRequest, { apiKey }) => {
  try {
    // Check permission
    if (!hasPermission(apiKey.permissions, 'read:pages')) {
      return NextResponse.json(
        { error: 'Missing permission: read:pages' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const slug = searchParams.get('slug')
    const status = searchParams.get('status') || 'published'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const fields = searchParams.get('fields')?.split(',')

    // Build query conditions
    const conditions = [eq(pages.siteId, apiKey.siteId)]

    if (slug) {
      conditions.push(ilike(pages.slug, `%${slug}%`))
    }

    if (status) {
      conditions.push(eq(pages.status, status as any))
    }

    // Fetch pages
    const pagesResult = await db
      .select()
      .from(pages)
      .where(and(...conditions))
      .orderBy(desc(pages.publishedAt))
      .limit(limit)
      .offset(offset)

    // Filter fields if requested
    const data = pagesResult.map(page => {
      if (fields) {
        const filtered: any = { id: page.id }
        fields.forEach(field => {
          if (field in page) {
            filtered[field] = (page as any)[field]
          }
        })
        return filtered
      }
      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        path: page.path,
        status: page.status,
        publishedAt: page.publishedAt,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        updatedAt: page.updatedAt,
      }
    })

    // Add CORS headers for GET requests
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }

    return NextResponse.json(
      {
        data,
        pagination: {
          limit,
          offset,
          total: data.length,
          hasMore: data.length === limit,
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('API pages list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS /api/v1/pages - CORS preflight
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
