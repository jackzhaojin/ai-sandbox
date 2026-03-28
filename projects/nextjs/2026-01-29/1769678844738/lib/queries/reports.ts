import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
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

interface CreateReportData {
  name: string
  description?: string
  config?: any
  isPublic?: boolean
}

interface UpdateReportData {
  name?: string
  description?: string
  config?: any
  isPublic?: boolean
}

// Fetch all reports
async function fetchReports(includePublic = true): Promise<Report[]> {
  const params = new URLSearchParams()
  if (includePublic) params.append('includePublic', 'true')

  const response = await fetch(`/api/reports?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch reports')
  }
  const data = await response.json()
  return data.reports || []
}

// Fetch single report
async function fetchReport(id: string): Promise<Report> {
  const response = await fetch(`/api/reports/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch report')
  }
  return response.json()
}

// Create report
async function createReport(data: CreateReportData): Promise<Report> {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create report')
  }
  return response.json()
}

// Update report
async function updateReport(
  id: string,
  data: UpdateReportData
): Promise<Report> {
  const response = await fetch(`/api/reports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update report')
  }
  return response.json()
}

// Delete report
async function deleteReport(id: string): Promise<void> {
  const response = await fetch(`/api/reports/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete report')
  }
}

// Hooks

/**
 * Hook to fetch all reports
 */
export function useReports(includePublic = true) {
  return useQuery({
    queryKey: ['reports', includePublic],
    queryFn: () => fetchReports(includePublic),
  })
}

/**
 * Hook to fetch a single report
 */
export function useReport(id: string) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => fetchReport(id),
    enabled: !!id, // Only fetch if id is provided
  })
}

/**
 * Hook to create a report
 */
export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      // Invalidate and refetch reports list
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

/**
 * Hook to update a report
 */
export function useUpdateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReportData }) =>
      updateReport(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific report and reports list
      queryClient.invalidateQueries({ queryKey: ['reports', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

/**
 * Hook to delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      // Invalidate and refetch reports list
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}
