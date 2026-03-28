import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/shared/Navigation'
import { ReportViewer } from '@/components/reports/ReportViewer'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  const { id } = await params

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <main className="container mx-auto p-6">
        <ReportViewer reportId={id} />
      </main>
    </div>
  )
}
