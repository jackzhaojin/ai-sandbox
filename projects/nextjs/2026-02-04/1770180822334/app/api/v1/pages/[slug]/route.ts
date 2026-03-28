import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, pageVersions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { withApiAuth, hasPermission } from '@/lib/api-auth'

/**
 * GET /api/v1/pages/[slug] - Get single page with full content
 */
export const GET = withApiAuth(async (request: NextRequest, { params, apiKey }) => {
  try {
    // Check permission
    if (!hasPermission(apiKey.permissions, 'read:pages')) {
      return NextResponse.json(
        { error: 'Missing permission: read:pages' },
        { status: 403 }
      )
    }

    const { slug } = params

    // Fetch page
    const [page] = await db
      .select()
      .from(pages)
      .where(and(
        eq(pages.siteId, apiKey.siteId),
        eq(pages.slug, slug)
      ))
      .limit(1)

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Fetch published version content if available
    let content = null
    if (page.publishedVersionId) {
      const [version] = await db
        .select()
        .from(pageVersions)
        .where(eq(pageVersions.id, page.publishedVersionId))
        .limit(1)

      if (version) {
        content = version.content
      }
    }

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }

    return NextResponse.json(
      {
        data: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          path: page.path,
          status: page.status,
          content,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          canonicalUrl: page.canonicalUrl,
          noIndex: page.noIndex,
          noFollow: page.noFollow,
          structuredData: page.structuredData,
          publishedAt: page.publishedAt,
          updatedAt: page.updatedAt,
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('API page detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS /api/v1/pages/[slug] - CORS preflight
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
