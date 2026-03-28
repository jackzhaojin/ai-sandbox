'use client'

import { useState, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
import { UserDropdown } from '@/components/auth/user-dropdown'
import { SiteSwitcher, type Site } from './site-switcher'
import { NotificationBell, type Notification } from './notification-bell'
import { CommandPalette } from '@/components/ui/command-palette'

export interface HeaderProps {
  siteId: string
  sites: Site[]
  userName: string
  userEmail: string
  userAvatarUrl?: string | null
  userRole: string
  notifications?: Notification[]
  onToggleMobileSidebar: () => void
}

export function Header({
  siteId,
  sites,
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
  notifications = [],
  onToggleMobileSidebar,
}: HeaderProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          {/* Left section: Mobile menu button + Site switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Toggle mobile menu"
              aria-expanded={false}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <SiteSwitcher sites={sites} currentSiteId={siteId} />
          </div>

          {/* Right section: Search, Notifications, User */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              aria-label="Open search (⌘K)"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-600" aria-hidden="true">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* Mobile search icon */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="sm:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Notifications */}
            <NotificationBell notifications={notifications} />

            {/* User dropdown */}
            <UserDropdown
              name={userName}
              email={userEmail}
              avatarUrl={userAvatarUrl}
              role={userRole}
            />
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        siteId={siteId}
      />
    </>
  )
}
