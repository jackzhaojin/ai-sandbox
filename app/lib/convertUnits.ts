import type { Ingredient } from './types';

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function convertIngredient(
  ingredient: Ingredient,
  toUnits: 'metric' | 'imperial'
): Ingredient {
  if (toUnits === 'metric') {
    switch (ingredient.unit) {
      case 'oz': {
        return {
          ...ingredient,
          quantity: round(ingredient.quantity * 28.35),
          unit: 'g',
        };
      }
      case 'lb': {
        return {
          ...ingredient,
          quantity: round(ingredient.quantity * 0.453592),
          unit: 'kg',
        };
      }
      case 'fl oz': {
        return {
          ...ingredient,
          quantity: round(ingredient.quantity * 29.57),
          unit: 'ml',
        };
      }
      case 'cup':
      case 'cups': {
        return {
          ...ingredient,
          quantity: round(ingredient.quantity * 250),
          unit: 'ml',
        };
      }
      default:
        return { ...ingredient };
    }
  }

  // imperial
  switch (ingredient.unit) {
    case 'g': {
      if (ingredient.quantity >= 454) {
        return {
          ...ingredient,
          quantity: round(ingredient.quantity * 0.00220462),
          unit: 'lb',
        };
      }
      return {
        ...ingredient,
        quantity: round(ingredient.quantity / 28.35),
        unit: 'oz',
      };
    }
    case 'kg': {
      return {
        ...ingredient,
        quantity: round(ingredient.quantity / 0.453592),
        unit: 'lb',
      };
    }
    case 'ml': {
      if (ingredient.quantity >= 250) {
        return {
          ...ingredient,
          quantity: round(ingredient.quantity / 250),
          unit: 'cup',
        };
      }
      return {
        ...ingredient,
        quantity: round(ingredient.quantity / 29.57),
        unit: 'fl oz',
      };
    }
    default:
      return { ...ingredient };
  }
}
