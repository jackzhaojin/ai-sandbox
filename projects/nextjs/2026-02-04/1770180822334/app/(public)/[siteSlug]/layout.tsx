import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SiteNavigation from '@/components/ui/SiteNavigation'
import SiteFooter from '@/components/ui/SiteFooter'
import MaintenancePage from '@/components/ui/MaintenancePage'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface SiteLayoutProps {
  children: React.ReactNode
  params: Promise<{
    siteSlug: string
  }>
}

/**
 * Site-Specific Layout
 *
 * Wraps all pages for a specific site with:
 * - Site-specific HTML lang attribute
 * - Favicon from site settings
 * - Theme CSS variables from theme_config
 * - Custom CSS from site settings
 * - Analytics scripts from analytics_config
 * - Custom head HTML
 * - Site navigation (header)
 * - Site footer
 * - Maintenance mode check
 */
export default async function SiteLayout({
  children,
  params,
}: SiteLayoutProps) {
  const { siteSlug } = await params
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get site with all settings
  const { data: site, error } = await supabase
    .from('sites')
    .select('id, name, slug, favicon_id, theme_config, custom_css, analytics_config, custom_head_html, maintenance_mode_enabled, maintenance_message')
    .eq('slug', siteSlug)
    .is('deleted_at', null)
    .single()

  if (error || !site) {
    notFound()
  }

  // Check if maintenance mode is enabled
  if (site.maintenance_mode_enabled) {
    return (
      <MaintenancePage
        siteName={site.name}
        message={site.maintenance_message || undefined}
      />
    )
  }

  // Get theme config
  const themeConfig = (site.theme_config as any) || {}
  const htmlLang = themeConfig.language || 'en'

  // Generate theme CSS
  const themeCss = generateThemeCSS(themeConfig)

  // Generate analytics scripts
  const analyticsConfig = (site.analytics_config as any) || {}
  const analyticsScripts = generateAnalyticsScripts(analyticsConfig)

  // Get site navigation menu (from header/footer settings if available)
  // For now, use a basic menu structure
  const menuItems: Array<{ label: string; url: string; openInNewTab?: boolean }> = []

  // Get favicon URL if set
  let faviconUrl = '/favicon.ico'
  if (site.favicon_id) {
    const { data: favicon } = await supabase
      .from('media')
      .select('url')
      .eq('id', site.favicon_id)
      .single()

    if (favicon?.url) {
      faviconUrl = favicon.url
    }
  }

  return (
    <>
      {/* Skip Navigation Links - WCAG 2.1 AA */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#site-navigation" className="skip-link">
        Skip to navigation
      </a>

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

      {/* Site Navigation */}
      <nav id="site-navigation" aria-label="Site navigation">
        <SiteNavigation
          siteName={site.name}
          siteSlug={site.slug}
          menuItems={menuItems}
        />
      </nav>

      {/* Main content */}
      <main id="main-content" role="main" tabIndex={-1}>
        {children}
      </main>

      {/* Site Footer */}
      <SiteFooter
        siteName={site.name}
      />
    </>
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
