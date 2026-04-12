'use client'

import { FileText, Download, FileSpreadsheet, Calendar, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { ConfirmationSection, KeyValuePair, SectionGrid } from './ConfirmationSection'
import type { PackageDocumentationData } from './types'
import { cn } from '@/lib/utils'

interface PackageDocumentationSectionProps {
  data: PackageDocumentationData
}

export function PackageDocumentationSection({ data }: PackageDocumentationSectionProps) {
  const getStatusIcon = () => {
    switch (data.labelStatus) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'generating':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (data.labelStatus) {
      case 'ready':
        return 'Ready for download'
      case 'generating':
        return 'Generating label...'
      case 'error':
        return 'Error generating label'
      default:
        return ''
    }
  }

  return (
    <ConfirmationSection
      title="Package Documentation"
      icon={<FileText className="w-4 h-4 text-blue-600" />}
      defaultExpanded={false}
    >
      {/* Shipping Label Status */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Shipping Label
        </h4>
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border',
            data.labelStatus === 'ready'
              ? 'bg-green-50 border-green-200'
              : data.labelStatus === 'generating'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          )}
        >
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {getStatusText()}
            </p>
            <p className="text-xs text-gray-600">
              Print and attach to your package before pickup
            </p>
          </div>
        </div>
      </div>

      {/* Required Documents Checklist */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Required Documents Checklist
        </h4>
        <ul className="space-y-2">
          {data.requiredDocs.map((doc, index) => (
            <li
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                doc.completed
                  ? 'bg-green-50 border-green-200'
                  : doc.required
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center',
                  doc.completed
                    ? 'bg-green-500 text-white'
                    : doc.required
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-300 text-white'
                )}
              >
                {doc.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">
                    {doc.required ? '!' : '−'}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-sm',
                  doc.completed
                    ? 'text-green-800'
                    : doc.required
                    ? 'text-amber-800'
                    : 'text-gray-600'
                )}
              >
                {doc.name}
                {doc.required && !doc.completed && (
                  <span className="ml-2 text-xs font-medium text-amber-700">
                    (Required)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Download Buttons (Stubs for v1) */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Downloads
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={data.labelStatus !== 'ready'}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              data.labelStatus === 'ready'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
            onClick={() => alert('Download PDF - Stub for v1')}
          >
            <FileText className="w-4 h-4" />
            Shipping Label (PDF)
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            onClick={() => alert('Download CSV - Stub for v1')}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Shipment Details (CSV)
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            onClick={() => alert('Download ICS - Stub for v1')}
          >
            <Calendar className="w-4 h-4" />
            Add to Calendar (.ics)
          </button>
        </div>
      </div>
    </ConfirmationSection>
  )
}
