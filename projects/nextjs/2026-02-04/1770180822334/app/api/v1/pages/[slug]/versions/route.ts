import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, pageVersions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { withApiAuth, hasPermission } from '@/lib/api-auth'

/**
 * GET /api/v1/pages/[slug]/versions - Get page version list
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

    // Fetch versions
    const versions = await db
      .select({
        id: pageVersions.id,
        versionNumber: pageVersions.versionNumber,
        changeSummary: pageVersions.changeSummary,
        createdBy: pageVersions.createdBy,
        createdAt: pageVersions.createdAt,
      })
      .from(pageVersions)
      .where(eq(pageVersions.pageId, page.id))
      .orderBy(desc(pageVersions.versionNumber))

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }

    return NextResponse.json(
      {
        data: versions,
      },
      { headers }
    )
  } catch (error) {
    console.error('API page versions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS /api/v1/pages/[slug]/versions - CORS preflight
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
