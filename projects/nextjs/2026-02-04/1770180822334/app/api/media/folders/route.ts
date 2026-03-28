import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { mediaFolders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET - List folders for a site
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    const folders = await db.query.mediaFolders.findMany({
      where: eq(mediaFolders.siteId, siteId),
      orderBy: (folders, { asc }) => [asc(folders.path)],
    })

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { siteId, name, parentId } = body

    if (!siteId || !name) {
      return NextResponse.json({ error: 'Site ID and name are required' }, { status: 400 })
    }

    // Calculate path
    let path = name
    let depth = 0

    if (parentId) {
      const parent = await db.query.mediaFolders.findFirst({
        where: eq(mediaFolders.id, parentId),
      })

      if (!parent) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
      }

      path = `${parent.path}/${name}`
      depth = parent.path.split('/').length

      // Check max depth (5 levels)
      if (depth >= 5) {
        return NextResponse.json({ error: 'Maximum folder depth (5 levels) exceeded' }, { status: 400 })
      }
    }

    // Check if folder already exists at this path
    const existing = await db.query.mediaFolders.findFirst({
      where: and(
        eq(mediaFolders.siteId, siteId),
        eq(mediaFolders.path, path)
      ),
    })

    if (existing) {
      return NextResponse.json({ error: 'Folder already exists at this path' }, { status: 409 })
    }

    // Create folder
    const [folder] = await db.insert(mediaFolders).values({
      siteId,
      name,
      parentId: parentId || null,
      path,
      createdBy: user.id,
    }).returning()

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
