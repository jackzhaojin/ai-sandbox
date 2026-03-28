'use client'

import React, { useState } from 'react'
import { RetroInput } from '@/components/ui/RetroInput'
import { RetroTextarea } from '@/components/ui/RetroTextarea'
import { RetroButton } from '@/components/ui/RetroButton'
import { RetroCard } from '@/components/ui/RetroCard'
import { useCreateReport, useUpdateReport } from '@/lib/queries/reports'
import { useToast } from '@/lib/hooks/useToast'

interface Report {
  id: string
  name: string
  description: string | null
  config: any
  isPublic: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

interface ReportBuilderProps {
  report?: Report | null
  onSave: () => void
  onCancel: () => void
}

export function ReportBuilder({ report, onSave, onCancel }: ReportBuilderProps) {
  const [name, setName] = useState(report?.name || '')
  const [description, setDescription] = useState(report?.description || '')
  const [isPublic, setIsPublic] = useState(report?.isPublic || false)
  const [error, setError] = useState<string | null>(null)

  const toast = useToast()
  const createReportMutation = useCreateReport()
  const updateReportMutation = useUpdateReport()

  const saving = createReportMutation.isPending || updateReportMutation.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Report name is required')
      return
    }

    try {
      setError(null)

      const config = {
        charts: ['line', 'bar', 'pie'],
        dateRange: '30d',
        metrics: ['page_views', 'clicks', 'events']
      }

      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        config,
        isPublic
      }

      if (report) {
        // Update existing report
        await updateReportMutation.mutateAsync({ id: report.id, data: body })
        toast.success('Report updated successfully')
      } else {
        // Create new report
        await createReportMutation.mutateAsync(body)
        toast.success('Report created successfully')
      }

      onSave()
    } catch (err) {
      console.error('Error saving report:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to save report'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  return (
    <RetroCard title={report ? 'EDIT REPORT' : 'CREATE NEW REPORT'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="border-2 border-red-500 bg-black p-4 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
            <div className="text-red-500 font-mono text-sm">
              &gt; ERROR: {error}
            </div>
          </div>
        )}

        <RetroInput
          label="Report Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter report name..."
          required
        />

        <RetroTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter report description..."
          rows={3}
        />

        <div className="mb-4">
          <label className="flex items-center gap-3 text-green-400 font-mono text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 bg-black border-2 border-green-500 checked:bg-green-500 cursor-pointer"
            />
            <span className="uppercase">Make this report public</span>
          </label>
        </div>

        <div className="border-2 border-green-700 bg-black p-4">
          <div className="text-green-600 font-mono text-xs mb-2 uppercase">
            Report Configuration Preview:
          </div>
          <div className="text-green-400 font-mono text-xs space-y-1">
            <div>&gt; Charts: Line, Bar, Pie</div>
            <div>&gt; Date Range: Last 30 days</div>
            <div>&gt; Metrics: Page Views, Clicks, Events</div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <RetroButton
            type="submit"
            disabled={saving}
            className="flex-1"
            variant="primary"
          >
            {saving ? 'SAVING...' : report ? 'UPDATE REPORT' : 'CREATE REPORT'}
          </RetroButton>
          <RetroButton
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1"
            variant="secondary"
          >
            CANCEL
          </RetroButton>
        </div>
      </form>
    </RetroCard>
  )
}
