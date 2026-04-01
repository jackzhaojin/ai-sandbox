'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, Plus, Heart, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/browse', icon: Search },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Favorites', href: '/favorites', icon: Heart },
]

interface SidebarProps {
  playlists?: Array<{ id: string; name: string }>
}

export function Sidebar({ playlists = [] }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-muted/10 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <Music className="h-6 w-6" />
          <span className="text-xl font-bold">Music Player</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {/* Playlists Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Playlists
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Create playlist"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {playlists.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No playlists yet
              </p>
            ) : (
              playlists.map((playlist) => {
                const isActive = pathname === `/playlists/${playlist.id}`
                return (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm truncate transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    title={playlist.name}
                  >
                    {playlist.name}
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </nav>
    </aside>
  )
}
