import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Page {
  id: string
  title: string
  status: string
  scheduled_publish_at: string
  site_id: string
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current timestamp
    const now = new Date().toISOString()

    // Find all pages that are scheduled and past their publish time
    const { data: scheduledPages, error: fetchError } = await supabase
      .from('pages')
      .select('id, title, status, scheduled_publish_at, site_id')
      .eq('status', 'scheduled')
      .lte('scheduled_publish_at', now)

    if (fetchError) {
      console.error('Error fetching scheduled pages:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled pages', details: fetchError }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (!scheduledPages || scheduledPages.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No pages to publish',
          publishedCount: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Found ${scheduledPages.length} page(s) to publish`)

    // Publish each page
    const publishResults = []
    for (const page of scheduledPages as Page[]) {
      try {
        // Update page status to published
        const { error: updateError } = await supabase
          .from('pages')
          .update({
            status: 'published',
            published_at: now,
            updated_at: now,
          })
          .eq('id', page.id)

        if (updateError) {
          console.error(`Error publishing page ${page.id}:`, updateError)
          publishResults.push({
            pageId: page.id,
            title: page.title,
            success: false,
            error: updateError.message,
          })
        } else {
          console.log(`Successfully published page: ${page.title} (${page.id})`)

          // Log activity
          await supabase.from('activity_log').insert({
            site_id: page.site_id,
            entity_type: 'page',
            entity_id: page.id,
            action: 'auto_published',
            metadata: {
              scheduledAt: page.scheduled_publish_at,
              publishedAt: now,
            },
          })

          publishResults.push({
            pageId: page.id,
            title: page.title,
            success: true,
          })
        }
      } catch (error) {
        console.error(`Exception publishing page ${page.id}:`, error)
        publishResults.push({
          pageId: page.id,
          title: page.title,
          success: false,
          error: error.message,
        })
      }
    }

    const successCount = publishResults.filter((r) => r.success).length
    const failureCount = publishResults.filter((r) => !r.success).length

    return new Response(
      JSON.stringify({
        message: `Auto-publish completed`,
        publishedCount: successCount,
        failedCount: failureCount,
        results: publishResults,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error in auto-publish function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
