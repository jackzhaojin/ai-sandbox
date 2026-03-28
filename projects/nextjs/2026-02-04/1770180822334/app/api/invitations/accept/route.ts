import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    }

    // Verify invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json({
        error: 'This invitation is no longer valid'
      }, { status: 400 })
    }

    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify email matches (case-insensitive)
    if (profile.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        error: 'This invitation is for a different email address'
      }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('site_members')
      .select('id')
      .eq('site_id', invitation.site_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Mark invitation as accepted anyway
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      return NextResponse.json({
        success: true,
        message: 'You already have access to this site',
        siteId: invitation.site_id
      })
    }

    // Add user to site
    const { error: memberError } = await supabase
      .from('site_members')
      .insert({
        site_id: invitation.site_id,
        user_id: user.id,
        role: invitation.role
      })

    if (memberError) {
      console.error('Error adding member:', memberError)
      return NextResponse.json({ error: 'Failed to add you to the site' }, { status: 500 })
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      // Don't fail - user was already added to site
    }

    return NextResponse.json({
      success: true,
      siteId: invitation.site_id
    })
  } catch (error) {
    console.error('Error in POST /api/invitations/accept:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
