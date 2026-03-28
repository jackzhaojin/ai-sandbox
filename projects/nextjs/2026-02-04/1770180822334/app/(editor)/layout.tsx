import { Toaster } from 'sonner'

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
}
