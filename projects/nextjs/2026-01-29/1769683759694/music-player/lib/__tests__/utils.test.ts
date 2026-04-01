/**
 * Unit tests for utility functions
 */

import { cn } from '../utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'visible');
      expect(result).toContain('base');
      expect(result).toContain('visible');
      expect(result).not.toContain('hidden');
    });

    it('should merge Tailwind classes correctly', () => {
      // When conflicting Tailwind classes are provided, twMerge should keep the last one
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'final');
      expect(result).toContain('base');
      expect(result).toContain('final');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'visible': true,
      });
      expect(result).toContain('active');
      expect(result).toContain('visible');
      expect(result).not.toContain('disabled');
    });
  });
});
