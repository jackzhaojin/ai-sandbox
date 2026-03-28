'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RetroCard } from '@/components/ui/RetroCard'
import { RetroButton } from '@/components/ui/RetroButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ReportBuilder } from './ReportBuilder'
import { useReport, useDeleteReport } from '@/lib/queries/reports'
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

interface ReportViewerProps {
  reportId: string
}

export function ReportViewer({ reportId }: ReportViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const { data: report, isLoading, error } = useReport(reportId)
  const deleteReportMutation = useDeleteReport()

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this report?')) {
      return
    }

    try {
      await deleteReportMutation.mutateAsync(reportId)
      toast.success('Report deleted successfully')
      router.push('/dashboard/reports')
    } catch (err) {
      console.error('Error deleting report:', err)
      toast.error('Failed to delete report')
    }
  }

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Report link copied to clipboard')
  }

  function handleDownload() {
    if (!report) return

    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${report.name.toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Report downloaded')
  }

  if (isLoading) {
    return <LoadingSpinner message="LOADING REPORT" />
  }

  if (error) {
    return (
      <RetroCard title="ERROR" glow>
        <div className="text-red-500 font-mono">
          <p className="text-xl mb-2">&gt; ERROR</p>
          <p className="text-sm mb-4">
            {error instanceof Error ? error.message : 'Failed to load report'}
          </p>
          <RetroButton onClick={() => router.push('/dashboard/reports')}>
            BACK TO REPORTS
          </RetroButton>
        </div>
      </RetroCard>
    )
  }

  if (!report) {
    return (
      <RetroCard title="NOT FOUND" glow>
        <div className="text-red-500 font-mono">
          <p className="text-xl mb-2">&gt; REPORT NOT FOUND</p>
          <p className="text-sm mb-4">
            The requested report does not exist or you don't have permission to
            view it.
          </p>
          <RetroButton onClick={() => router.push('/dashboard/reports')}>
            BACK TO REPORTS
          </RetroButton>
        </div>
      </RetroCard>
    )
  }

  if (isEditing) {
    return (
      <ReportBuilder
        report={report}
        onSave={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-green-500 mb-2 font-mono uppercase retro-glow">
            {report.name}
          </h1>
          <p className="text-green-400 font-mono text-sm">
            {report.description || 'No description provided'}
          </p>
        </div>
        <RetroButton onClick={() => router.push('/dashboard/reports')}>
          &lt; BACK
        </RetroButton>
      </div>

      {/* Report Info */}
      <RetroCard title="REPORT INFORMATION">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-mono text-sm uppercase">
              Status:
            </span>
            <span
              className={`font-mono text-sm ${
                report.isPublic ? 'text-cyan-400' : 'text-yellow-400'
              }`}
            >
              {report.isPublic ? 'PUBLIC' : 'PRIVATE'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-mono text-sm uppercase">
              Created:
            </span>
            <span className="text-green-400 font-mono text-sm">
              {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-mono text-sm uppercase">
              Updated:
            </span>
            <span className="text-green-400 font-mono text-sm">
              {new Date(report.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </RetroCard>

      {/* Report Configuration */}
      <RetroCard title="CONFIGURATION">
        <div className="bg-black border-2 border-green-700 p-4 font-mono text-sm">
          <pre className="text-green-400 overflow-x-auto">
            {JSON.stringify(report.config, null, 2)}
          </pre>
        </div>
      </RetroCard>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RetroButton onClick={() => setIsEditing(true)} variant="primary">
          EDIT REPORT
        </RetroButton>
        <RetroButton onClick={handleShare} variant="secondary">
          SHARE LINK
        </RetroButton>
        <RetroButton onClick={handleDownload} variant="secondary">
          DOWNLOAD
        </RetroButton>
        <RetroButton
          onClick={handleDelete}
          variant="danger"
          disabled={deleteReportMutation.isPending}
        >
          {deleteReportMutation.isPending ? 'DELETING...' : 'DELETE'}
        </RetroButton>
      </div>

      {/* Report Preview Info */}
      <RetroCard title="REPORT PREVIEW">
        <div className="text-green-400 font-mono text-sm space-y-2">
          <p>&gt; Charts: {report.config?.charts?.join(', ') || 'None'}</p>
          <p>&gt; Date Range: {report.config?.dateRange || 'Not specified'}</p>
          <p>&gt; Metrics: {report.config?.metrics?.join(', ') || 'None'}</p>
          <p className="text-green-600 text-xs mt-4">
            * Full report visualization will be available in future updates
          </p>
        </div>
      </RetroCard>
    </div>
  )
}
