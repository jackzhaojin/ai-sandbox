'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ReviewPanelProps {
  pageId: string
  isOpen: boolean
  onClose: () => void
  onReviewComplete?: () => void
}

interface ReviewRequest {
  id: string
  pageId: string
  requestedBy: string
  status: string
  comments: string | null
  createdAt: string
  authorName?: string
  pageTitle?: string
}

export default function ReviewPanel({
  pageId,
  isOpen,
  onClose,
  onReviewComplete,
}: ReviewPanelProps) {
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchReviewRequests()
    }
  }, [isOpen, pageId])

  const fetchReviewRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pages/${pageId}/review-requests`)
      if (response.ok) {
        const data = await response.json()
        setReviewRequests(data.reviewRequests || [])
      }
    } catch (error) {
      console.error('Error fetching review requests:', error)
      toast.error('Failed to load review requests')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (reviewRequestId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !reviewerNotes.trim()) {
      toast.error('Please provide reviewer notes when rejecting')
      return
    }

    if (!window.confirm(`${action === 'approve' ? 'Approve and publish' : 'Reject'} this page?`)) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/pages/${pageId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reviewRequestId,
          reviewerNotes: reviewerNotes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process review')
      }

      toast.success(action === 'approve' ? 'Page approved and published' : 'Page rejected')
      setReviewerNotes('')
      onReviewComplete?.()
      onClose()
    } catch (error: any) {
      console.error('Error processing review:', error)
      toast.error(error.message || 'Failed to process review')
    } finally {
      setProcessing(false)
    }
  }

  const pendingReviews = reviewRequests.filter((r) => r.status === 'pending')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Page</DialogTitle>
          <DialogDescription>
            Review and approve or reject this page for publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading review requests...</div>
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="mb-2 h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-500">No pending review requests</p>
            </div>
          ) : (
            <>
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {review.pageTitle || 'Page'}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Submitted by {review.authorName || 'Unknown'} on{' '}
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                    {review.comments && (
                      <div className="mt-2 rounded bg-gray-50 p-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Author comments:</span>{' '}
                          {review.comments}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="reviewer-notes">
                        Reviewer Notes {review.status === 'pending' && '(Optional for approval, required for rejection)'}
                      </Label>
                      <Textarea
                        id="reviewer-notes"
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="Add feedback for the author..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleReview(review.id, 'approve')}
                        disabled={processing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {processing ? 'Processing...' : 'Approve & Publish'}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReview(review.id, 'reject')}
                        disabled={processing}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {processing ? 'Processing...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
