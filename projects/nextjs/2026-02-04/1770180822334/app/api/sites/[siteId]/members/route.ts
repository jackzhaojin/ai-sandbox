import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this site (any role)
    const { data: membership, error: membershipError } = await supabase
      .from('site_members')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all members for this site with their profile info
    const { data: members, error: membersError } = await supabase
      .from('site_members')
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
      .eq('site_id', siteId)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    return NextResponse.json({ members, currentUserRole: membership.role })
  } catch (error) {
    console.error('Error in GET /api/sites/[siteId]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
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
    const { user_id, role } = body

    if (!user_id || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Add member to site
    const { data: newMember, error: addError } = await supabase
      .from('site_members')
      .insert({
        site_id: siteId,
        user_id,
        role
      })
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

    if (addError) {
      console.error('Error adding member:', addError)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    return NextResponse.json({ member: newMember })
  } catch (error) {
    console.error('Error in POST /api/sites/[siteId]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
