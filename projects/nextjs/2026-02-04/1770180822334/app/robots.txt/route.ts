import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /robots.txt
 * Generate robots.txt from site settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get site URL from request
    const url = new URL(request.url)
    const siteUrl = `${url.protocol}//${url.host}`

    // Try to get the first site (in production, you'd identify by domain)
    const { data: site } = await supabase
      .from('sites')
      .select('seo_settings')
      .limit(1)
      .single()

    let robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: ${siteUrl}/sitemap.xml`

    // Use custom robots.txt if available
    if (site?.seo_settings) {
      const seoSettings = site.seo_settings as any
      if (seoSettings.robotsTxt) {
        robotsTxt = seoSettings.robotsTxt.replace('{site_url}', siteUrl)
      }
    }

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    // Return default robots.txt on error
    return new NextResponse(
      `User-agent: *
Allow: /`,
      {
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    )
  }
}
