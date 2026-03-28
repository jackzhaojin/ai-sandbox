import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { menus } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { withApiAuth, hasPermission } from '@/lib/api-auth'

/**
 * GET /api/v1/menus/[location] - Get menu by location
 */
export const GET = withApiAuth(async (request: NextRequest, { params, apiKey }) => {
  try {
    // Check permission
    if (!hasPermission(apiKey.permissions, 'read:content')) {
      return NextResponse.json(
        { error: 'Missing permission: read:content' },
        { status: 403 }
      )
    }

    const { location } = params

    // Fetch menu
    const [menu] = await db
      .select()
      .from(menus)
      .where(and(
        eq(menus.siteId, apiKey.siteId),
        eq(menus.location, location)
      ))
      .limit(1)

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
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
          id: menu.id,
          name: menu.name,
          location: menu.location,
          items: menu.items,
          updatedAt: menu.updatedAt,
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('API menu detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS /api/v1/menus/[location] - CORS preflight
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
