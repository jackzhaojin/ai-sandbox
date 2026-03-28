'use client'

import React, { useState } from 'react'
import { Calendar, Archive, X } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface PageWorkflowActionsProps {
  pageId: string
  currentStatus: string
  scheduledAt?: string | null
  isAdmin: boolean
  onStatusChange?: () => void
}

export default function PageWorkflowActions({
  pageId,
  currentStatus,
  scheduledAt,
  isAdmin,
  onStatusChange,
}: PageWorkflowActionsProps) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)

  const handleSchedulePublish = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select both date and time')
      return
    }

    setIsScheduling(true)
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)

      const response = await fetch(`/api/pages/${pageId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledAt: scheduledDateTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to schedule publish')
      }

      toast.success('Page scheduled for publishing')
      setShowScheduleDialog(false)
      onStatusChange?.()
    } catch (error: any) {
      console.error('Error scheduling publish:', error)
      toast.error(error.message || 'Failed to schedule publish')
    } finally {
      setIsScheduling(false)
    }
  }

  const handleCancelSchedule = async () => {
    if (!window.confirm('Cancel scheduled publishing?')) return

    try {
      const response = await fetch(`/api/pages/${pageId}/schedule`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel schedule')
      }

      toast.success('Schedule cancelled')
      onStatusChange?.()
    } catch (error: any) {
      console.error('Error cancelling schedule:', error)
      toast.error(error.message || 'Failed to cancel schedule')
    }
  }

  const handleArchive = async () => {
    if (!window.confirm('Archive this page? It will be hidden from the site.')) return

    try {
      const response = await fetch(`/api/pages/${pageId}/archive`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to archive page')
      }

      toast.success('Page archived')
      onStatusChange?.()
    } catch (error: any) {
      console.error('Error archiving page:', error)
      toast.error(error.message || 'Failed to archive page')
    }
  }

  if (!isAdmin) return null

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Schedule Publish Button */}
        {currentStatus === 'draft' && (
          <button
            onClick={() => setShowScheduleDialog(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            type="button"
          >
            <Calendar className="h-4 w-4" />
            Schedule Publish
          </button>
        )}

        {/* Cancel Schedule Button */}
        {currentStatus === 'scheduled' && scheduledAt && (
          <button
            onClick={handleCancelSchedule}
            className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
            type="button"
          >
            <X className="h-4 w-4" />
            Cancel Schedule
          </button>
        )}

        {/* Archive Button */}
        {currentStatus !== 'archived' && (
          <button
            onClick={handleArchive}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            type="button"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        )}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Publishing</DialogTitle>
            <DialogDescription>
              Choose when this page should be automatically published.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button onClick={handleSchedulePublish} disabled={isScheduling}>
              {isScheduling ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
