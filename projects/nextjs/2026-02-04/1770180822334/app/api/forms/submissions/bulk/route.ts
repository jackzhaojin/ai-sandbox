import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formSubmissions } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, action } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      )
    }

    if (!action || !['read', 'spam', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (read, spam, delete) is required' },
        { status: 400 }
      )
    }

    let result: any[] = []

    if (action === 'delete') {
      result = await db
        .delete(formSubmissions)
        .where(inArray(formSubmissions.id, ids))
        .returning()
    } else if (action === 'read') {
      result = await db
        .update(formSubmissions)
        .set({ isRead: true })
        .where(inArray(formSubmissions.id, ids))
        .returning()
    } else if (action === 'spam') {
      result = await db
        .update(formSubmissions)
        .set({ isSpam: true })
        .where(inArray(formSubmissions.id, ids))
        .returning()
    }

    return NextResponse.json({
      success: true,
      count: result.length
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
