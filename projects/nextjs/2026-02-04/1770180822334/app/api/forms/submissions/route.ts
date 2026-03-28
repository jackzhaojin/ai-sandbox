import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formSubmissions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')
    const formId = searchParams.get('formId')
    const isRead = searchParams.get('isRead')

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Build query conditions
    const conditions = [eq(formSubmissions.siteId, siteId)]

    if (formId && formId !== 'all') {
      conditions.push(eq(formSubmissions.formId, formId))
    }

    if (isRead !== null && isRead !== undefined) {
      conditions.push(eq(formSubmissions.isRead, isRead === 'true'))
    }

    const submissions = await db
      .select()
      .from(formSubmissions)
      .where(and(...conditions))
      .orderBy(desc(formSubmissions.submittedAt))

    return NextResponse.json({
      submissions
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
