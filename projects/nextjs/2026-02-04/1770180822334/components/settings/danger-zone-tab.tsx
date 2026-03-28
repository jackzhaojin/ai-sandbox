'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface DangerZoneTabProps {
  siteId: string
  siteName: string
}

export function DangerZoneTab({ siteId, siteName }: DangerZoneTabProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteSite = async () => {
    if (confirmText !== siteName) {
      toast.error('Site name does not match')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete site')
      }

      toast.success('Site deleted successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting site:', error)
      toast.error('Failed to delete site')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h4 className="text-sm font-medium text-red-900">Danger Zone</h4>
            <p className="mt-1 text-xs text-red-700">
              These actions are permanent and cannot be undone. Please proceed with caution.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Site */}
      <div className="rounded-lg border-2 border-red-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Delete This Site</h3>
            <p className="mt-1 text-sm text-gray-600">
              Once you delete a site, there is no going back. This will permanently delete:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• All pages and content</li>
              <li>• All media files</li>
              <li>• All templates and components</li>
              <li>• All menus and navigation</li>
              <li>• All site settings and configuration</li>
            </ul>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete This Site
              </button>
            ) : (
              <div className="mt-4 space-y-4 rounded-lg border border-red-300 bg-red-50 p-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-red-900">
                    Type <strong>{siteName}</strong> to confirm deletion
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={siteName}
                    className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteSite}
                    disabled={confirmText !== siteName || isDeleting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'I understand, delete this site'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setConfirmText('')
                    }}
                    disabled={isDeleting}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-gray-900">Alternative: Archive Site</h4>
        <p className="text-xs text-gray-600">
          If you're not sure about deleting, you can deactivate the site instead. This will hide it from the dashboard
          but keep all data intact. You can reactivate it later if needed.
        </p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          disabled
        >
          Archive Site (Coming Soon)
        </button>
      </div>
    </div>
  )
}
