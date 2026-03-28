import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/pages/[pageId]/seo
 * Update SEO settings for a page
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params
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
      seoTitle,
      seoDescription,
      ogTitle,
      ogDescription,
      ogImageId,
      canonicalUrl,
      noIndex,
      noFollow,
      structuredData,
    } = body

    // Update page SEO fields
    const { data: page, error: updateError } = await supabase
      .from('pages')
      .update({
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        og_title: ogTitle || null,
        og_description: ogDescription || null,
        og_image_id: ogImageId || null,
        canonical_url: canonicalUrl || null,
        no_index: noIndex || 'false',
        no_follow: noFollow || 'false',
        structured_data: structuredData || null,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating SEO settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update SEO settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, page })
  } catch (error) {
    console.error('Error in PUT /api/pages/[pageId]/seo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pages/[pageId]/seo
 * Get SEO settings for a page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch page SEO data
    const { data: page, error: fetchError } = await supabase
      .from('pages')
      .select('seo_title, seo_description, og_title, og_description, og_image_id, canonical_url, no_index, no_follow, structured_data, title, slug')
      .eq('id', pageId)
      .single()

    if (fetchError) {
      console.error('Error fetching SEO settings:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch SEO settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      seoTitle: page.seo_title,
      seoDescription: page.seo_description,
      ogTitle: page.og_title,
      ogDescription: page.og_description,
      ogImageId: page.og_image_id,
      canonicalUrl: page.canonical_url,
      noIndex: page.no_index,
      noFollow: page.no_follow,
      structuredData: page.structured_data,
      pageTitle: page.title,
      pageSlug: page.slug,
    })
  } catch (error) {
    console.error('Error in GET /api/pages/[pageId]/seo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
