'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export interface Site {
  id: string
  name: string
  slug: string
  domain?: string | null
}

export interface SiteSwitcherProps {
  sites: Site[]
  currentSiteId: string
}

export function SiteSwitcher({ sites, currentSiteId }: SiteSwitcherProps) {
  const router = useRouter()
  const currentSite = sites.find((site) => site.id === currentSiteId)

  const handleSiteChange = (siteId: string) => {
    router.push(`/dashboard/${siteId}`)
  }

  const handleCreateSite = () => {
    router.push('/sites/new')
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
        <span className="truncate max-w-[150px]">{currentSite?.name || 'Select site'}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-72 origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Your Sites
            </div>
            {sites.map((site) => (
              <Menu.Item key={site.id}>
                {({ active }) => (
                  <button
                    onClick={() => handleSiteChange(site.id)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2 text-sm',
                      active && 'bg-gray-100',
                      site.id === currentSiteId && 'bg-blue-50'
                    )}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-gray-900">{site.name}</span>
                      {site.domain && (
                        <span className="text-xs text-gray-500">{site.domain}</span>
                      )}
                    </div>
                    {site.id === currentSiteId && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
            <div className="my-1 h-px bg-gray-200" />
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleCreateSite}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2 text-sm font-medium',
                    active && 'bg-gray-100 text-gray-900',
                    !active && 'text-gray-700'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Create new site
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
