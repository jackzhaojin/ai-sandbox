import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

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

    // Get pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        status,
        token,
        created_at,
        expires_at,
        profiles:invited_by (
          name,
          email
        )
      `)
      .eq('site_id', siteId)
      .in('status', ['pending', 'expired'])
      .order('created_at', { ascending: false })

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error in GET /api/sites/[siteId]/invitations:', error)
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
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate role
    if (!['viewer', 'author', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user already has access to this site
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from('site_members')
        .select('id')
        .eq('site_id', siteId)
        .eq('user_id', existingProfile.id)
        .single()

      if (existingMember) {
        return NextResponse.json({
          error: 'User already has access to this site'
        }, { status: 400 })
      }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('site_id', siteId)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json({
        error: 'An invitation has already been sent to this email'
        }, { status: 400 })
    }

    // Generate secure token (32 bytes = 256 bits)
    const token = randomBytes(32).toString('base64url')

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        site_id: siteId,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Get site name for email
    const { data: site } = await supabase
      .from('sites')
      .select('name')
      .eq('id', siteId)
      .single()

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`

    // TODO: Send invitation email
    // For now, just return the invitation with the link
    console.log(`Invitation created for ${email} to ${site?.name}`)
    console.log(`Invite URL: ${inviteUrl}`)

    return NextResponse.json({
      invitation,
      inviteUrl
    })
  } catch (error) {
    console.error('Error in POST /api/sites/[siteId]/invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
