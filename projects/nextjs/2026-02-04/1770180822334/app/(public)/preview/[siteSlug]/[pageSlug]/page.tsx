import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import PreviewBanner from '@/components/ui/PreviewBanner'
import { ComponentRenderer, resolveFragments } from '@/lib/server-component-renderer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface PreviewPageProps {
  params: Promise<{
    siteSlug: string
    pageSlug: string
  }>
  searchParams: Promise<{
    v?: string // Version number
  }>
}

// Metadata for preview pages
export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { pageSlug } = await params

  return {
    title: `Preview: ${pageSlug}`,
    robots: 'noindex, nofollow', // Never index preview pages
  }
}

// Preview page component - requires authentication
export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { siteSlug, pageSlug } = await params
  const { v: versionParam } = await searchParams

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Check authentication
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('sb-access-token')

  if (!authCookie) {
    // Not authenticated, redirect to login
    redirect(`/auth/login?redirect=/preview/${siteSlug}/${pageSlug}${versionParam ? `?v=${versionParam}` : ''}`)
  }

  // Get site
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id, name, theme_config, custom_head_html, custom_css, analytics_config')
    .eq('slug', siteSlug)
    .is('deleted_at', null)
    .single()

  if (siteError || !site) {
    notFound()
  }

  // Build page path from slug
  const pagePath = pageSlug === 'index' ? '/' : `/${pageSlug}`

  // Get page
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id, title, current_version, published_version_id, structured_data')
    .eq('site_id', site.id)
    .eq('path', pagePath)
    .single()

  if (pageError || !page) {
    notFound()
  }

  // Determine which version to load
  let versionId: string | null = null
  let versionNumber: number | undefined = undefined

  if (versionParam) {
    // Load specific version by number
    versionNumber = parseInt(versionParam, 10)

    const { data: specificVersion } = await supabase
      .from('page_versions')
      .select('id, content')
      .eq('page_id', page.id)
      .eq('version', versionNumber)
      .single()

    if (specificVersion) {
      versionId = specificVersion.id
    } else {
      // Version not found, fall back to current
      versionId = page.current_version
    }
  } else {
    // Load current draft version
    versionId = page.current_version
  }

  if (!versionId) {
    // No version available
    return (
      <div className="min-h-screen bg-gray-50">
        <PreviewBanner siteSlug={siteSlug} pageSlug={pageSlug} version={versionNumber} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{page.title}</h1>
            <p className="text-gray-600">No version available for preview.</p>
          </div>
        </div>
      </div>
    )
  }

  // Get version content
  const { data: version } = await supabase
    .from('page_versions')
    .select('content, version')
    .eq('id', versionId)
    .single()

  if (!version) {
    notFound()
  }

  const components = (version.content as any)?.components || []

  // Resolve fragments server-side
  const resolvedComponents = await resolveFragments({
    siteId: site.id,
    components,
  })

  // Generate theme CSS
  const themeConfig = (site.theme_config as any) || {}
  const themeCss = generateThemeCSS(themeConfig)

  return (
    <div className="min-h-screen bg-white">
      {/* Preview banner */}
      <PreviewBanner
        siteSlug={siteSlug}
        pageSlug={pageSlug}
        version={versionNumber || version.version}
      />

      {/* Inject custom head HTML (preview only, be cautious) */}
      {site.custom_head_html && (
        <div dangerouslySetInnerHTML={{ __html: site.custom_head_html }} />
      )}

      {/* Inject theme CSS */}
      {themeCss && (
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      )}

      {/* Inject custom CSS */}
      {site.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: site.custom_css }} />
      )}

      {/* Skip navigation link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Page content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">{page.title}</h1>

        {/* Render resolved components in preview mode */}
        <div className="space-y-8">
          {resolvedComponents.map((component, index) => (
            <ComponentRenderer
              key={component.id || index}
              component={component}
              mode="preview"
            />
          ))}
        </div>

        {resolvedComponents.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No content available
          </div>
        )}
      </main>
    </div>
  )
}

// Helper function to generate theme CSS
function generateThemeCSS(themeConfig: any): string {
  if (!themeConfig || Object.keys(themeConfig).length === 0) {
    return ''
  }

  const {
    primary = '#3b82f6',
    secondary = '#8b5cf6',
    accent = '#10b981',
    bodyFont = 'system-ui',
    headingFont = 'system-ui',
    borderRadius = 'md',
    darkMode = false,
  } = themeConfig

  const borderRadiusValue =
    borderRadius === 'none' ? '0' :
    borderRadius === 'sm' ? '0.25rem' :
    borderRadius === 'md' ? '0.5rem' :
    borderRadius === 'lg' ? '1rem' :
    borderRadius === 'full' ? '9999px' : '0.5rem'

  const bodyFontFamily = bodyFont === 'system-ui'
    ? 'system-ui, -apple-system, sans-serif'
    : `'${bodyFont}', sans-serif`

  const headingFontFamily = headingFont === 'system-ui'
    ? 'system-ui, -apple-system, sans-serif'
    : `'${headingFont}', sans-serif`

  return `
    :root {
      --pf-primary: ${primary};
      --pf-secondary: ${secondary};
      --pf-accent: ${accent};
      --pf-border-radius: ${borderRadiusValue};
      --pf-body-font: ${bodyFontFamily};
      --pf-heading-font: ${headingFontFamily};
    }

    body {
      font-family: var(--pf-body-font);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--pf-heading-font);
    }

    ${darkMode ? `
    body {
      background-color: #111827;
      color: #f9fafb;
    }
    ` : ''}
  `
}
