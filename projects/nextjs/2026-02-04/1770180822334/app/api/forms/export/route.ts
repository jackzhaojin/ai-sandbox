import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formSubmissions } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {}

  for (const key in obj) {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey))
    } else if (Array.isArray(value)) {
      flattened[newKey] = value.join(', ')
    } else {
      flattened[newKey] = String(value || '')
    }
  }

  return flattened
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

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

    if (submissions.length === 0) {
      return new NextResponse('No submissions found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    // Collect all unique field names from all submissions
    const allFields = new Set<string>()
    const flattenedSubmissions = submissions.map(submission => {
      const flattened = flattenObject(submission.data)
      Object.keys(flattened).forEach(key => allFields.add(key))
      return {
        id: submission.id,
        formName: submission.formName,
        submittedAt: submission.submittedAt,
        submittedByIp: submission.submittedByIp,
        isRead: submission.isRead,
        isSpam: submission.isSpam,
        ...flattened
      }
    })

    // Create CSV header
    const headers = [
      'ID',
      'Form Name',
      'Submitted At',
      'IP Address',
      'Read',
      'Spam',
      ...Array.from(allFields).sort()
    ]

    // Create CSV rows
    const rows = flattenedSubmissions.map(submission => {
      return [
        submission.id,
        submission.formName,
        submission.submittedAt,
        submission.submittedByIp,
        submission.isRead ? 'Yes' : 'No',
        submission.isSpam ? 'Yes' : 'No',
        ...Array.from(allFields).map(field => submission[field as keyof typeof submission] || '')
      ].map(value => escapeCSVValue(String(value)))
    })

    // Combine header and rows
    const csv = [
      headers.map(h => escapeCSVValue(h)).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="form-submissions-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
