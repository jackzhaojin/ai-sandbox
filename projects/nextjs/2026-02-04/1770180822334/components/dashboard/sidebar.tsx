'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Layout,
  Boxes,
  Image,
  FileCheck,
  Menu as MenuIcon,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarProps {
  siteId: string
}

const navigationItems = [
  { name: 'Dashboard', href: '', icon: LayoutDashboard },
  { name: 'Pages', href: '/pages', icon: FileText },
  { name: 'Templates', href: '/templates', icon: Layout },
  { name: 'Fragments', href: '/fragments', icon: Boxes },
  { name: 'Media', href: '/media', icon: Image },
  { name: 'Forms', href: '/forms', icon: FileCheck },
  { name: 'Navigation', href: '/navigation', icon: MenuIcon },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ siteId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    const fullPath = `/dashboard/${siteId}${href}`
    return pathname === fullPath
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-gray-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && <h2 className="text-xl font-bold">PageForge</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <li key={item.name}>
                <Link
                  href={`/dashboard/${siteId}${item.href}`}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
