interface FooterLink {
  label: string
  url: string
  openInNewTab?: boolean
}

interface SiteFooterProps {
  siteName: string
  copyrightText?: string
  links?: FooterLink[]
}

/**
 * SiteFooter - Public site footer
 *
 * Renders the site footer with copyright and links.
 * Used in the public layout for all published pages.
 */
export default function SiteFooter({
  siteName,
  copyrightText,
  links = [],
}: SiteFooterProps) {
  const currentYear = new Date().getFullYear()
  const defaultCopyright = `© ${currentYear} ${siteName}. All rights reserved.`

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright text */}
          <p className="text-sm text-gray-600">
            {copyrightText || defaultCopyright}
          </p>

          {/* Footer links */}
          {links.length > 0 && (
            <ul className="flex items-center gap-6">
              {links.map((link, index) => (
                <li key={index}>
                  {link.openInNewTab ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.url}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  )
}
