/**
 * Server-side component rendering utilities
 *
 * This file contains server-side logic for:
 * - Resolving fragment references recursively
 * - Re-exporting the client component renderer
 */

// Re-export client component renderer
export { default as ComponentRenderer } from './client-component-renderer'

interface ComponentInstance {
  id?: string
  type: string
  props?: Record<string, any>
}

/**
 * Server-side Fragment Resolver
 *
 * Recursively resolves fragment references and returns flattened component array.
 * This runs on the server only and fetches fragment data from the database.
 */
interface FragmentResolverProps {
  siteId: string
  components: ComponentInstance[]
}

export async function resolveFragments({ siteId, components }: FragmentResolverProps): Promise<ComponentInstance[]> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const resolved: ComponentInstance[] = []

  for (const component of components) {
    if (component.type === 'fragment') {
      const fragmentId = component.props?.fragmentId

      if (!fragmentId) {
        // No fragment selected, skip
        continue
      }

      try {
        // Fetch fragment from database
        const { data: fragment, error } = await supabase
          .from('content_fragments')
          .select('content')
          .eq('id', fragmentId)
          .eq('site_id', siteId)
          .single()

        if (error || !fragment) {
          console.error(`Failed to load fragment ${fragmentId}:`, error)
          // Skip broken fragments in production
          continue
        }

        // Recursively resolve nested fragments
        const fragmentContent = (fragment.content as any) || []
        const resolvedFragmentContent = await resolveFragments({
          siteId,
          components: fragmentContent,
        })

        // Add resolved fragment content to output
        resolved.push(...resolvedFragmentContent)
      } catch (err) {
        console.error(`Error resolving fragment ${fragmentId}:`, err)
        // Skip on error
        continue
      }
    } else {
      // Regular component, add as-is
      resolved.push(component)
    }
  }

  return resolved
}
