'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PageLockManagerProps {
  pageId: string
  isAdmin: boolean
  onLockAcquired?: () => void
  onLockFailed?: (lockedBy: string) => void
}

export default function PageLockManager({
  pageId,
  isAdmin,
  onLockAcquired,
  onLockFailed,
}: PageLockManagerProps) {
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [lockInfo, setLockInfo] = useState<{
    locked: boolean
    lockedBy?: string
    lockedByName?: string
    isStale?: boolean
  } | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)

  useEffect(() => {
    acquireLock()

    // Set up beforeunload handler to release lock
    const handleBeforeUnload = () => {
      releaseLock()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Set up heartbeat to keep lock alive (every 10 minutes)
    const heartbeatInterval = setInterval(() => {
      acquireLock()
    }, 10 * 60 * 1000)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(heartbeatInterval)
      releaseLock()
    }
  }, [pageId])

  const acquireLock = async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}/lock`, {
        method: 'POST',
      })

      if (response.status === 423) {
        // Page is locked by another user
        const data = await response.json()
        setLockInfo({
          locked: true,
          lockedBy: data.lockedBy,
          lockedByName: data.lockedBy,
          isStale: false,
        })
        setShowLockDialog(true)
        onLockFailed?.(data.lockedBy)
      } else if (response.ok) {
        // Lock acquired successfully
        onLockAcquired?.()
      }
    } catch (error) {
      console.error('Error acquiring lock:', error)
    }
  }

  const releaseLock = async () => {
    try {
      await fetch(`/api/pages/${pageId}/lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: false }),
      })
    } catch (error) {
      console.error('Error releasing lock:', error)
    }
  }

  const handleForceUnlock = async () => {
    if (!isAdmin) {
      toast.error('Only admins can force unlock')
      return
    }

    try {
      const response = await fetch(`/api/pages/${pageId}/lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      })

      if (response.ok) {
        toast.success('Lock released')
        setShowLockDialog(false)
        // Try to acquire lock again
        acquireLock()
      }
    } catch (error) {
      console.error('Error force unlocking:', error)
      toast.error('Failed to force unlock')
    }
  }

  const handleOpenReadOnly = () => {
    setIsReadOnly(true)
    setShowLockDialog(false)
    toast.info('Opened in read-only mode')
  }

  return (
    <>
      {isReadOnly && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-white">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          This page is open in read-only mode. Another user is currently editing it.
        </div>
      )}

      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Page is Locked</DialogTitle>
            <DialogDescription>
              This page is currently being edited by {lockInfo?.lockedByName || 'another user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-900">Editor is locked</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    To prevent conflicts, only one person can edit a page at a time.
                    You can open in read-only mode or wait for the lock to be released.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleOpenReadOnly}>
              Open Read-Only
            </Button>
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={handleForceUnlock}
                className="gap-2"
              >
                <Unlock className="h-4 w-4" />
                Force Unlock (Admin)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
