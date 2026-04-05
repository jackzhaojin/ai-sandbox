"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, Package, User, LogOut, Building2, ChevronDown } from "lucide-react"

export interface NavItem {
  /** Navigation item label */
  label: string
  /** Navigation item href */
  href: string
  /** Whether the item is active */
  isActive?: boolean
  /** Icon component */
  icon?: React.ReactNode
}

export interface HeaderProps {
  /** Logo element or text */
  logo?: React.ReactNode
  /** Logo href */
  logoHref?: string
  /** Navigation items */
  navItems?: NavItem[]
  /** User display name */
  userName?: string
  /** User email */
  userEmail?: string
  /** Organization name */
  organizationName?: string
  /** Callback for logout */
  onLogout?: () => void
  /** Callback for profile click */
  onProfileClick?: () => void
  /** Additional CSS classes */
  className?: string
  /** Whether the header is sticky */
  sticky?: boolean
  /** Show mobile menu */
  showMobileMenu?: boolean
}

/**
 * Header - Main application header with navigation
 * 
 * Includes logo, navigation, user menu, and mobile responsive menu.
 * 
 * @example
 * <Header
 *   logo="B2B Shipping"
 *   navItems={[
 *     { label: "Dashboard", href: "/dashboard", isActive: true },
 *     { label: "Shipments", href: "/shipments" },
 *   ]}
 *   userName="John Doe"
 *   organizationName="Acme Corp"
 * />
 */
export function Header({
  logo = "B2B Shipping",
  logoHref = "/",
  navItems = [],
  userName,
  userEmail,
  organizationName,
  onLogout,
  onProfileClick,
  className,
  sticky = true,
  showMobileMenu = true,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header
      className={cn(
        "w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        sticky && "sticky top-0 z-sticky",
        className
      )}
      role="banner"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={logoHref}
          className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-90"
        >
          <Package className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">{logo}</span>
        </Link>

        {/* Desktop Navigation */}
        {navItems.length > 0 && (
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  item.isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={item.isActive ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* User Menu - Desktop */}
          {userName && (
            <div className="hidden md:flex items-center gap-4">
              {organizationName && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  <span className="max-w-[150px] truncate">{organizationName}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onProfileClick}
                  className="gap-2"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="max-w-[100px] truncate">{userName}</span>
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </Button>
                
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onLogout}
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {showMobileMenu && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {logo}
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 flex flex-col gap-6">
                  {/* Mobile Navigation */}
                  {navItems.length > 0 && (
                    <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                            item.isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          aria-current={item.isActive ? "page" : undefined}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  )}

                  {/* Mobile User Info */}
                  {userName && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{userName}</p>
                          {userEmail && (
                            <p className="text-sm text-muted-foreground truncate">
                              {userEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {organizationName && (
                        <div className="mt-2 flex items-center gap-2 px-3 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {organizationName}
                        </div>
                      )}
                      
                      <div className="mt-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            onProfileClick?.()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Button>
                        
                        {onLogout && (
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 text-error-600 hover:text-error-700"
                            onClick={() => {
                              onLogout()
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
