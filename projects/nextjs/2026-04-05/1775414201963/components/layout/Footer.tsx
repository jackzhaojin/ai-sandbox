"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Package, Mail, Phone, MapPin } from "lucide-react"

export interface FooterLink {
  /** Link label */
  label: string
  /** Link href */
  href: string
  /** Whether link opens in new tab */
  external?: boolean
}

export interface FooterColumn {
  /** Column title */
  title: string
  /** Column links */
  links: FooterLink[]
}

export interface FooterProps {
  /** Logo element or text */
  logo?: React.ReactNode
  /** Logo href */
  logoHref?: string
  /** Tagline or description */
  tagline?: string
  /** Footer columns */
  columns?: FooterColumn[]
  /** Contact information */
  contactInfo?: {
    email?: string
    phone?: string
    address?: string
  }
  /** Bottom links */
  bottomLinks?: FooterLink[]
  /** Copyright text */
  copyright?: string
  /** Additional CSS classes */
  className?: string
  /** Show minimal footer */
  minimal?: boolean
}

/**
 * Footer - Multi-column B2B footer component
 * 
 * @example
 * <Footer
 *   columns={[
 *     {
 *       title: "Product",
 *       links: [
 *         { label: "Features", href: "/features" },
 *         { label: "Pricing", href: "/pricing" },
 *       ],
 *     },
 *   ]}
 *   contactInfo={{
 *     email: "support@example.com",
 *     phone: "1-800-555-0123",
 *   }}
 * />
 */
export function Footer({
  logo = "B2B Shipping",
  logoHref = "/",
  tagline = "Enterprise shipping solutions for modern businesses",
  columns = [],
  contactInfo,
  bottomLinks = [],
  copyright = `© ${new Date().getFullYear()} B2B Shipping. All rights reserved.`,
  className,
  minimal = false,
}: FooterProps) {
  if (minimal) {
    return (
      <footer
        className={cn(
          "w-full border-t bg-background py-6",
          className
        )}
        role="contentinfo"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-lg font-bold text-foreground"
            >
              <Package className="h-5 w-5 text-primary" aria-hidden="true" />
              {logo}
            </Link>
            <p className="text-sm text-muted-foreground">{copyright}</p>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer
      className={cn(
        "w-full border-t bg-background",
        className
      )}
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-xl font-bold text-foreground"
            >
              <Package className="h-6 w-6 text-primary" aria-hidden="true" />
              {logo}
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {tagline}
            </p>
            
            {/* Contact Info */}
            {contactInfo && (
              <div className="mt-6 space-y-3">
                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {contactInfo.email}
                  </a>
                )}
                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {contactInfo.phone}
                  </a>
                )}
                {contactInfo.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{contactInfo.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Link Columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      {...(link.external && {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                    >
                      {link.label}
                      {link.external && (
                        <span className="sr-only"> (opens in new tab)</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {copyright}
          </p>
          
          {bottomLinks.length > 0 && (
            <nav aria-label="Footer secondary">
              <ul className="flex flex-wrap items-center gap-4">
                {bottomLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      {...(link.external && {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer
