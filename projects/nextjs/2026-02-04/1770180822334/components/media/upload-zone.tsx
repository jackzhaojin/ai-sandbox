'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  result?: any
}

interface UploadZoneProps {
  siteId: string
  folderId: string | null
  onUploadComplete: () => void
}

export function UploadZone({ siteId, folderId, onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 20) // Max 20 files

    const uploadFiles: UploadFile[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
    }))

    setUploadFiles(prev => [...prev, ...uploadFiles])
    startUpload(uploadFiles)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Reset input
    e.target.value = ''
  }, [processFiles])

  const startUpload = async (filesToUpload: UploadFile[]) => {
    // Upload in batches of 5
    const batchSize = 5
    for (let i = 0; i < filesToUpload.length; i += batchSize) {
      const batch = filesToUpload.slice(i, i + batchSize)
      await Promise.all(batch.map(uploadFile => uploadSingleFile(uploadFile)))
    }

    // Check if all uploads are complete
    onUploadComplete()
  }

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    setUploadFiles(prev =>
      prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' } : f)
    )

    try {
      const formData = new FormData()
      formData.append('files', uploadFile.file)
      formData.append('siteId', siteId)
      if (folderId) {
        formData.append('folderId', folderId)
      }

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadFiles(prev =>
            prev.map(f => f.id === uploadFile.id ? { ...f, progress } : f)
          )
        }
      })

      // Handle completion
      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            setUploadFiles(prev =>
              prev.map(f =>
                f.id === uploadFile.id
                  ? { ...f, status: 'success', progress: 100, result: response }
                  : f
              )
            )
            resolve(response)
          } else {
            const error = xhr.responseText || 'Upload failed'
            setUploadFiles(prev =>
              prev.map(f =>
                f.id === uploadFile.id
                  ? { ...f, status: 'error', error }
                  : f
              )
            )
            reject(new Error(error))
          }
        })

        xhr.addEventListener('error', () => {
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, status: 'error', error: 'Network error' }
                : f
            )
          )
          reject(new Error('Network error'))
        })

        xhr.open('POST', '/api/media/upload')
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status === 'uploading' || f.status === 'pending'))
  }

  const hasActiveUploads = uploadFiles.some(f => f.status === 'uploading' || f.status === 'pending')
  const hasCompletedUploads = uploadFiles.some(f => f.status === 'success' || f.status === 'error')

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-900 mb-1">
          Drop files to upload
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse (max 20 files, 10MB each)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          Select Files
        </Button>
      </div>

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium text-gray-900">
              Uploading {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
            </h3>
            {hasCompletedUploads && !hasActiveUploads && (
              <Button size="sm" variant="ghost" onClick={clearCompleted}>
                Clear
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {uploadFiles.map(uploadFile => (
              <div key={uploadFile.id} className="flex items-center gap-3 p-4 border-b last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <span className="text-xs text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  {uploadFile.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}

                  {uploadFile.status === 'error' && (
                    <p className="text-xs text-red-600">{uploadFile.error}</p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {uploadFile.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full bg-gray-200" />
                  )}
                  {uploadFile.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                {uploadFile.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
