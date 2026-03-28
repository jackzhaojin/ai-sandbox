import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/sites/[siteId]/seo
 * Update site-level SEO settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      defaultTitleTemplate,
      defaultMetaDescription,
      defaultOgImageId,
      robotsTxt,
      siteName,
    } = body

    // Build SEO settings object
    const seoSettings = {
      defaultTitleTemplate,
      defaultMetaDescription,
      defaultOgImageId,
      robotsTxt,
      siteName,
    }

    // Update site SEO settings
    const { data: site, error: updateError } = await supabase
      .from('sites')
      .update({
        seo_settings: seoSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating site SEO settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update SEO settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, site })
  } catch (error) {
    console.error('Error in PUT /api/sites/[siteId]/seo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
