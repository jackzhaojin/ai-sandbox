import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const siteId = searchParams.get('siteId')

    if (!query || !siteId) {
      return NextResponse.json({ error: 'Missing query or siteId' }, { status: 400 })
    }

    const searchTerm = `%${query.toLowerCase()}%`

    // Search pages
    const { data: pages } = await supabase
      .from('pages')
      .select('id, title, slug, status')
      .eq('site_id', siteId)
      .or(`title.ilike.${searchTerm},slug.ilike.${searchTerm}`)
      .limit(5)

    // Search media
    const { data: media } = await supabase
      .from('media')
      .select('id, file_name, alt_text, url, mime_type')
      .eq('site_id', siteId)
      .or(`file_name.ilike.${searchTerm},alt_text.ilike.${searchTerm}`)
      .limit(5)

    // Search fragments
    const { data: fragments } = await supabase
      .from('fragments')
      .select('id, name, description')
      .eq('site_id', siteId)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5)

    // Search templates
    const { data: templates } = await supabase
      .from('page_templates')
      .select('id, name, description')
      .eq('site_id', siteId)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5)

    // Get user profile for site membership check
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', user.id)
      .single()

    // Search users (members of this site only)
    const { data: members } = await supabase
      .from('site_members')
      .select(`
        user_id,
        profiles!inner(id, display_name, email)
      `)
      .eq('site_id', siteId)
      .or(`profiles.display_name.ilike.${searchTerm},profiles.email.ilike.${searchTerm}`)
      .limit(5)

    return NextResponse.json({
      pages: pages || [],
      media: media || [],
      fragments: fragments || [],
      templates: templates || [],
      users: members?.map(m => m.profiles) || [],
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}
