/**
 * Convert array of objects to CSV format
 */
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return ''
  }

  // Get all unique keys from all objects
  const keys = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  )

  // Create header row
  const header = keys.join(',')

  // Create data rows
  const rows = data.map((item) => {
    return keys
      .map((key) => {
        const value = item[key]
        // Handle different types of values
        if (value === null || value === undefined) {
          return ''
        }
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        // Escape quotes and wrap in quotes if contains comma or newline
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * Download data as a file
 */
export function downloadFile(content: string, filename: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV and download
 */
export function exportToCSV(data: any[], filename: string) {
  const csv = convertToCSV(data)
  downloadFile(csv, filename, 'text/csv')
}

/**
 * Export data to JSON and download
 */
export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `${prefix}-${timestamp}.${extension}`
}
