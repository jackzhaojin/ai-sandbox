import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { pages, pageVersions, templates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/pages
 * Create a new page from a template
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { siteId, title, slug, templateId } = body

    if (!siteId || !title || !slug) {
      return NextResponse.json(
        { error: 'siteId, title, and slug are required' },
        { status: 400 }
      )
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      )
    }

    // Check if page with slug already exists
    const existingPage = await db.query.pages.findFirst({
      where: (pages, { and, eq }) =>
        and(eq(pages.siteId, siteId), eq(pages.slug, slug))
    })

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      )
    }

    // Get template content if template ID provided
    let pageContent: any[] = []
    let actualTemplateId = templateId

    if (templateId && templateId !== 'blank') {
      const template = await db.query.templates.findFirst({
        where: eq(templates.id, templateId),
      })

      if (template) {
        pageContent = Array.isArray(template.structure) ? template.structure : []
      } else {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
    } else {
      // If blank template, set templateId to null
      actualTemplateId = null
    }

    // Create page
    const path = `/${slug}`
    const [newPage] = await db
      .insert(pages)
      .values({
        siteId,
        title,
        slug,
        path,
        templateId: actualTemplateId,
        status: 'draft',
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning()

    // Create initial page version with template content
    const [initialVersion] = await db
      .insert(pageVersions)
      .values({
        pageId: newPage.id,
        versionNumber: 1,
        content: pageContent,
        layout: {}, // Empty layout for now
        createdBy: user.id,
        changeSummary: 'Initial version created from template',
      })
      .returning()

    return NextResponse.json({
      page: newPage,
      version: initialVersion,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}
