import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contentFragments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { withApiAuth, hasPermission } from '@/lib/api-auth'

/**
 * GET /api/v1/fragments/[id] - Get fragment by ID
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

    const { slug: fragmentId } = params

    // Fetch fragment
    const [fragment] = await db
      .select()
      .from(contentFragments)
      .where(and(
        eq(contentFragments.siteId, apiKey.siteId),
        eq(contentFragments.id, fragmentId)
      ))
      .limit(1)

    if (!fragment) {
      return NextResponse.json(
        { error: 'Fragment not found' },
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
          id: fragment.id,
          name: fragment.name,
          type: fragment.type,
          content: fragment.content,
          tags: fragment.tags,
          updatedAt: fragment.updatedAt,
        },
      },
      { headers }
    )
  } catch (error) {
    console.error('API fragment detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * OPTIONS /api/v1/fragments/[id] - CORS preflight
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
