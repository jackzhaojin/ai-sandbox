'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit3,
  Save,
  Printer,
  Send,
  RotateCcw,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SubmissionActionsProps {
  shipmentId: string
  isSubmitting?: boolean
  isSaving?: boolean
  canSubmit?: boolean
  onSaveDraft?: () => Promise<void>
  onSubmit?: () => Promise<void>
  onStartOver?: () => Promise<void>
  className?: string
}

export function SubmissionActions({
  shipmentId,
  isSubmitting = false,
  isSaving = false,
  canSubmit = false,
  onSaveDraft,
  onSubmit,
  onStartOver,
  className,
}: SubmissionActionsProps) {
  const router = useRouter()
  const [showStartOverModal, setShowStartOverModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle Edit Shipment - navigate to step 1
  const handleEditShipment = () => {
    router.push(`/shipments/${shipmentId}/pricing`)
  }

  // Handle Save as Draft
  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      await onSaveDraft()
    } else {
      // Default implementation: PATCH without advancing
      try {
        const response = await fetch(`/api/shipments/${shipmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'draft',
            lastSaved: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save draft')
        }

        // Show success feedback (could be enhanced with toast)
        alert('Draft saved successfully')
      } catch (error) {
        alert('Failed to save draft. Please try again.')
      }
    }
  }

  // Handle Print Summary
  const handlePrintSummary = () => {
    // Add print-specific styles before printing
    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #review-content, #review-content *,
        [data-printable], [data-printable] * {
          visibility: visible;
        }
        #review-content, [data-printable] {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print, nav, header, footer {
          display: none !important;
        }
      }
    `
    document.head.appendChild(style)

    // Trigger print
    window.print()

    // Clean up
    setTimeout(() => {
      document.head.removeChild(style)
    }, 100)
  }

  // Handle Submit Shipment
  const handleSubmit = async () => {
    if (!canSubmit) return
    if (onSubmit) {
      await onSubmit()
    }
  }

  // Handle Start Over - show confirmation modal
  const handleStartOverClick = () => {
    setShowStartOverModal(true)
  }

  // Confirm Start Over
  const confirmStartOver = async () => {
    setIsDeleting(true)
    try {
      if (onStartOver) {
        await onStartOver()
      } else {
        // Default implementation: DELETE shipment and redirect
        const response = await fetch(`/api/shipments/${shipmentId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete shipment')
        }

        // Redirect to new shipment
        router.push('/shipments/new')
      }
    } catch (error) {
      alert('Failed to start over. Please try again.')
      setIsDeleting(false)
      setShowStartOverModal(false)
    }
  }

  // Cancel Start Over
  const cancelStartOver = () => {
    setShowStartOverModal(false)
  }

  return (
    <>
      <div
        className={cn(
          'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
          className
        )}
        data-printable
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
          <p className="text-sm text-gray-600">
            Review your options before final submission
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Primary Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Edit Shipment */}
            <Button
              variant="outline"
              onClick={handleEditShipment}
              disabled={isSubmitting || isSaving}
              className="w-full justify-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Shipment
            </Button>

            {/* Save as Draft */}
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isSaving}
              className="w-full justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save as Draft'}
            </Button>
          </div>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Print Summary */}
            <Button
              variant="outline"
              onClick={handlePrintSummary}
              disabled={isSubmitting || isSaving}
              className="w-full justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Summary
            </Button>

            {/* Start Over */}
            <Button
              variant="outline"
              onClick={handleStartOverClick}
              disabled={isSubmitting || isSaving}
              className="w-full justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            {/* Submit Shipment - Primary CTA */}
            <Button
              variant="default"
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting || isSaving}
              className={cn(
                'w-full justify-center gap-2 text-base',
                canSubmit &&
                  !isSubmitting &&
                  !isSaving &&
                  'bg-green-600 hover:bg-green-700'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Shipment'}
            </Button>

            {/* Submit Helper Text */}
            {!canSubmit && !isSubmitting && !isSaving && (
              <p className="text-xs text-center text-amber-600 mt-2">
                Please accept all terms and resolve any validation errors to submit
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <p>
              <strong>Secure Submission:</strong> Your shipment information is
              transmitted securely. By submitting, you authorize processing of this
              shipment according to our terms of service.
            </p>
          </div>
        </div>
      </div>

      {/* Start Over Confirmation Modal */}
      {showStartOverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Start Over?
              </h3>
            </div>

            <p className="text-gray-600 mb-2">
              This will delete your current shipment and all associated data. This
              action cannot be undone.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Shipment ID:</strong> {shipmentId}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={cancelStartOver}
                disabled={isDeleting}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmStartOver}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                {isDeleting ? 'Deleting...' : 'Yes, Start Over'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
