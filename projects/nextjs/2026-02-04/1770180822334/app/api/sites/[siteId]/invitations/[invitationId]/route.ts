import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string; invitationId: string }> }
) {
  try {
    const { siteId, invitationId } = await params
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
    const { action } = body // 'resend' or 'revoke'

    if (!action || !['resend', 'revoke'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'resend') {
      // Update expires_at to 7 days from now
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + 7)

      const { data: invitation, error: updateError } = await supabase
        .from('invitations')
        .update({
          expires_at: newExpiresAt.toISOString(),
          status: 'pending'
        })
        .eq('id', invitationId)
        .eq('site_id', siteId)
        .select()
        .single()

      if (updateError) {
        console.error('Error resending invitation:', updateError)
        return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 })
      }

      // TODO: Resend email
      return NextResponse.json({ invitation })
    } else {
      // Revoke invitation
      const { data: invitation, error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .eq('site_id', siteId)
        .select()
        .single()

      if (updateError) {
        console.error('Error revoking invitation:', updateError)
        return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 })
      }

      return NextResponse.json({ invitation })
    }
  } catch (error) {
    console.error('Error in PATCH /api/sites/[siteId]/invitations/[invitationId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
