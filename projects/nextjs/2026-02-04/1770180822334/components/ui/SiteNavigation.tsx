import Link from 'next/link'

interface MenuItem {
  label: string
  url: string
  openInNewTab?: boolean
}

interface SiteNavigationProps {
  siteName: string
  siteSlug: string
  logo?: string | null
  menuItems?: MenuItem[]
}

/**
 * SiteNavigation - Public site header/navigation
 *
 * Renders the site header with logo, site name, and navigation menu.
 * Used in the public layout for all published pages.
 */
export default function SiteNavigation({
  siteName,
  siteSlug,
  logo,
  menuItems = [],
}: SiteNavigationProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="container mx-auto px-4 py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          {/* Logo and site name */}
          <Link
            href={`/sites/${siteSlug}`}
            className="flex items-center gap-3 text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            {logo && (
              <img
                src={logo}
                alt={`${siteName} logo`}
                className="h-10 w-auto"
              />
            )}
            {siteName}
          </Link>

          {/* Navigation menu */}
          {menuItems.length > 0 && (
            <ul className="flex items-center gap-6">
              {menuItems.map((item, index) => (
                <li key={index}>
                  {item.openInNewTab ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.url}
                      className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </header>
  )
}
