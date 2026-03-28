import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/templates
 * Fetch all templates for a site
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    // Fetch templates for the site
    const siteTemplates = await db.query.templates.findMany({
      where: eq(templates.siteId, siteId),
      orderBy: (templates, { desc }) => [desc(templates.createdAt)],
    })

    // Calculate component count for each template
    const templatesWithCount = siteTemplates.map(template => ({
      ...template,
      componentCount: Array.isArray(template.structure) ? template.structure.length : 0,
    }))

    return NextResponse.json({ templates: templatesWithCount })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates
 * Create a new template (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { siteId, name, description, thumbnailUrl, structure, defaultContent, lockedRegions } = body

    if (!siteId || !name || !structure) {
      return NextResponse.json(
        { error: 'siteId, name, and structure are required' },
        { status: 400 }
      )
    }

    // Create template
    const [newTemplate] = await db
      .insert(templates)
      .values({
        siteId,
        name,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        structure,
        defaultContent: defaultContent || null,
        lockedRegions: lockedRegions || [],
        isSystem: false,
        createdBy: user.id,
      })
      .returning()

    return NextResponse.json({ template: newTemplate }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
