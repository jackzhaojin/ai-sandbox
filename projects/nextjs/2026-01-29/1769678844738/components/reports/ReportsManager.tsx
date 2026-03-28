'use client'

import React, { useState } from 'react'
import { ReportCard } from './ReportCard'
import { ReportBuilder } from './ReportBuilder'
import { RetroButton } from '@/components/ui/RetroButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useReports, useDeleteReport } from '@/lib/queries/reports'
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

export function ReportsManager() {
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const toast = useToast()

  // Fetch reports with React Query
  const { data, isLoading, error } = useReports(true)
  const deleteReportMutation = useDeleteReport()

  const reports = data || []

  async function handleDelete(reportId: string) {
    if (!confirm('Are you sure you want to delete this report?')) {
      return
    }

    try {
      await deleteReportMutation.mutateAsync(reportId)
      toast.success('Report deleted successfully')
    } catch (err) {
      console.error('Error deleting report:', err)
      toast.error('Failed to delete report')
    }
  }

  function handleEdit(report: Report) {
    setEditingReport(report)
    setShowBuilder(true)
  }

  function handleCreate() {
    setEditingReport(null)
    setShowBuilder(true)
  }

  function handleCloseBuilder() {
    setShowBuilder(false)
    setEditingReport(null)
  }

  function handleSaveComplete() {
    handleCloseBuilder()
  }

  if (isLoading) {
    return <LoadingSpinner message="LOADING REPORTS" />
  }

  if (error) {
    return (
      <div className="border-2 border-red-500 bg-black p-6 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
        <div className="text-red-500 font-mono">
          <div className="text-xl mb-2">&gt; ERROR</div>
          <div className="text-sm">
            {error instanceof Error ? error.message : 'Failed to load reports'}
          </div>
        </div>
      </div>
    )
  }

  if (showBuilder) {
    return (
      <ReportBuilder
        report={editingReport}
        onSave={handleSaveComplete}
        onCancel={handleCloseBuilder}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-green-400 font-mono text-sm">
          &gt; {reports.length} reports found
        </div>
        <RetroButton onClick={handleCreate}>
          + CREATE NEW REPORT
        </RetroButton>
      </div>

      {reports.length === 0 ? (
        <div className="border-2 border-green-500 bg-black p-12 text-center shadow-[0_0_20px_rgba(0,255,0,0.3)]">
          <div className="text-green-600 font-mono text-xl mb-4">
            &gt; NO REPORTS FOUND
          </div>
          <div className="text-green-400 font-mono text-sm mb-6">
            Create your first analytics report to get started
          </div>
          <RetroButton onClick={handleCreate}>
            CREATE YOUR FIRST REPORT
          </RetroButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onEdit={() => handleEdit(report)}
              onDelete={() => handleDelete(report.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
