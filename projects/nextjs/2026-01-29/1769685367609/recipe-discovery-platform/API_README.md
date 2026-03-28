# API Documentation

This document provides comprehensive documentation for all API endpoints and Server Actions in the Recipe Discovery Platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Server Actions](#server-actions)
  - [Recipe Actions](#recipe-actions)
  - [Ingredient Actions](#ingredient-actions)
  - [Dietary Tag Actions](#dietary-tag-actions)
  - [Favorite Actions](#favorite-actions)
- [REST API Endpoints](#rest-api-endpoints)
  - [Recipes API](#recipes-api)
  - [Ingredients API](#ingredients-api)
  - [Dietary Tags API](#dietary-tags-api)
  - [Favorites API](#favorites-api)
- [Error Handling](#error-handling)
- [Validation](#validation)

---

## Overview

The API is built with **Next.js 15 App Router** and uses:
- **Server Actions** for mutations (create, update, delete)
- **REST API Routes** for queries (read operations)
- **Authentication** via Auth.js v5 (NextAuth)
- **Type-safe** database queries with Drizzle ORM

All endpoints require authentication. Unauthorized requests return a 401 error.

---

## Authentication

All API endpoints and Server Actions check for authentication using the `auth()` helper from Auth.js.

```typescript
const session = await auth();

if (!session?.user) {
  return { success: false, error: "Unauthorized. Please log in." };
}
```

The authenticated user's data is available via `session.user`:
- `session.user.id` - User UUID
- `session.user.email` - User email
- `session.user.name` - User name

---

## Server Actions

Server Actions are used for mutations (create, update, delete) and can be called from Client or Server Components.

### Recipe Actions

File: `actions/recipe-actions.ts`

#### `createRecipe(input: RecipeInput)`

Create a new recipe with ingredients, instructions, and dietary tags.

**Input Type:**
```typescript
interface RecipeInput {
  title: string;
  description: string;
  prepTime: number;        // in minutes
  cookTime: number;        // in minutes
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisineType?: string;
  imageUrl?: string;
  ingredients: RecipeIngredientInput[];
  instructions: InstructionInput[];
  dietaryTagIds: string[];
}

interface RecipeIngredientInput {
  ingredientId: string;
  quantity: string;
  unit: string;
  notes?: string;
}

interface InstructionInput {
  stepNumber: number;
  description: string;
  duration?: number;       // in minutes
}
```

**Returns:**
```typescript
{ success: true, data: { recipeId: string } }
// or
{ success: false, error: string }
```

**Validation:**
- Title and description are required
- Prep time and cook time must be non-negative
- Servings must be at least 1
- At least one ingredient required
- At least one instruction step required
- User must be authenticated

**Example:**
```typescript
const result = await createRecipe({
  title: "Chocolate Chip Cookies",
  description: "Classic homemade cookies",
  prepTime: 15,
  cookTime: 12,
  servings: 24,
  difficulty: "easy",
  cuisineType: "American",
  ingredients: [
    {
      ingredientId: "uuid-flour",
      quantity: "2.5",
      unit: "cup",
    },
    {
      ingredientId: "uuid-sugar",
      quantity: "1",
      unit: "cup",
    }
  ],
  instructions: [
    {
      stepNumber: 1,
      description: "Mix dry ingredients",
      duration: 5
    },
    {
      stepNumber: 2,
      description: "Add wet ingredients and mix",
      duration: 10
    }
  ],
  dietaryTagIds: ["uuid-vegetarian"]
});
```

---

#### `getRecipeById(recipeId: string)`

Get a single recipe with all related data (ingredients, instructions, dietary tags).

**Returns:**
```typescript
{
  success: true,
  data: {
    ...recipe,
    user: { id, name, email },
    ingredients: [{ id, quantity, unit, notes, ingredient }],
    instructions: [{ stepNumber, description, duration }],
    dietaryTags: [{ id, name }]
  }
}
```

**Example:**
```typescript
const result = await getRecipeById("recipe-uuid");
if (result.success) {
  const recipe = result.data;
  console.log(recipe.title);
  console.log(recipe.ingredients);
}
```

---

#### `getRecipes(params?)`

Get all recipes with optional filtering.

**Parameters:**
```typescript
{
  userId?: string;           // Filter by recipe author
  cuisineType?: string;      // Filter by cuisine
  difficulty?: "easy" | "medium" | "hard";
  dietaryTagIds?: string[];  // Filter by dietary tags
  search?: string;           // Search in title/description
  limit?: number;            // Limit results (default: all)
  offset?: number;           // Offset for pagination
}
```

**Returns:**
```typescript
{
  success: true,
  data: [
    { ...recipe, user: { id, name, email } }
  ]
}
```

**Example:**
```typescript
// Get all vegan recipes
const result = await getRecipes({
  dietaryTagIds: ["vegan-tag-uuid"],
  limit: 20
});

// Search for pasta recipes
const result = await getRecipes({
  search: "pasta",
  cuisineType: "Italian"
});
```

---

#### `updateRecipe(recipeId: string, input: RecipeInput)`

Update an existing recipe. User must own the recipe.

**Authorization:**
- Only the recipe creator can update their recipe
- Returns error if user doesn't own the recipe

**Returns:**
```typescript
{ success: true, data: { recipeId: string } }
```

**Note:** This replaces all ingredients, instructions, and dietary tags with the new values.

---

#### `deleteRecipe(recipeId: string)`

Delete a recipe. User must own the recipe.

**Authorization:**
- Only the recipe creator can delete their recipe
- Cascade deletes all related data (ingredients, instructions, tags)

**Returns:**
```typescript
{ success: true, data: { recipeId: string } }
```

---

### Ingredient Actions

File: `actions/ingredient-actions.ts`

#### `getIngredients(params?)`

Get ingredients with optional search and category filter.

**Parameters:**
```typescript
{
  search?: string;      // Search by name
  category?: string;    // Filter by category
  limit?: number;       // Limit results
}
```

**Returns:**
```typescript
{ success: true, data: Ingredient[] }
```

**Example:**
```typescript
// Search for vegetables
const result = await getIngredients({
  category: "vegetable",
  search: "tomato"
});
```

---

#### `getIngredientById(ingredientId: string)`

Get a single ingredient by ID.

---

#### `createIngredient(input: { name: string, category: string })`

Create a new ingredient.

**Validation:**
- Name must be unique
- Category must be valid (vegetable, fruit, protein, dairy, grain, spice, condiment, oil, sweetener, other)

**Returns:**
```typescript
{ success: true, data: { ingredientId: string } }
```

---

#### `searchIngredients(searchTerm: string)`

Search ingredients by name (optimized for autocomplete).

**Returns:** Up to 20 matching ingredients

**Example:**
```typescript
const result = await searchIngredients("chick");
// Returns: ["chicken breast", "chickpeas", "chicken thighs", ...]
```

---

### Dietary Tag Actions

File: `actions/dietary-tag-actions.ts`

#### `getDietaryTags()`

Get all dietary tags.

**Returns:**
```typescript
{ success: true, data: DietaryTag[] }
```

---

#### `getDietaryTagById(tagId: string)`

Get a single dietary tag by ID.

---

#### `createDietaryTag(input: { name: string })`

Create a new dietary tag.

**Validation:**
- Name must be unique

---

### Favorite Actions

File: `actions/favorite-actions.ts`

#### `addToFavorites(recipeId: string)`

Add a recipe to the current user's favorites.

**Validation:**
- Recipe must exist
- Cannot favorite the same recipe twice

**Returns:**
```typescript
{ success: true, data: { recipeId: string } }
```

---

#### `removeFromFavorites(recipeId: string)`

Remove a recipe from favorites.

**Returns:**
```typescript
{ success: true, data: { recipeId: string } }
```

---

#### `getFavoriteRecipes()`

Get all favorite recipes for the current user.

**Returns:**
```typescript
{
  success: true,
  data: [
    { ...recipe, user, favoritedAt: timestamp }
  ]
}
```

---

#### `isFavorited(recipeId: string)`

Check if a recipe is favorited by the current user.

**Returns:**
```typescript
{ success: true, data: { isFavorited: boolean } }
```

---

#### `toggleFavorite(recipeId: string)`

Toggle favorite status (add if not favorited, remove if favorited).

**Returns:**
```typescript
{ success: true, data: { isFavorited: boolean } }
```

**Example:**
```typescript
const result = await toggleFavorite("recipe-uuid");
if (result.success) {
  console.log(`Recipe is now ${result.data.isFavorited ? 'favorited' : 'unfavorited'}`);
}
```

---

## REST API Endpoints

REST endpoints are used for read operations and can be called from external clients.

### Recipes API

#### `GET /api/recipes`

List recipes with optional filters.

**Query Parameters:**
- `userId` - Filter by author
- `cuisineType` - Filter by cuisine
- `difficulty` - Filter by difficulty (easy, medium, hard)
- `search` - Search in title/description
- `limit` - Limit results (default: 20)
- `offset` - Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "uuid",
        "title": "Recipe Title",
        "description": "...",
        "prepTime": 15,
        "cookTime": 30,
        "servings": 4,
        "difficulty": "easy",
        "cuisineType": "Italian",
        "imageUrl": "https://...",
        "createdAt": "2026-01-29T...",
        "updatedAt": "2026-01-29T...",
        "user": {
          "id": "user-uuid",
          "name": "Chef Name",
          "email": "chef@example.com"
        }
      }
    ],
    "count": 10,
    "limit": 20,
    "offset": 0
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/recipes?cuisineType=Italian&limit=10" \
  -H "Cookie: authjs.session-token=..."
```

---

#### `GET /api/recipes/[id]`

Get a specific recipe by ID with full details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Recipe Title",
    "description": "...",
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "difficulty": "easy",
    "cuisineType": "Italian",
    "user": {
      "id": "user-uuid",
      "name": "Chef Name",
      "email": "chef@example.com"
    },
    "ingredients": [
      {
        "id": "recipe-ingredient-uuid",
        "quantity": "2",
        "unit": "cup",
        "notes": "finely chopped",
        "ingredient": {
          "id": "ingredient-uuid",
          "name": "Tomatoes",
          "category": "vegetable"
        }
      }
    ],
    "instructions": [
      {
        "id": "instruction-uuid",
        "stepNumber": 1,
        "description": "Heat oil in a pan",
        "duration": 5
      }
    ],
    "dietaryTags": [
      {
        "id": "tag-uuid",
        "name": "Vegetarian"
      }
    ]
  }
}
```

---

### Ingredients API

#### `GET /api/ingredients`

List ingredients with optional filters.

**Query Parameters:**
- `search` - Search by name
- `category` - Filter by category
- `limit` - Limit results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "ingredients": [
      {
        "id": "uuid",
        "name": "Tomatoes",
        "category": "vegetable"
      }
    ],
    "count": 50
  }
}
```

---

### Dietary Tags API

#### `GET /api/dietary-tags`

List all dietary tags.

**Response:**
```json
{
  "success": true,
  "data": {
    "dietaryTags": [
      {
        "id": "uuid",
        "name": "Vegetarian"
      },
      {
        "id": "uuid",
        "name": "Vegan"
      }
    ],
    "count": 5
  }
}
```

---

### Favorites API

#### `GET /api/favorites`

Get current user's favorite recipes.

**Response:**
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "recipe-uuid",
        "title": "Recipe Title",
        "description": "...",
        "user": {
          "id": "author-uuid",
          "name": "Chef Name",
          "email": "chef@example.com"
        },
        "favoritedAt": "2026-01-29T..."
      }
    ],
    "count": 10
  }
}
```

---

## Error Handling

All API endpoints and Server Actions return a consistent error format:

**Server Actions:**
```typescript
{
  success: false,
  error: "Error message"
}
```

**REST API:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found
- `500` - Internal Server Error

---

## Validation

Input validation is performed using utilities in `lib/validation.ts`:

**Available Validators:**
- `isValidUUID(uuid)` - Validate UUID format
- `isValidEmail(email)` - Validate email format
- `isValidDifficulty(difficulty)` - Validate recipe difficulty
- `isValidIngredientCategory(category)` - Validate ingredient category
- `isValidUnit(unit)` - Validate measurement unit
- `isValidRating(rating)` - Validate rating (1-5)
- `isPositiveInteger(value)` - Validate positive integer
- `isNonNegativeInteger(value)` - Validate non-negative integer
- `isValidLength(value, min, max)` - Validate string length
- `isNonEmptyArray(arr)` - Validate non-empty array

**Helper Functions:**
- `sanitizeString(input)` - Trim and normalize whitespace
- `createErrorResponse(message, statusCode)` - Create error response
- `createSuccessResponse(data, statusCode)` - Create success response

---

## Usage Examples

### Creating a Recipe

```typescript
"use client";

import { createRecipe } from "@/actions/recipe-actions";
import { useState } from "react";

export default function CreateRecipeForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    const result = await createRecipe({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      prepTime: parseInt(formData.get("prepTime") as string),
      cookTime: parseInt(formData.get("cookTime") as string),
      servings: parseInt(formData.get("servings") as string),
      difficulty: formData.get("difficulty") as "easy" | "medium" | "hard",
      ingredients: JSON.parse(formData.get("ingredients") as string),
      instructions: JSON.parse(formData.get("instructions") as string),
      dietaryTagIds: JSON.parse(formData.get("dietaryTagIds") as string),
    });

    setLoading(false);

    if (result.success) {
      console.log("Recipe created:", result.data.recipeId);
      // Redirect to recipe page
    } else {
      console.error("Error:", result.error);
    }
  }

  return <form action={handleSubmit}>...</form>;
}
```

### Fetching Recipes (Server Component)

```typescript
import { getRecipes } from "@/actions/recipe-actions";

export default async function RecipesPage() {
  const result = await getRecipes({
    limit: 20,
    cuisineType: "Italian"
  });

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  return (
    <div>
      {result.data.map((recipe) => (
        <div key={recipe.id}>
          <h2>{recipe.title}</h2>
          <p>By {recipe.user.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### Toggling Favorites (Client Component)

```typescript
"use client";

import { toggleFavorite } from "@/actions/favorite-actions";
import { useState } from "react";

export default function FavoriteButton({ recipeId, initialFavorited }) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);

  async function handleToggle() {
    const result = await toggleFavorite(recipeId);
    if (result.success) {
      setIsFavorited(result.data.isFavorited);
    }
  }

  return (
    <button onClick={handleToggle}>
      {isFavorited ? "❤️ Favorited" : "🤍 Favorite"}
    </button>
  );
}
```

---

## Architecture Decisions

### Why Server Actions?

**Benefits:**
- ✅ Type-safe end-to-end
- ✅ No need to define API routes for mutations
- ✅ Automatic serialization/deserialization
- ✅ Built-in security (CSRF protection)
- ✅ Can be called from Client or Server Components
- ✅ Revalidation integration (`revalidatePath`)

### Why REST API Routes?

**Benefits:**
- ✅ Can be called from external clients
- ✅ Standard HTTP interface
- ✅ Easier to cache (HTTP caching)
- ✅ Better for read-heavy operations
- ✅ Familiar to most developers

### Hybrid Approach

We use **Server Actions for mutations** (create, update, delete) and **REST API routes for queries** (read operations). This combines the best of both worlds:

- **Server Actions**: Ideal for form submissions and user interactions
- **REST APIs**: Ideal for fetching data and external integrations

---

## Security

### Authentication

All endpoints require authentication via Auth.js session cookies.

### Authorization

- Recipe updates/deletes check ownership
- Users can only favorite once per recipe
- Input validation on all endpoints
- SQL injection prevention via Drizzle ORM (parameterized queries)

### Input Sanitization

All string inputs are trimmed and validated before database insertion.

### CSRF Protection

Server Actions have built-in CSRF protection via Auth.js.

---

## Performance Optimizations

### Database Indexes

Strategic indexes on high-query columns:
- `recipes.userId` - Fast user recipe lookup
- `recipes.cuisineType` - Fast cuisine filtering
- `favorites.userId` - Fast favorite lookup
- `favorites.recipeId` - Fast recipe favorite check
- `recipeIngredients.recipeId` - Fast ingredient lookup
- `instructions.recipeId` - Fast instruction lookup

### Query Optimization

- Limit results by default
- Pagination support (offset/limit)
- Selective field loading
- Join optimization (only when needed)

### Caching

Use Next.js caching and revalidation:
```typescript
revalidatePath("/recipes");
revalidatePath(`/recipes/${recipeId}`);
```

---

## Future Enhancements

### Phase 2 Features (Not Yet Implemented)

- Reviews and ratings
- Recipe search with full-text search
- Recipe collections/cookbooks
- Recipe sharing and collaboration
- Advanced filtering (multiple dietary tags, ingredient exclusions)
- Recipe recommendations based on favorites
- Nutritional information

---

## Testing

### Manual Testing Checklist

**Recipes:**
- [ ] Create recipe
- [ ] Get recipe by ID
- [ ] List recipes with filters
- [ ] Update own recipe
- [ ] Delete own recipe
- [ ] Cannot update/delete other's recipes

**Ingredients:**
- [ ] List ingredients
- [ ] Search ingredients
- [ ] Create ingredient
- [ ] Duplicate ingredient name fails

**Dietary Tags:**
- [ ] List dietary tags
- [ ] Create dietary tag

**Favorites:**
- [ ] Add to favorites
- [ ] Remove from favorites
- [ ] Toggle favorite
- [ ] Get favorite recipes
- [ ] Check favorite status

**Authentication:**
- [ ] All endpoints require auth
- [ ] Unauthorized requests return 401

### Example Test Data

See `lib/db/seed.ts` for sample data:
- 2 test users
- 30+ ingredients
- 5 dietary tags
- 3 complete sample recipes

**Test credentials:**
- `chef@example.com` / `password123`
- `baker@example.com` / `password123`

---

## Summary

This API provides a comprehensive, type-safe interface for managing recipes, ingredients, dietary tags, and favorites. It follows Next.js 15 best practices, uses Server Actions for mutations, and provides REST endpoints for queries. All endpoints are protected by authentication and include proper validation and error handling.
