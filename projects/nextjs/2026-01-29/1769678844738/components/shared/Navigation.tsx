'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'

const NAV_LINKS = [
  { href: '/dashboard', label: 'DASHBOARD' },
  { href: '/dashboard/analytics', label: 'ANALYTICS' },
  { href: '/dashboard/reports', label: 'REPORTS' },
  { href: '/dashboard/settings', label: 'SETTINGS' }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-black border-b-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.2)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xl md:text-2xl font-bold text-green-500 font-mono uppercase retro-glow hover:text-green-300 transition-colors"
            >
              RETRO ANALYTICS
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-4 py-2 font-mono text-sm md:text-base border-2 transition-colors
                    ${
                      isActive
                        ? 'bg-green-500 text-black border-green-500'
                        : 'bg-black text-green-500 border-green-500 hover:bg-green-500 hover:text-black'
                    }
                  `}
                >
                  {link.label}
                </Link>
              )
            })}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
