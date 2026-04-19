'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipeStore } from '@/app/lib/RecipeStore';
import type { Recipe, Ingredient } from '@/app/lib/types';
import Link from 'next/link';

const CATEGORIES = ['Main', 'Dessert', 'Salad', 'Appetizer', 'Drink'];

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface FormErrors {
  title?: string;
  ingredients?: string;
}

interface RecipeFormProps {
  mode: 'create' | 'edit';
  initialRecipe?: Recipe;
}

export default function RecipeForm({ mode, initialRecipe }: RecipeFormProps) {
  const router = useRouter();
  const { addRecipe, updateRecipe } = useRecipeStore();

  const [title, setTitle] = useState(initialRecipe?.title ?? '');
  const [category, setCategory] = useState(initialRecipe?.category ?? 'Main');
  const [imageUrl, setImageUrl] = useState(initialRecipe?.imageUrl ?? '');
  const [prepTime, setPrepTime] = useState(
    initialRecipe?.prepTime ? String(initialRecipe.prepTime) : ''
  );
  const [cookTime, setCookTime] = useState(
    initialRecipe?.cookTime ? String(initialRecipe.cookTime) : ''
  );
  const [instructions, setInstructions] = useState(
    Array.isArray(initialRecipe?.instructions)
      ? initialRecipe.instructions.join('\n\n')
      : initialRecipe?.instructions ?? ''
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialRecipe?.ingredients && initialRecipe.ingredients.length > 0
      ? initialRecipe.ingredients.map(i => ({ ...i }))
      : [{ name: '', quantity: 0, unit: '' }]
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addIngredient = useCallback(() => {
    setIngredients(prev => [...prev, { name: '', quantity: 0, unit: '' }]);
  }, []);

  const removeIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateIngredient = useCallback(
    (index: number, field: keyof Ingredient, value: string | number) => {
      setIngredients(prev =>
        prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
      );
    },
    []
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    const validIngredients = ingredients.filter(
      ing => ing.name.trim() && ing.quantity > 0 && ing.unit.trim()
    );
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'At least one complete ingredient is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const validIngredients = ingredients.filter(
      ing => ing.name.trim() && ing.quantity > 0 && ing.unit.trim()
    );

    const recipeData: Omit<Recipe, 'id'> = {
      title: title.trim(),
      category,
      imageUrl:
        imageUrl.trim() ||
        'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
      prepTime: Number(prepTime) || 0,
      cookTime: Number(cookTime) || 0,
      ingredients: validIngredients,
      instructions: instructions.trim() || 'No instructions provided.',
    };

    if (mode === 'edit' && initialRecipe) {
      updateRecipe(initialRecipe.id, recipeData);
      router.push(`/recipes/${initialRecipe.id}`);
    } else {
      const newRecipe: Recipe = {
        id: generateId(),
        ...recipeData,
      };
      addRecipe(newRecipe);
      router.push(`/recipes/${newRecipe.id}`);
    }
  };

  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Save Recipe';
  const cancelHref =
    mode === 'edit' && initialRecipe
      ? `/recipes/${initialRecipe.id}`
      : '/recipes';

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
          }}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          placeholder="e.g. Classic Spaghetti Bolognese"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Image URL */}
      <div>
        <label
          htmlFor="imageUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Image URL
        </label>
        <input
          id="imageUrl"
          type="text"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="prepTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prep Time (minutes)
          </label>
          <input
            id="prepTime"
            type="number"
            min={0}
            value={prepTime}
            onChange={e => setPrepTime(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="15"
          />
        </div>
        <div>
          <label
            htmlFor="cookTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Cook Time (minutes)
          </label>
          <input
            id="cookTime"
            type="number"
            min={0}
            value={cookTime}
            onChange={e => setCookTime(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="30"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ingredients <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addIngredient}
            className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            + Add Ingredient
          </button>
        </div>
        {errors.ingredients && (
          <p className="mt-1 text-sm text-red-600">{errors.ingredients}</p>
        )}

        <div className="mt-3 space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-3 gap-2">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={e => updateIngredient(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={ingredient.quantity || ''}
                  onChange={e =>
                    updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)
                  }
                  placeholder="Qty"
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={e => updateIngredient(index, 'unit', e.target.value)}
                  placeholder="Unit"
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="mt-2 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  aria-label={`Remove ingredient ${index + 1}`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label
          htmlFor="instructions"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Instructions
        </label>
        <textarea
          id="instructions"
          rows={6}
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          placeholder="Step 1: Heat olive oil..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
