import { getUserProfile } from '@/lib/auth/session'
import { UserDropdown } from '@/components/auth/user-dropdown'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">PageForge CMS</h2>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <a href="/sites" className="block px-4 py-2 rounded hover:bg-gray-800">
                Sites
              </a>
            </li>
            <li>
              <a href="/pages" className="block px-4 py-2 rounded hover:bg-gray-800">
                Pages
              </a>
            </li>
            <li>
              <a href="/templates" className="block px-4 py-2 rounded hover:bg-gray-800">
                Templates
              </a>
            </li>
            <li>
              <a href="/fragments" className="block px-4 py-2 rounded hover:bg-gray-800">
                Fragments
              </a>
            </li>
            <li>
              <a href="/media" className="block px-4 py-2 rounded hover:bg-gray-800">
                Media
              </a>
            </li>
            <li>
              <a href="/settings" className="block px-4 py-2 rounded hover:bg-gray-800">
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <UserDropdown
              name={profile.name}
              email={profile.email}
              avatarUrl={profile.avatarUrl}
              role={profile.role}
            />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-8 bg-gray-100 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
