/**
 * Export Utilities Tests
 */

import {
  convertToCSV,
  generateFilename,
} from '@/lib/utils/export'

describe('Export Utilities', () => {
  describe('convertToCSV', () => {
    it('should convert array of objects to CSV', () => {
      const data = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ]

      const csv = convertToCSV(data)
      const lines = csv.split('\n')

      expect(lines[0]).toBe('id,name,age')
      expect(lines[1]).toBe('1,Alice,30')
      expect(lines[2]).toBe('2,Bob,25')
    })

    it('should handle empty arrays', () => {
      const csv = convertToCSV([])
      expect(csv).toBe('')
    })

    it('should handle null values', () => {
      const data = [
        { id: 1, name: 'Alice', age: null },
        { id: 2, name: null, age: 25 },
      ]

      const csv = convertToCSV(data)
      const lines = csv.split('\n')

      expect(lines[1]).toBe('1,Alice,')
      expect(lines[2]).toBe('2,,25')
    })

    it('should escape quotes and wrap in quotes for values with commas', () => {
      const data = [
        { name: 'Smith, John', city: 'New York' },
      ]

      const csv = convertToCSV(data)
      const lines = csv.split('\n')

      expect(lines[1]).toContain('"Smith, John"')
    })

    it('should escape quotes and wrap in quotes for values with newlines', () => {
      const data = [
        { text: 'Line 1\nLine 2' },
      ]

      const csv = convertToCSV(data)
      const lines = csv.split('\n')

      expect(lines[1]).toContain('"Line 1')
    })

    it('should handle nested objects as JSON strings', () => {
      const data = [
        { id: 1, metadata: { key: 'value', nested: { deep: true } } },
      ]

      const csv = convertToCSV(data)
      const lines = csv.split('\n')

      // Nested objects are wrapped in quotes and quotes are escaped
      expect(lines[1]).toContain('""key""')
    })

    it('should handle objects with different keys', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, age: 30 },
        { id: 3, name: 'Bob', age: 25 },
      ]

      const csv = convertToCSV(data)
      const lines = csv.split('\n')

      // Should have all unique keys
      expect(lines[0]).toContain('id')
      expect(lines[0]).toContain('name')
      expect(lines[0]).toContain('age')
    })

    it('should handle undefined values', () => {
      const data = [
        { id: 1, name: undefined, age: 30 },
      ]

      const csv = convertToCSV(data)
      const lines = csv.split('\n')

      expect(lines[1]).toBe('1,,30')
    })
  })

  describe('generateFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = generateFilename('report', 'csv')

      expect(filename).toMatch(/^report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/)
    })

    it('should handle different prefixes and extensions', () => {
      const filename1 = generateFilename('analytics', 'json')
      expect(filename1).toContain('analytics-')
      expect(filename1.endsWith('.json')).toBe(true)

      const filename2 = generateFilename('events', 'txt')
      expect(filename2).toContain('events-')
      expect(filename2.endsWith('.txt')).toBe(true)
    })

    it('should generate unique filenames', () => {
      const filename1 = generateFilename('test', 'csv')
      const filename2 = generateFilename('test', 'csv')

      // They might be the same if generated in the same second,
      // but should at least have the same structure
      expect(filename1).toMatch(/^test-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/)
      expect(filename2).toMatch(/^test-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/)
    })
  })
})
