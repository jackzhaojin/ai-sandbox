'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href: string
  pageId?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-gray-600', className)}
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isFirst = index === 0

          return (
            <li key={`${item.pageId || item.href}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400" aria-hidden="true" />
              )}

              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {isFirst && item.label === 'Home' && (
                    <Home className="h-4 w-4 inline-block mr-1" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-gray-900 transition-colors"
                >
                  {isFirst && item.label === 'Home' && (
                    <Home className="h-4 w-4 inline-block mr-1" aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
