import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/sites/[siteId]/settings
 * Update site settings (general, branding, analytics, custom code, social, error pages)
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
      name,
      description,
      faviconMediaId,
      logoMediaId,
      themeConfig,
      customHeadHtml,
      customCss,
      analyticsConfig,
      socialLinks,
      errorPages,
      settings,
    } = body

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Add fields if they are provided
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (faviconMediaId !== undefined) updateData.favicon_media_id = faviconMediaId || null
    if (logoMediaId !== undefined) updateData.logo_media_id = logoMediaId || null
    if (themeConfig !== undefined) updateData.theme_config = themeConfig
    if (customHeadHtml !== undefined) updateData.custom_head_html = customHeadHtml
    if (customCss !== undefined) updateData.custom_css = customCss
    if (analyticsConfig !== undefined) updateData.analytics_config = analyticsConfig
    if (socialLinks !== undefined) updateData.social_links = socialLinks
    if (errorPages !== undefined) updateData.error_pages = errorPages
    if (settings !== undefined) updateData.settings = settings

    // Update site settings
    const { data: site, error: updateError } = await supabase
      .from('sites')
      .update(updateData)
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating site settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update site settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, site })
  } catch (error) {
    console.error('Error in PUT /api/sites/[siteId]/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
