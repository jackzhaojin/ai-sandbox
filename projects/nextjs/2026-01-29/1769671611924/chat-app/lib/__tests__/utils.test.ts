import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility function', () => {
  it('should merge classes correctly', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class')
  })

  it('should handle false conditional classes', () => {
    const isActive = false
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class')
  })

  it('should handle conflicting Tailwind classes correctly', () => {
    // tailwind-merge should keep the last one
    const result = cn('px-4 py-2', 'px-8')
    expect(result).toBe('py-2 px-8')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold')
  })

  it('should handle objects with conditional classes', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-500': false,
    })
    expect(result).toBe('text-red-500')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('should handle complex combined inputs', () => {
    const isActive = true
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      {
        'conditional-true': isActive,
        'conditional-false': !isActive,
      },
      isActive && 'active',
      'final-class'
    )
    expect(result).toContain('base-class')
    expect(result).toContain('array-class-1')
    expect(result).toContain('conditional-true')
    expect(result).toContain('active')
    expect(result).toContain('final-class')
    expect(result).not.toContain('conditional-false')
  })
})
