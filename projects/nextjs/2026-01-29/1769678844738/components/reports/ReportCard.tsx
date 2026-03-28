'use client'

import React from 'react'
import Link from 'next/link'
import { RetroButton } from '@/components/ui/RetroButton'

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

interface ReportCardProps {
  report: Report
  onEdit: () => void
  onDelete: () => void
}

export function ReportCard({ report, onEdit, onDelete }: ReportCardProps) {
  return (
    <div className="border-2 border-green-500 bg-black p-6 shadow-[0_0_20px_rgba(0,255,0,0.3)] flex flex-col">
      <div className="flex-1 mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-green-400 font-mono uppercase">
            {report.name}
          </h3>
          {report.isPublic && (
            <span className="text-xs text-cyan-400 border border-cyan-400 px-2 py-1 font-mono">
              PUBLIC
            </span>
          )}
        </div>

        {report.description && (
          <p className="text-green-500 font-mono text-sm mb-4">
            {report.description}
          </p>
        )}

        <div className="text-green-600 font-mono text-xs space-y-1">
          <div>&gt; Created: {new Date(report.createdAt).toLocaleDateString()}</div>
          <div>&gt; Updated: {new Date(report.updatedAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Link href={`/dashboard/reports/${report.id}`} className="flex-1">
          <RetroButton className="w-full" variant="secondary">
            VIEW
          </RetroButton>
        </Link>
        <RetroButton onClick={onEdit} className="flex-1" variant="primary">
          EDIT
        </RetroButton>
        <RetroButton onClick={onDelete} className="flex-1" variant="danger">
          DELETE
        </RetroButton>
      </div>
    </div>
  )
}
