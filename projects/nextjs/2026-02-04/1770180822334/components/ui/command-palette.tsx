'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import { Combobox, Dialog, Transition } from '@headlessui/react'
import { Search, FileText, Layout, Image, Settings, Home, Users, Box, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { StatusBadge } from './status-badge'

export interface CommandItem {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
  url: string
  category: string
  status?: string
  metadata?: any
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
}

const defaultCommands: CommandItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Go to dashboard home',
    icon: <Home className="h-5 w-5" />,
    url: '/dashboard',
    category: 'Navigation',
  },
  {
    id: 'pages',
    name: 'Pages',
    description: 'Manage pages',
    icon: <FileText className="h-5 w-5" />,
    url: '/pages',
    category: 'Navigation',
  },
  {
    id: 'templates',
    name: 'Templates',
    description: 'Manage templates',
    icon: <Layout className="h-5 w-5" />,
    url: '/templates',
    category: 'Navigation',
  },
  {
    id: 'media',
    name: 'Media Library',
    description: 'Manage media files',
    icon: <Image className="h-5 w-5" />,
    url: '/media',
    category: 'Navigation',
  },
  {
    id: 'fragments',
    name: 'Fragments',
    description: 'Manage content fragments',
    icon: <Box className="h-5 w-5" />,
    url: '/fragments',
    category: 'Navigation',
  },
  {
    id: 'team',
    name: 'Team',
    description: 'Manage team members',
    icon: <Users className="h-5 w-5" />,
    url: '/settings/team',
    category: 'Navigation',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Configure site settings',
    icon: <Settings className="h-5 w-5" />,
    url: '/settings',
    category: 'Navigation',
  },
]

export function CommandPalette({ isOpen, onClose, siteId }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&siteId=${siteId}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, siteId])

  const buildCommandItems = useCallback(() => {
    const items: CommandItem[] = [...defaultCommands]

    if (searchResults) {
      // Add pages
      searchResults.pages?.forEach((page: any) => {
        items.push({
          id: `page-${page.id}`,
          name: page.title,
          description: `/${page.slug}`,
          icon: <FileText className="h-5 w-5" />,
          url: `/pages/${page.id}/edit`,
          category: 'Pages',
          status: page.status,
        })
      })

      // Add media
      searchResults.media?.forEach((media: any) => {
        items.push({
          id: `media-${media.id}`,
          name: media.file_name,
          description: media.alt_text || media.mime_type,
          icon: <Image className="h-5 w-5" />,
          url: `/media`,
          category: 'Media',
          metadata: { mediaId: media.id },
        })
      })

      // Add fragments
      searchResults.fragments?.forEach((fragment: any) => {
        items.push({
          id: `fragment-${fragment.id}`,
          name: fragment.name,
          description: fragment.description,
          icon: <Box className="h-5 w-5" />,
          url: `/fragments/${fragment.id}/edit`,
          category: 'Fragments',
        })
      })

      // Add templates
      searchResults.templates?.forEach((template: any) => {
        items.push({
          id: `template-${template.id}`,
          name: template.name,
          description: template.description,
          icon: <Layout className="h-5 w-5" />,
          url: `/templates/${template.id}/edit`,
          category: 'Templates',
        })
      })

      // Add users
      searchResults.users?.forEach((user: any) => {
        items.push({
          id: `user-${user.id}`,
          name: user.display_name,
          description: user.email,
          icon: <Users className="h-5 w-5" />,
          url: `/settings/team`,
          category: 'Users',
        })
      })
    }

    return items
  }, [searchResults])

  const filteredCommands =
    query === '' || query.length < 2
      ? defaultCommands
      : buildCommandItems().filter((command) => {
          return (
            command.name.toLowerCase().includes(query.toLowerCase()) ||
            command.description?.toLowerCase().includes(query.toLowerCase())
          )
        })

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const handleSelect = (item: CommandItem | null) => {
    if (!item) return
    router.push(`/dashboard/${siteId}${item.url}`)
    onClose()
    setQuery('')
  }

  // Reset query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSearchResults(null)
    }
  }, [isOpen])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <Combobox onChange={handleSelect}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    onChange={(event) => setQuery(event.target.value)}
                    value={query}
                  />
                </div>

                {(loading && query.length >= 2) && (
                  <div className="px-6 py-14 text-center text-sm">
                    <Search className="mx-auto h-6 w-6 text-gray-400 animate-pulse" />
                    <p className="mt-4 text-gray-500">Searching...</p>
                  </div>
                )}

                {!loading && filteredCommands.length > 0 && (
                  <Combobox.Options
                    static
                    className="max-h-96 scroll-py-3 overflow-y-auto p-3 space-y-3"
                  >
                    {Object.entries(groupedCommands).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {category}
                        </div>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <Combobox.Option
                              key={item.id}
                              value={item}
                              className={({ active }) =>
                                cn(
                                  'flex cursor-default select-none items-center rounded-md px-3 py-2',
                                  active && 'bg-blue-600 text-white'
                                )
                              }
                            >
                              {({ active }) => (
                                <>
                                  <div
                                    className={cn(
                                      'flex h-10 w-10 flex-none items-center justify-center rounded-lg',
                                      active ? 'bg-blue-700' : 'bg-gray-100'
                                    )}
                                  >
                                    {item.icon}
                                  </div>
                                  <div className="ml-4 flex-auto">
                                    <p
                                      className={cn(
                                        'text-sm font-medium',
                                        active ? 'text-white' : 'text-gray-900'
                                      )}
                                    >
                                      {item.name}
                                    </p>
                                    {item.description && (
                                      <p
                                        className={cn(
                                          'text-sm',
                                          active ? 'text-blue-100' : 'text-gray-500'
                                        )}
                                      >
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  {item.status && (
                                    <div className="ml-2">
                                      <StatusBadge status={item.status as any} />
                                    </div>
                                  )}
                                </>
                              )}
                            </Combobox.Option>
                          ))}
                        </div>
                      </div>
                    ))}
                  </Combobox.Options>
                )}

                {!loading && query !== '' && filteredCommands.length === 0 && (
                  <div className="px-6 py-14 text-center text-sm sm:px-14">
                    <Search className="mx-auto h-6 w-6 text-gray-400" />
                    <p className="mt-4 font-semibold text-gray-900">No results found</p>
                    <p className="mt-2 text-gray-500">
                      {query.length < 2
                        ? 'Type at least 2 characters to search'
                        : `No results found for "${query}". Try a different search term.`
                      }
                    </p>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
