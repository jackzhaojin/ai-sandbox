'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
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
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MobileSidebarProps {
  siteId: string
  isOpen: boolean
  onClose: () => void
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

export function MobileSidebar({ siteId, isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    const fullPath = `/dashboard/${siteId}${href}`
    return pathname === fullPath
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xs">
                  <div className="flex h-full flex-col bg-gray-900 text-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                      <Dialog.Title className="text-xl font-bold">
                        PageForge
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <X className="h-5 w-5" />
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
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                  active
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                )}
                              >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                <span>{item.name}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
