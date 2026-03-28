import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string; memberId: string }> }
) {
  try {
    const { siteId, memberId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: membership, error: membershipError } = await supabase
      .from('site_members')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json({ error: 'Missing role' }, { status: 400 })
    }

    // Get the member being updated
    const { data: targetMember, error: targetError } = await supabase
      .from('site_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('site_id', siteId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent self-demotion
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 })
    }

    // If demoting from admin, ensure there's at least one other admin
    if (targetMember.role === 'admin' && role !== 'admin') {
      const { count, error: countError } = await supabase
        .from('site_members')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('role', 'admin')

      if (countError || count === null) {
        return NextResponse.json({ error: 'Failed to verify admin count' }, { status: 500 })
      }

      if (count <= 1) {
        return NextResponse.json({
          error: 'Cannot remove the last admin. Promote another user to admin first.'
        }, { status: 400 })
      }
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('site_members')
      .update({ role })
      .eq('id', memberId)
      .select(`
        id,
        user_id,
        role,
        joined_at,
        last_active_at,
        profiles:user_id (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating member:', updateError)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error) {
    console.error('Error in PATCH /api/sites/[siteId]/members/[memberId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ siteId: string; memberId: string }> }
) {
  try {
    const { siteId, memberId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: membership, error: membershipError } = await supabase
      .from('site_members')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get the member being removed
    const { data: targetMember, error: targetError } = await supabase
      .from('site_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('site_id', siteId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent self-removal
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself from the site' }, { status: 400 })
    }

    // If removing an admin, ensure there's at least one other admin
    if (targetMember.role === 'admin') {
      const { count, error: countError } = await supabase
        .from('site_members')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('role', 'admin')

      if (countError || count === null) {
        return NextResponse.json({ error: 'Failed to verify admin count' }, { status: 500 })
      }

      if (count <= 1) {
        return NextResponse.json({
          error: 'Cannot remove the last admin. Promote another user to admin first.'
        }, { status: 400 })
      }
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('site_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/sites/[siteId]/members/[memberId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
