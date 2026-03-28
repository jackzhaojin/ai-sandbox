import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sites } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { withApiAuth, hasPermission } from '@/lib/api-auth'

/**
 * GET /api/v1/site - Get site metadata
 */
export const GET = withApiAuth(async (request: NextRequest, { apiKey }) => {
  try {
    // Check permission
    if (!hasPermission(apiKey.permissions, 'read:site')) {
      return NextResponse.json(
        { error: 'Missing permission: read:site' },
        { status: 403 }
      )
    }

    // Fetch site
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, apiKey.siteId))
      .limit(1)

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
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
          id: site.id,
          name: site.name,
          slug: site.slug,
          domain: site.domain,
          description: site.description,
          faviconUrl: site.faviconUrl,
          logoMediaId: site.logoMediaId,
          themeConfig: site.themeConfig,
          customCss: site.customCss,
          customHeadHtml: site.customHeadHtml,
          analyticsConfig: site.analyticsConfig,
          socialLinks: site.socialLinks,
          settings: site.settings,
          updatedAt: site.updatedAt,
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('API site detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS /api/v1/site - CORS preflight
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
