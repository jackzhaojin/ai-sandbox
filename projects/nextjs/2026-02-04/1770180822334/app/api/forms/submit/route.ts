import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formSubmissions } from '@/lib/db/schema'

// Rate limiting: in-memory store (for production, use Redis or a database)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function getRateLimitKey(ip: string): string {
  return `rate_limit:${ip}`
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(ip)
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(key)
  }

  const currentEntry = rateLimitStore.get(key)

  if (!currentEntry) {
    // First request in this window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (currentEntry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  // Increment count
  currentEntry.count++
  rateLimitStore.set(key, currentEntry)

  return { allowed: true, remaining: RATE_LIMIT_MAX - currentEntry.count }
}

function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

interface FieldValidation {
  name: string
  required?: boolean
  type?: 'email' | 'phone' | 'number' | 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
}

function validateField(
  fieldName: string,
  value: any,
  validation: FieldValidation
): string | null {
  const stringValue = typeof value === 'string' ? value : String(value || '')

  // Required validation
  if (validation.required && !stringValue) {
    return `${fieldName} is required`
  }

  if (!stringValue && !validation.required) {
    return null // Skip other validations if empty and not required
  }

  // Email validation
  if (validation.type === 'email' && !validateEmail(stringValue)) {
    return 'Please enter a valid email address'
  }

  // Phone validation
  if (validation.type === 'phone') {
    const phonePattern = /^[\d\s\-\(\)\+]+$/
    if (!phonePattern.test(stringValue)) {
      return 'Please enter a valid phone number'
    }
  }

  // Number validation
  if (validation.type === 'number') {
    const numValue = parseFloat(stringValue)
    if (isNaN(numValue)) {
      return 'Please enter a valid number'
    }
    if (validation.min !== undefined && numValue < validation.min) {
      return `Value must be at least ${validation.min}`
    }
    if (validation.max !== undefined && numValue > validation.max) {
      return `Value must be at most ${validation.max}`
    }
  }

  // Length validation
  if (validation.minLength && stringValue.length < validation.minLength) {
    return `Must be at least ${validation.minLength} characters`
  }
  if (validation.maxLength && stringValue.length > validation.maxLength) {
    return `Must be at most ${validation.maxLength} characters`
  }

  // Pattern validation
  if (validation.pattern) {
    try {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(stringValue)) {
        return 'Please match the requested format'
      }
    } catch (error) {
      console.error('Invalid regex pattern:', validation.pattern)
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limit
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitStore.get(getRateLimitKey(ip))?.resetAt || Date.now())
          }
        }
      )
    }

    const body = await request.json()
    const {
      siteId,
      pageId,
      formId,
      formName,
      validations,
      data,
      honeypot // Check honeypot field
    } = body

    // Honeypot spam check - if filled, it's spam
    if (honeypot && honeypot.trim() !== '') {
      console.log('Spam detected via honeypot')
      // Return success to not alert the spammer
      return NextResponse.json({ success: true })
    }

    // Validate required fields
    if (!siteId || !formId || !formName || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, formId, formName, data' },
        { status: 400 }
      )
    }

    // Validate each field if validations are provided
    if (validations && Array.isArray(validations)) {
      const errors: Record<string, string> = {}

      for (const validation of validations) {
        const fieldValue = data[validation.name]
        const error = validateField(validation.name, fieldValue, validation)

        if (error) {
          errors[validation.name] = error
        }
      }

      if (Object.keys(errors).length > 0) {
        return NextResponse.json(
          { error: 'Validation failed', errors },
          { status: 400 }
        )
      }
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined

    // Store submission in database
    const [submission] = await db.insert(formSubmissions).values({
      siteId,
      pageId: pageId || null,
      formId,
      formName,
      data,
      submittedByIp: ip,
      userAgent,
      isRead: false,
      isSpam: false
    }).returning()

    // TODO: Send email notification if configured
    // This would require checking site settings for notification emails
    // and using a service like Resend, SendGrid, or Supabase Edge Function

    return NextResponse.json(
      {
        success: true,
        submissionId: submission.id
      },
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': String(rateLimit.remaining)
        }
      }
    )

  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
