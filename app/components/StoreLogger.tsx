'use client';

import { useEffect, useRef } from 'react';
import { useRecipeStore } from '@/app/lib/RecipeStore';

export function StoreLogger() {
  const store = useRecipeStore();
  const logged = useRef(false);

  useEffect(() => {
    if (!logged.current) {
      logged.current = true;
      const recipes = store.getRecipes();
      console.log('StoreLogger — recipes count:', recipes.length);
      console.log('StoreLogger — first recipe:', recipes[0]?.title);
    }
  }, [store]);

  return null;
}
