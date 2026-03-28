import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { pageVersions, pages, contentFragments } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

/**
 * GET /api/fragments/[fragmentId]/usage
 * Get all pages that reference this fragment
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

    // Verify fragment exists
    const fragment = await db.query.contentFragments.findFirst({
      where: eq(contentFragments.id, fragmentId),
    })

    if (!fragment) {
      return NextResponse.json({ error: 'Fragment not found' }, { status: 404 })
    }

    // Query page_versions to find pages using this fragment
    // We need to search within the JSONB content column for fragmentId
    const usages = await db.execute(sql`
      SELECT DISTINCT
        p.id,
        p.title,
        p.slug,
        p.updated_at as "updatedAt"
      FROM pages p
      INNER JOIN page_versions pv ON pv.page_id = p.id
      WHERE pv.content::text LIKE ${'%' + fragmentId + '%'}
      ORDER BY p.updated_at DESC
    `)

    // Filter results to confirm fragmentId is actually in content (not just substring match)
    const confirmedUsages = []
    const usageRows = Array.isArray(usages) ? usages : []

    for (const row of usageRows) {
      // Fetch the latest version to check content
      const latestVersion = await db.query.pageVersions.findFirst({
        where: eq(pageVersions.pageId, row.id as string),
        orderBy: (pageVersions, { desc }) => [desc(pageVersions.versionNumber)],
      })

      if (latestVersion) {
        const contentString = JSON.stringify(latestVersion.content)
        if (contentString.includes(fragmentId)) {
          confirmedUsages.push(row)
        }
      }
    }

    return NextResponse.json({
      fragment: {
        id: fragment.id,
        name: fragment.name,
      },
      usageCount: confirmedUsages.length,
      pages: confirmedUsages,
    })
  } catch (error) {
    console.error('Error fetching fragment usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fragment usage' },
      { status: 500 }
    )
  }
}
