'use client'

import React, { useState } from 'react'
import { RetroButton } from '@/components/ui/RetroButton'
import { exportToCSV, exportToJSON, generateFilename } from '@/lib/utils/export'
import { useToast } from '@/lib/hooks/useToast'

interface ExportMenuProps {
  data: any[]
  filename?: string
}

export function ExportMenu({ data, filename = 'analytics-export' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const toast = useToast()

  function handleExportCSV() {
    try {
      const csvFilename = generateFilename(filename, 'csv')
      exportToCSV(data, csvFilename)
      toast.success(`Exported ${data.length} rows to ${csvFilename}`)
      setIsOpen(false)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    }
  }

  function handleExportJSON() {
    try {
      const jsonFilename = generateFilename(filename, 'json')
      exportToJSON(data, jsonFilename)
      toast.success(`Exported ${data.length} records to ${jsonFilename}`)
      setIsOpen(false)
    } catch (error) {
      console.error('Error exporting JSON:', error)
      toast.error('Failed to export JSON')
    }
  }

  if (!isOpen) {
    return (
      <RetroButton onClick={() => setIsOpen(true)} variant="secondary">
        EXPORT DATA
      </RetroButton>
    )
  }

  return (
    <div className="relative">
      <div className="border-2 border-green-500 bg-black p-4 shadow-[0_0_20px_rgba(0,255,0,0.3)] space-y-3">
        <div className="text-green-500 font-mono text-sm uppercase mb-2">
          &gt; Export Options ({data.length} records)
        </div>
        <RetroButton onClick={handleExportCSV} variant="primary" className="w-full">
          EXPORT AS CSV
        </RetroButton>
        <RetroButton onClick={handleExportJSON} variant="primary" className="w-full">
          EXPORT AS JSON
        </RetroButton>
        <RetroButton onClick={() => setIsOpen(false)} variant="secondary" className="w-full">
          CANCEL
        </RetroButton>
      </div>
    </div>
  )
}
