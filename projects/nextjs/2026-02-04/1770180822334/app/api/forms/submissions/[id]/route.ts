import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formSubmissions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isRead, isSpam } = body

    const updates: any = {}
    if (isRead !== undefined) updates.isRead = isRead
    if (isSpam !== undefined) updates.isSpam = isSpam

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    const [updated] = await db
      .update(formSubmissions)
      .set(updates)
      .where(eq(formSubmissions.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      submission: updated
    })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const [deleted] = await db
      .delete(formSubmissions)
      .where(eq(formSubmissions.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
