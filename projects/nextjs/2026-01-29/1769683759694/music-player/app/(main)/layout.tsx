import { MainLayout } from '@/components/layout/main-layout'
import { auth, signOut } from '@/lib/auth'
import { fetchPlaylists } from '@/lib/api-client'
import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user session
  const session = await auth()

  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Fetch user's playlists for sidebar
  const playlists = await fetchPlaylists({ limit: 20 })

  // Prepare user data for layout
  const user = {
    name: session.user.name || null,
    email: session.user.email!,
    avatarUrl: session.user.image || null,
  }

  // Server action for sign out
  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/auth/signin' })
  }

  return (
    <MainLayout
      user={user}
      playlists={playlists.map(p => ({ id: p.id, name: p.name }))}
      onSignOut={handleSignOut}
    >
      {children}
    </MainLayout>
  )
}
