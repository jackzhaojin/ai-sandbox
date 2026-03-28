import { getUserProfile } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const profile = await getUserProfile()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome to PageForge CMS</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <div className="space-y-2">
          <p><span className="font-medium">Name:</span> {profile?.name}</p>
          <p><span className="font-medium">Email:</span> {profile?.email}</p>
          <p><span className="font-medium">Role:</span> {profile?.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Sites</h3>
          <p className="text-gray-600">Manage your websites</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Pages</h3>
          <p className="text-gray-600">Create and edit pages</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Media</h3>
          <p className="text-gray-600">Upload and manage media</p>
        </div>
      </div>
    </div>
  )
}
