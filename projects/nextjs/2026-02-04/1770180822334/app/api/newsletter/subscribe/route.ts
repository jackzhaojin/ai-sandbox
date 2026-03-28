import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { newsletterSubscribers } from '@/lib/db/schema/newsletter-subscribers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the user's site ID (or use default)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // Get email from request
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address'
        },
        { status: 400 }
      )
    }

    const { db } = await import('@/lib/db')

    // Get the site ID from query params or use a default
    const url = new URL(request.url)
    const siteId = url.searchParams.get('siteId') || body.siteId

    if (!siteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site ID is required'
        },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const { eq } = await import('drizzle-orm')
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Already subscribed',
          alreadySubscribed: true
        },
        { status: 200 }
      )
    }

    // Add subscriber
    const [subscriber] = await db
      .insert(newsletterSubscribers)
      .values({
        siteId,
        email,
        status: 'subscribed'
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        subscriberId: subscriber.id,
        message: 'Successfully subscribed to newsletter'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to subscribe to newsletter'
      },
      { status: 500 }
    )
  }
}
