export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  ingredients: Ingredient[];
  instructions: string | string[];
  prepTime: number;
  cookTime: number;
  imageUrl: string;
}

export interface Settings {
  units: 'metric' | 'imperial';
}

export interface RecipeStore {
  recipes: Recipe[];
  favorites: string[];
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
}
