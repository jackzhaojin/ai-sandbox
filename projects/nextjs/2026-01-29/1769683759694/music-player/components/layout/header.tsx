'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HeaderProps {
  user?: {
    name: string | null
    email: string
    avatarUrl: string | null
  }
  onSignOut?: () => void
}

export function Header({ user, onSignOut }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.forward()}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xl">
            <Input
              type="search"
              placeholder="Search for songs, albums, or artists..."
              className="w-full"
            />
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">
                    {user.name || user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  title="Profile"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSignOut}
                  className="h-9 w-9"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/auth/signin">Sign in</a>
                </Button>
                <Button size="sm" asChild>
                  <a href="/auth/register">Sign up</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
