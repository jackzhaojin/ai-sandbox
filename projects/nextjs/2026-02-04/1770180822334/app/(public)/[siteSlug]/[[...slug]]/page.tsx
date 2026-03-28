import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { ComponentRenderer, resolveFragments } from '@/lib/server-component-renderer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Enable ISR with 60 second revalidation
export const revalidate = 60

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

// Helper function to generate analytics scripts
function generateAnalyticsScripts(analyticsConfig: any): string {
  if (!analyticsConfig || Object.keys(analyticsConfig).length === 0) {
    return ''
  }

  const { ga4Id, gtmId, plausibleDomain, customScripts } = analyticsConfig
  let scripts = ''

  // Google Analytics 4
  if (ga4Id && ga4Id.startsWith('G-')) {
    scripts += `
      <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${ga4Id}');
      </script>
    `
  }

  // Google Tag Manager
  if (gtmId && gtmId.startsWith('GTM-')) {
    scripts += `
      <script>
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      </script>
    `
  }

  // Plausible Analytics
  if (plausibleDomain) {
    scripts += `
      <script defer data-domain="${plausibleDomain}" src="https://plausible.io/js/script.js"></script>
    `
  }

  // Custom scripts
  if (customScripts) {
    scripts += customScripts
  }

  return scripts
}

interface PageProps {
  params: Promise<{
    siteSlug: string
    slug?: string[]
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteSlug, slug } = await params
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get site
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, seo_settings')
    .eq('slug', siteSlug)
    .single()

  if (!site) {
    return {}
  }

  // Build page path
  const pagePath = '/' + (slug?.join('/') || '')

  // Get page
  const { data: page } = await supabase
    .from('pages')
    .select('title, seo_title, seo_description, og_title, og_description, og_image_id, canonical_url, no_index, no_follow, structured_data')
    .eq('site_id', site.id)
    .eq('path', pagePath)
    .eq('status', 'published')
    .single()

  if (!page) {
    return {}
  }

  // Build metadata
  const seoSettings = site.seo_settings as any || {}
  const siteName = seoSettings.siteName || site.name

  // Generate title using template
  let title = page.seo_title || page.title
  if (seoSettings.defaultTitleTemplate && title) {
    title = seoSettings.defaultTitleTemplate
      .replace('{page_title}', title)
      .replace('{site_name}', siteName)
  }

  // Use meta description or fallback
  const description = page.seo_description || seoSettings.defaultMetaDescription || ''

  // Build metadata object
  const metadata: Metadata = {
    title,
    description,
  }

  // Robots meta
  if (page.no_index === 'true' || page.no_follow === 'true') {
    const robots: string[] = []
    if (page.no_index === 'true') robots.push('noindex')
    if (page.no_follow === 'true') robots.push('nofollow')
    metadata.robots = robots.join(', ')
  }

  // Open Graph
  metadata.openGraph = {
    title: page.og_title || title,
    description: page.og_description || description,
    type: 'website',
  }

  // Twitter Card
  metadata.twitter = {
    card: 'summary_large_image',
    title: page.og_title || title,
    description: page.og_description || description,
  }

  // Canonical URL
  if (page.canonical_url) {
    metadata.alternates = {
      canonical: page.canonical_url,
    }
  }

  return metadata
}

// Page component
export default async function PublicPage({ params }: PageProps) {
  const { siteSlug, slug } = await params
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get site with theme and settings
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, theme_config, custom_head_html, custom_css, analytics_config')
    .eq('slug', siteSlug)
    .is('deleted_at', null)
    .single()

  if (!site) {
    notFound()
  }

  // Build page path
  const pagePath = '/' + (slug?.join('/') || '')

  // Get page and its published version
  const { data: page } = await supabase
    .from('pages')
    .select('id, title, published_version_id, structured_data')
    .eq('site_id', site.id)
    .eq('path', pagePath)
    .eq('status', 'published')
    .single()

  if (!page) {
    notFound()
  }

  // Get published version with components
  const { data: version } = await supabase
    .from('page_versions')
    .select('content')
    .eq('id', page.published_version_id!)
    .single()

  const components = (version?.content as any)?.components || []

  // Resolve fragments server-side
  const resolvedComponents = await resolveFragments({
    siteId: site.id,
    components,
  })

  // Generate theme CSS from theme_config
  const themeConfig = (site.theme_config as any) || {}
  const themeCss = generateThemeCSS(themeConfig)

  // Get analytics config
  const analyticsConfig = (site.analytics_config as any) || {}
  const analyticsScripts = generateAnalyticsScripts(analyticsConfig)

  return (
    <div className="min-h-screen bg-white">
      {/* Inject custom head HTML */}
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

      {/* Inject analytics scripts */}
      {analyticsScripts && (
        <div dangerouslySetInnerHTML={{ __html: analyticsScripts }} />
      )}

      {/* Render structured data if present */}
      {page.structured_data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: page.structured_data }}
        />
      )}

      {/* Skip navigation link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Page content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">{page.title}</h1>

        {/* Render resolved components */}
        <div className="space-y-8">
          {resolvedComponents.map((component: any, index: number) => (
            <ComponentRenderer
              key={component.id || index}
              component={component}
              mode="public"
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
