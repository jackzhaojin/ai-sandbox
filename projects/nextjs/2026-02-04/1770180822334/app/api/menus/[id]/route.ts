import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { menus } from '@/lib/db/schema/menus'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { eq } = await import('drizzle-orm')
    const body = await request.json()
    const { name, location, items } = body

    // Update menu
    const [menu] = await db
      .update(menus)
      .set({
        ...(name && { name }),
        ...(location && { location }),
        ...(items && { items }),
        updatedBy: user.id,
        updatedAt: new Date()
      })
      .where(eq(menus.id, id))
      .returning()

    if (!menu) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        menu
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Menu update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update menu'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { eq } = await import('drizzle-orm')

    // Delete menu
    await db
      .delete(menus)
      .where(eq(menus.id, id))

    return NextResponse.json(
      {
        success: true,
        message: 'Menu deleted successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Menu deletion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete menu'
      },
      { status: 500 }
    )
  }
}
