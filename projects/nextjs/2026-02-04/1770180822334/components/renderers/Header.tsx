'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'

export interface MenuItem {
  id: string
  type: 'page' | 'url' | 'fragment' | 'divider'
  label: string
  icon?: string
  target?: '_self' | '_blank'
  cssClass?: string
  pageId?: string
  url?: string
  fragmentId?: string
  children?: MenuItem[]
}

export interface HeaderProps {
  logo?: {
    src: string
    alt: string
    width?: number
    height?: number
  }
  menuItems?: MenuItem[]
  ctaButton?: {
    text: string
    url: string
  }
  variant?: 'default' | 'centered' | 'transparent' | 'minimal'
  sticky?: boolean
  siteId?: string // For fetching menu from API
}

export default function Header({
  logo,
  menuItems = [],
  ctaButton,
  variant = 'default',
  sticky = true,
  siteId
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [menuData, setMenuData] = useState<MenuItem[]>(menuItems)

  // Fetch menu data if siteId is provided
  useEffect(() => {
    if (siteId && menuItems.length === 0) {
      fetch(`/api/menus?siteId=${siteId}&location=header`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.items) {
            setMenuData(data.items)
          }
        })
        .catch((err) => {
          console.error('Failed to fetch header menu:', err)
        })
    }
  }, [siteId, menuItems.length])

  // Handle scroll for sticky header
  useEffect(() => {
    if (!sticky) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sticky])

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleSubmenu = (itemId: string) => {
    setOpenSubmenu(openSubmenu === itemId ? null : itemId)
  }

  const containerClasses = {
    default: 'bg-white border-b border-gray-200',
    centered: 'bg-white border-b border-gray-200',
    transparent: 'bg-transparent',
    minimal: 'bg-white'
  }

  const stickyClasses = sticky
    ? `fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
        isScrolled ? 'shadow-md' : ''
      }`
    : ''

  const layoutClasses = {
    default: 'flex items-center justify-between',
    centered: 'flex flex-col items-center space-y-4 md:space-y-0 md:flex-row md:justify-between',
    transparent: 'flex items-center justify-between',
    minimal: 'flex items-center justify-between'
  }

  const getItemHref = (item: MenuItem): string => {
    if (item.type === 'page' && item.pageId) {
      return `/page/${item.pageId}` // Adjust based on your routing
    }
    if (item.type === 'url' && item.url) {
      return item.url
    }
    if (item.type === 'fragment' && item.fragmentId) {
      return `#${item.fragmentId}`
    }
    return '#'
  }

  const renderMenuItem = (item: MenuItem, isMobile: boolean = false) => {
    // Skip dividers in navigation
    if (item.type === 'divider') {
      return <div key={item.id} className="border-t border-gray-200 my-2" />
    }

    const hasChildren = item.children && item.children.length > 0
    const href = getItemHref(item)
    const target = item.target || '_self'

    if (isMobile) {
      return (
        <div key={item.id} className={item.cssClass}>
          <div className="flex items-center justify-between">
            <Link
              href={href}
              target={target}
              className="block py-2 px-4 text-gray-700 hover:bg-gray-100 flex-1"
              onClick={() => !hasChildren && setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
            {hasChildren && (
              <button
                onClick={() => toggleSubmenu(item.id)}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-expanded={openSubmenu === item.id}
                aria-label={`Toggle ${item.label} submenu`}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openSubmenu === item.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          </div>
          {hasChildren && openSubmenu === item.id && (
            <div className="pl-4 bg-gray-50">
              {item.children!.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      )
    }

    // Desktop menu item
    if (hasChildren) {
      return (
        <div key={item.id} className={`relative group ${item.cssClass || ''}`}>
          <button
            className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            aria-expanded="false"
            aria-haspopup="true"
          >
            <span>{item.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Dropdown submenu (hover on desktop) */}
          <div className="absolute left-0 top-full mt-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {item.children!.map((child) => {
              if (child.type === 'divider') {
                return <div key={child.id} className="border-t border-gray-200 my-1" />
              }
              const childHref = getItemHref(child)
              const childTarget = child.target || '_self'
              return (
                <Link
                  key={child.id}
                  href={childHref}
                  target={childTarget}
                  className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${child.cssClass || ''}`}
                >
                  {child.label}
                </Link>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <Link
        key={item.id}
        href={href}
        target={target}
        className={`px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors ${item.cssClass || ''}`}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <>
      <header className={`${containerClasses[variant]} ${stickyClasses}`}>
        <div className="container mx-auto px-4 py-4">
          <div className={layoutClasses[variant]}>
            {/* Logo */}
            {logo && (
              <Link href="/" className="flex items-center">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width || 150}
                  height={logo.height || 40}
                  className="h-10 w-auto"
                />
              </Link>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {menuData.map((item) => renderMenuItem(item, false))}
            </nav>

            {/* CTA Button + Mobile Menu Toggle */}
            <div className="flex items-center space-x-4">
              {ctaButton && (
                <Link
                  href={ctaButton.url}
                  className="hidden md:inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {ctaButton.text}
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-gray-700 hover:text-gray-900"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'
          }`}
        >
          <nav className="container mx-auto px-4 py-4 bg-white border-t border-gray-200">
            {menuData.map((item) => renderMenuItem(item, true))}

            {/* Mobile CTA Button */}
            {ctaButton && (
              <Link
                href={ctaButton.url}
                className="block w-full mt-4 px-6 py-3 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {ctaButton.text}
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Spacer to prevent content jump when header is sticky */}
      {sticky && <div className="h-[72px]" />}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  )
}
