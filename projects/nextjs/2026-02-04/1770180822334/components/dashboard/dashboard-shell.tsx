'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { MobileSidebar } from './mobile-sidebar'
import { Header } from './header'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'
import type { Site } from './site-switcher'
import type { Notification } from './notification-bell'

export interface DashboardShellProps {
  siteId: string
  sites: Site[]
  userName: string
  userEmail: string
  userAvatarUrl?: string | null
  userRole: string
  notifications?: Notification[]
  breadcrumbs?: BreadcrumbItem[]
  children: React.ReactNode
}

export function DashboardShell({
  siteId,
  sites,
  userName,
  userEmail,
  userAvatarUrl,
  userRole,
  notifications = [],
  breadcrumbs,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <Sidebar siteId={siteId} />

      {/* Mobile Sidebar */}
      <MobileSidebar
        siteId={siteId}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          siteId={siteId}
          sites={sites}
          userName={userName}
          userEmail={userEmail}
          userAvatarUrl={userAvatarUrl}
          userRole={userRole}
          notifications={notifications}
          onToggleMobileSidebar={() => setMobileMenuOpen(true)}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col bg-gray-50 overflow-auto">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 py-3">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
