import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; keyId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId, keyId } = await params

    // Soft delete by setting isActive to false
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(
        and(eq(apiKeys.id, keyId), eq(apiKeys.siteId, siteId))
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to revoke API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
