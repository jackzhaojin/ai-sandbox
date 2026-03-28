import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { mediaFolders, media } from '@/lib/db/schema'
import { eq, and, like } from 'drizzle-orm'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH - Update folder (rename or move)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, parentId } = body

    // Get existing folder
    const folder = await db.query.mediaFolders.findFirst({
      where: eq(mediaFolders.id, id),
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Calculate new path
    let newPath = name || folder.name

    if (parentId !== undefined) {
      // Moving to a new parent
      if (parentId) {
        const parent = await db.query.mediaFolders.findFirst({
          where: eq(mediaFolders.id, parentId),
        })

        if (!parent) {
          return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
        }

        // Check if moving to itself or a child (would create a cycle)
        if (parentId === id || parent.path.startsWith(folder.path + '/')) {
          return NextResponse.json({ error: 'Cannot move folder into itself or its children' }, { status: 400 })
        }

        newPath = `${parent.path}/${name || folder.name}`

        // Check max depth
        const depth = parent.path.split('/').length
        if (depth >= 5) {
          return NextResponse.json({ error: 'Maximum folder depth (5 levels) exceeded' }, { status: 400 })
        }
      } else {
        // Moving to root
        newPath = name || folder.name
      }
    } else if (name) {
      // Just renaming
      const pathParts = folder.path.split('/')
      pathParts[pathParts.length - 1] = name
      newPath = pathParts.join('/')
    }

    // Check if new path already exists
    if (newPath !== folder.path) {
      const existing = await db.query.mediaFolders.findFirst({
        where: and(
          eq(mediaFolders.siteId, folder.siteId),
          eq(mediaFolders.path, newPath)
        ),
      })

      if (existing) {
        return NextResponse.json({ error: 'A folder already exists at this path' }, { status: 409 })
      }
    }

    // Update folder
    const [updatedFolder] = await db
      .update(mediaFolders)
      .set({
        name: name || folder.name,
        parentId: parentId !== undefined ? parentId : folder.parentId,
        path: newPath,
      })
      .where(eq(mediaFolders.id, id))
      .returning()

    // Update paths of all child folders
    if (newPath !== folder.path) {
      const children = await db.query.mediaFolders.findMany({
        where: like(mediaFolders.path, `${folder.path}/%`),
      })

      for (const child of children) {
        const childNewPath = child.path.replace(folder.path, newPath)
        await db
          .update(mediaFolders)
          .set({ path: childNewPath })
          .where(eq(mediaFolders.id, child.id))
      }
    }

    return NextResponse.json({ folder: updatedFolder })
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete folder
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Get folder
    const folder = await db.query.mediaFolders.findFirst({
      where: eq(mediaFolders.id, id),
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if folder has children
    const children = await db.query.mediaFolders.findMany({
      where: eq(mediaFolders.parentId, id),
    })

    if (children.length > 0) {
      return NextResponse.json({ error: 'Cannot delete folder with subfolders' }, { status: 400 })
    }

    // Check if folder has media
    const mediaFiles = await db.query.media.findMany({
      where: eq(media.folderId, id),
    })

    if (mediaFiles.length > 0) {
      return NextResponse.json({ error: 'Cannot delete folder with media files' }, { status: 400 })
    }

    // Delete folder
    await db.delete(mediaFolders).where(eq(mediaFolders.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
