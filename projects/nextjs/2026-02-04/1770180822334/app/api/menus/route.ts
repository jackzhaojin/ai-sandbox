import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { menus } from '@/lib/db/schema/menus'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { db } = await import('@/lib/db')
    const { eq, and } = await import('drizzle-orm')

    // Get query parameters
    const url = new URL(request.url)
    const siteId = url.searchParams.get('siteId')
    const location = url.searchParams.get('location') as 'header' | 'footer' | 'sidebar' | 'custom' | null

    if (!siteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site ID is required'
        },
        { status: 400 }
      )
    }

    // Build query conditions
    const conditions = [eq(menus.siteId, siteId)]
    if (location) {
      conditions.push(eq(menus.location, location))
    }

    // Fetch menus
    const menuData = await db
      .select()
      .from(menus)
      .where(and(...conditions))
      .limit(1)

    if (menuData.length === 0) {
      return NextResponse.json(
        {
          success: true,
          items: [],
          message: 'No menu found for this location'
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        ...menuData[0]
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Menu fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menu'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { db } = await import('@/lib/db')
    const body = await request.json()
    const { siteId, name, location, items } = body

    if (!siteId || !name || !location || !items) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create menu
    const [menu] = await db
      .insert(menus)
      .values({
        siteId,
        name,
        location,
        items,
        createdBy: user.id,
        updatedBy: user.id
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        menu
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Menu creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create menu'
      },
      { status: 500 }
    )
  }
}
