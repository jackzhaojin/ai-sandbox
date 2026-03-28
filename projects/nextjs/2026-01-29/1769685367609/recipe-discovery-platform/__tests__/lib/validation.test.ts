import {
  isValidUUID,
  isValidEmail,
  isValidDifficulty,
  isValidIngredientCategory,
  isValidUnit,
  sanitizeString,
  isPositiveInteger,
  isNonNegativeInteger,
  isValidRating,
  isValidLength,
  isNonEmptyArray,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('isValidUUID', () => {
    it('validates correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidDifficulty', () => {
    it('validates correct difficulty levels', () => {
      expect(isValidDifficulty('easy')).toBe(true);
      expect(isValidDifficulty('medium')).toBe(true);
      expect(isValidDifficulty('hard')).toBe(true);
    });

    it('rejects invalid difficulty levels', () => {
      expect(isValidDifficulty('expert')).toBe(false);
      expect(isValidDifficulty('beginner')).toBe(false);
      expect(isValidDifficulty('')).toBe(false);
      expect(isValidDifficulty('EASY')).toBe(false);
    });
  });

  describe('isValidIngredientCategory', () => {
    it('validates correct categories', () => {
      expect(isValidIngredientCategory('vegetable')).toBe(true);
      expect(isValidIngredientCategory('fruit')).toBe(true);
      expect(isValidIngredientCategory('protein')).toBe(true);
      expect(isValidIngredientCategory('dairy')).toBe(true);
      expect(isValidIngredientCategory('grain')).toBe(true);
      expect(isValidIngredientCategory('spice')).toBe(true);
      expect(isValidIngredientCategory('condiment')).toBe(true);
      expect(isValidIngredientCategory('oil')).toBe(true);
      expect(isValidIngredientCategory('sweetener')).toBe(true);
      expect(isValidIngredientCategory('other')).toBe(true);
    });

    it('rejects invalid categories', () => {
      expect(isValidIngredientCategory('meat')).toBe(false);
      expect(isValidIngredientCategory('unknown')).toBe(false);
      expect(isValidIngredientCategory('')).toBe(false);
    });
  });

  describe('isValidUnit', () => {
    it('validates correct units', () => {
      expect(isValidUnit('cup')).toBe(true);
      expect(isValidUnit('tbsp')).toBe(true);
      expect(isValidUnit('tsp')).toBe(true);
      expect(isValidUnit('gram')).toBe(true);
      expect(isValidUnit('kg')).toBe(true);
      expect(isValidUnit('oz')).toBe(true);
      expect(isValidUnit('lb')).toBe(true);
      expect(isValidUnit('ml')).toBe(true);
      expect(isValidUnit('liter')).toBe(true);
      expect(isValidUnit('pinch')).toBe(true);
      expect(isValidUnit('piece')).toBe(true);
      expect(isValidUnit('whole')).toBe(true);
      expect(isValidUnit('to_taste')).toBe(true);
    });

    it('rejects invalid units', () => {
      expect(isValidUnit('gallon')).toBe(false);
      expect(isValidUnit('pound')).toBe(false);
      expect(isValidUnit('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\thello\n\t')).toBe('hello');
    });

    it('replaces multiple spaces with single space', () => {
      expect(sanitizeString('hello    world')).toBe('hello world');
      expect(sanitizeString('hello  \n  world')).toBe('hello world');
    });

    it('handles already clean strings', () => {
      expect(sanitizeString('hello world')).toBe('hello world');
    });
  });

  describe('isPositiveInteger', () => {
    it('validates positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
      expect(isPositiveInteger(999999)).toBe(true);
    });

    it('rejects zero and negative numbers', () => {
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(-1)).toBe(false);
      expect(isPositiveInteger(-100)).toBe(false);
    });

    it('rejects non-integers', () => {
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger(0.1)).toBe(false);
    });
  });

  describe('isNonNegativeInteger', () => {
    it('validates non-negative integers', () => {
      expect(isNonNegativeInteger(0)).toBe(true);
      expect(isNonNegativeInteger(1)).toBe(true);
      expect(isNonNegativeInteger(100)).toBe(true);
    });

    it('rejects negative numbers', () => {
      expect(isNonNegativeInteger(-1)).toBe(false);
      expect(isNonNegativeInteger(-100)).toBe(false);
    });

    it('rejects non-integers', () => {
      expect(isNonNegativeInteger(1.5)).toBe(false);
      expect(isNonNegativeInteger(0.1)).toBe(false);
    });
  });

  describe('isValidRating', () => {
    it('validates ratings from 1 to 5', () => {
      expect(isValidRating(1)).toBe(true);
      expect(isValidRating(2)).toBe(true);
      expect(isValidRating(3)).toBe(true);
      expect(isValidRating(4)).toBe(true);
      expect(isValidRating(5)).toBe(true);
    });

    it('rejects ratings out of range', () => {
      expect(isValidRating(0)).toBe(false);
      expect(isValidRating(6)).toBe(false);
      expect(isValidRating(-1)).toBe(false);
      expect(isValidRating(10)).toBe(false);
    });

    it('rejects non-integers', () => {
      expect(isValidRating(3.5)).toBe(false);
      expect(isValidRating(4.9)).toBe(false);
    });
  });

  describe('isValidLength', () => {
    it('validates strings within length range', () => {
      expect(isValidLength('hello', 1, 10)).toBe(true);
      expect(isValidLength('test', 4, 4)).toBe(true);
      expect(isValidLength('ab', 1, 5)).toBe(true);
    });

    it('rejects strings outside length range', () => {
      expect(isValidLength('', 1, 10)).toBe(false);
      expect(isValidLength('a', 2, 10)).toBe(false);
      expect(isValidLength('hello world', 1, 5)).toBe(false);
    });

    it('trims strings before checking length', () => {
      expect(isValidLength('  hi  ', 2, 2)).toBe(true);
      expect(isValidLength('  hello  ', 1, 5)).toBe(true);
    });
  });

  describe('isNonEmptyArray', () => {
    it('validates non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray(['a', 'b'])).toBe(true);
    });

    it('rejects empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it('rejects non-arrays', () => {
      expect(isNonEmptyArray('not an array' as any)).toBe(false);
      expect(isNonEmptyArray(null as any)).toBe(false);
      expect(isNonEmptyArray(undefined as any)).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    it('creates error response with default status code', async () => {
      const response = createErrorResponse('Something went wrong');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: 'Something went wrong',
      });
    });

    it('creates error response with custom status code', async () => {
      const response = createErrorResponse('Not found', 404);

      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: 'Not found',
      });
    });

    it('sets correct content-type header', () => {
      const response = createErrorResponse('Error');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('createSuccessResponse', () => {
    it('creates success response with default status code', async () => {
      const data = { id: '123', name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
      });
    });

    it('creates success response with custom status code', async () => {
      const data = { id: '123' };
      const response = createSuccessResponse(data, 201);

      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data,
      });
    });

    it('sets correct content-type header', () => {
      const response = createSuccessResponse({ test: true });
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
