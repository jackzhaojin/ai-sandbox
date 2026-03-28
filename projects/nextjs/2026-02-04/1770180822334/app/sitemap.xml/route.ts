import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /sitemap.xml
 * Generate sitemap for all published pages
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get site domain from request URL
    const url = new URL(request.url)
    const siteUrl = `${url.protocol}//${url.host}`

    // Fetch all published pages that are not marked as no_index
    const { data: pages, error } = await supabase
      .from('pages')
      .select('slug, path, updated_at, no_index')
      .eq('status', 'published')
      .neq('no_index', 'true')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching pages for sitemap:', error)
      return new NextResponse('Error generating sitemap', { status: 500 })
    }

    // Build sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${new Date(page.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
