import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        status,
        site_id,
        expires_at,
        sites:site_id (
          id,
          name,
          slug
        )
      `)
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invitation link'
      }, { status: 404 })
    }

    // Check if invitation is already used
    if (invitation.status === 'accepted') {
      return NextResponse.json({
        valid: false,
        error: 'This invitation has already been accepted'
      }, { status: 400 })
    }

    // Check if invitation is revoked
    if (invitation.status === 'revoked') {
      return NextResponse.json({
        valid: false,
        error: 'This invitation has been revoked'
      }, { status: 400 })
    }

    // Check if invitation is expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      // Update status to expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json({
        valid: false,
        error: 'This invitation has expired'
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        site: invitation.sites
      }
    })
  } catch (error) {
    console.error('Error in POST /api/invitations/validate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
