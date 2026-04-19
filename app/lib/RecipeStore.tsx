'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Recipe } from './types';
import seedRecipes from '../data/seed-recipes.json';

interface StoreData {
  recipes: Recipe[];
  favorites: string[];
}

interface RecipeStoreValue {
  getRecipes: () => Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, partial: Partial<Recipe>) => void;
  toggleFavorite: (id: string) => void;
  getFavorites: () => Recipe[];
}

const STORAGE_KEY = 'recipe-book:v1';

const RecipeStoreContext = createContext<RecipeStoreValue | null>(null);

export function RecipeStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StoreData | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoreData;
        setData(parsed);
      } catch {
        const initial: StoreData = { recipes: seedRecipes as Recipe[], favorites: [] };
        setData(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } else {
      const initial: StoreData = { recipes: seedRecipes as Recipe[], favorites: [] };
      setData(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }, []);

  const persist = useCallback((updater: (prev: StoreData) => StoreData) => {
    setData(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getRecipes = useCallback(() => data?.recipes ?? [], [data]);

  const getRecipeById = useCallback(
    (id: string) => data?.recipes.find(r => r.id === id),
    [data]
  );

  const addRecipe = useCallback((recipe: Recipe) => {
    persist(prev => ({ ...prev, recipes: [...prev.recipes, recipe] }));
  }, [persist]);

  const updateRecipe = useCallback((id: string, partial: Partial<Recipe>) => {
    persist(prev => ({
      ...prev,
      recipes: prev.recipes.map(r => (r.id === id ? { ...r, ...partial } : r)),
    }));
  }, [persist]);

  const toggleFavorite = useCallback((id: string) => {
    persist(prev => {
      const isFav = prev.favorites.includes(id);
      return {
        ...prev,
        favorites: isFav ? prev.favorites.filter(fid => fid !== id) : [...prev.favorites, id],
      };
    });
  }, [persist]);

  const getFavorites = useCallback(() => {
    if (!data) return [];
    return data.recipes.filter(r => data.favorites.includes(r.id));
  }, [data]);

  useEffect(() => {
    if (data) {
      console.log('RecipeStore initialized — recipes:', data.recipes.length, 'favorites:', data.favorites.length);
    }
  }, [data]);

  const value = useMemo(
    () => ({
      getRecipes,
      getRecipeById,
      addRecipe,
      updateRecipe,
      toggleFavorite,
      getFavorites,
    }),
    [getRecipes, getRecipeById, addRecipe, updateRecipe, toggleFavorite, getFavorites]
  );

  return (
    <RecipeStoreContext.Provider value={value}>
      {children}
    </RecipeStoreContext.Provider>
  );
}

export function useRecipeStore(): RecipeStoreValue {
  const ctx = useContext(RecipeStoreContext);
  if (!ctx) {
    throw new Error('useRecipeStore must be used within a RecipeStoreProvider');
  }
  return ctx;
}
