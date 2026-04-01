'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { PlayerBar } from '../player/player-bar'

interface MainLayoutProps {
  children: React.ReactNode
  user?: {
    name: string | null
    email: string
    avatarUrl: string | null
  }
  playlists?: Array<{ id: string; name: string }>
  onSignOut?: () => void
}

export function MainLayout({
  children,
  user,
  playlists = [],
  onSignOut,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar playlists={playlists} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header user={user} onSignOut={onSignOut} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Player bar */}
      <PlayerBar />
    </div>
  )
}
