import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { templates, pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * PATCH /api/templates/[id]
 * Update a template (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { name, description, thumbnailUrl, structure, defaultContent, lockedRegions } = body

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (structure !== undefined) updateData.structure = structure
    if (defaultContent !== undefined) updateData.defaultContent = defaultContent
    if (lockedRegions !== undefined) updateData.lockedRegions = lockedRegions

    // Update template
    const [updatedTemplate] = await db
      .update(templates)
      .set(updateData)
      .where(eq(templates.id, id))
      .returning()

    if (!updatedTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template: updatedTemplate })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete a template (admin only)
 * Safety check: Prevent deletion if template is in use
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Safety check: Check if template is being used by any pages
    const pagesUsingTemplate = await db.query.pages.findMany({
      where: eq(pages.templateId, id),
      limit: 1,
    })

    if (pagesUsingTemplate.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete template',
          message: 'This template is being used by one or more pages. Please remove the template from those pages before deleting.',
        },
        { status: 400 }
      )
    }

    // Delete template
    const [deletedTemplate] = await db
      .delete(templates)
      .where(eq(templates.id, id))
      .returning()

    if (!deletedTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, template: deletedTemplate })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
