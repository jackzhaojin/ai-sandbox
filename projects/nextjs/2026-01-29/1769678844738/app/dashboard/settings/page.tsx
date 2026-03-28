import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/shared/Navigation'
import { SettingsManager } from '@/components/settings/SettingsManager'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <main className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-green-500 mb-6 font-mono uppercase retro-glow">
          &gt; SETTINGS
        </h1>
        <SettingsManager user={session.user} />
      </main>
    </div>
  )
}
