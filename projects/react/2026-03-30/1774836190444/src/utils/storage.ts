/**
 * localStorage utilities for persisting notes data
 */

import type { Note } from '../types'

export const STORAGE_KEY = 'react-notes-app'

/**
 * Type guard to validate that data matches Note[] structure
 */
function isNoteArray(data: unknown): data is Note[] {
  if (!Array.isArray(data)) {
    return false
  }

  return data.every((item) => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.body === 'string' &&
      typeof item.createdAt === 'number'
    )
  })
}

/**
 * Load notes from localStorage
 * Returns an empty array if no notes exist or if data is invalid
 */
export function loadNotes(): Note[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    // Validate that parsed data matches Note[] structure
    if (!isNoteArray(parsed)) {
      console.warn('Invalid note data in localStorage, returning empty array')
      return []
    }

    return parsed
  } catch (error) {
    // Handle JSON parse errors or other exceptions
    console.error('Error loading notes from localStorage:', error)
    return []
  }
}

/**
 * Save notes to localStorage
 */
export function saveNotes(notes: Note[]): void {
  try {
    const serialized = JSON.stringify(notes)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    // Handle quota exceeded errors or other exceptions
    console.error('Error saving notes to localStorage:', error)
    throw error
  }
}
