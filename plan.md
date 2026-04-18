# Recipe Book App — Technical Plan

> Research and planning document for Step 1/19 of the Recipe Book UI-Heavy Multi-Screen App.
> **DO NOT BUILD** — this document pins down schemas, signatures, and architecture for subsequent steps.

---

## 1. Worktree Setup

- **Path:** `/Users/jackjin/dev/ai-sandbox-worktrees/proj/recipe-book-ui`
- **Branch:** `proj/recipe-book-ui` (forked from immutable `base` branch)
- **Status:** Already initialized with `.gitignore`, `LICENSE`, `.env`, `.env.app`, and shared `.claude/` skills.
- **No action needed** — Step 2 will create the Next.js project inside this worktree.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | Required by spec; App Router gives route-based layouts and SSR/SSG flexibility |
| Language | TypeScript (strict) | Required by spec; catches schema mismatches early |
| Styling | Tailwind CSS v4 | Required by spec; utility-first, no runtime CSS-in-JS overhead |
| State (client) | React Context + `useReducer` | localStorage-only app; no external state library needed |
| Persistence | localStorage | Required by spec; schema versioned as `recipe-book:v1` |
| Testing | Playwright | Required by spec; E2E journey verification with append-only spec |
| Package manager | npm | Default for Next.js scaffold; lockfile committed |

### Tailwind v4 Notes
- Next.js 15 + Tailwind v4 uses the `@tailwindcss/postcss` plugin (not `tailwindcss` directly).
- Config moves from `tailwind.config.ts` to CSS-based configuration in `globals.css` via `@theme` / `@import "tailwindcss"`.
- No `content` array needed in v4 — it scans automatically.

---

## 3. Next.js 15 App Router Project Structure

```
recipe-book-ui/
├── app/                          # App Router
│   ├── layout.tsx                # Root layout: providers + nav + html shell
│   ├── page.tsx                  # Landing / redirect to /recipes
│   ├── globals.css               # Tailwind v4 import + theme vars
│   ├── recipes/
│   │   ├── page.tsx              # Recipe grid (home screen)
│   │   ├── new/
│   │   │   └── page.tsx          # Create recipe form
│   │   └── [id]/
│   │       ├── page.tsx          # Recipe detail view
│   │       └── edit/
│   │           └── page.tsx      # Edit recipe form
│   ├── favorites/
│   │   └── page.tsx              # Favorites list
│   ├── search/
│   │   └── page.tsx              # Search with live filter
│   ├── categories/
│   │   └── page.tsx              # Category grid / list
│   └── settings/
│       └── page.tsx              # Settings (units toggle, etc.)
├── components/
│   ├── ui/                       # Primitive reusable UI (Button, Input, Card, etc.)
│   ├── RecipeCard.tsx            # Card used in grid + favorites + search results
│   ├── RecipeGrid.tsx            # Grid layout wrapper
│   ├── RecipeForm.tsx            # Shared create/edit form component
│   ├── IngredientList.tsx        # Renders ingredients with unit conversion
│   ├── NavBar.tsx                # Bottom or top nav across all routes
│   └── UnitToggle.tsx            # Metric / Imperial toggle widget
├── lib/
│   ├── types.ts                  # All TypeScript interfaces and types
│   ├── constants.ts              # localStorage keys, seed data path, conversion tables
│   └── conversions.ts            # Unit conversion functions
├── stores/
│   ├── RecipeStore.tsx           # React Context + Provider for recipes + favorites
│   └── SettingsStore.tsx         # React Context + Provider for settings
├── data/
│   └── seed-recipes.json         # 5 seeded recipes (committed, imported at build time)
├── tests/
│   └── e2e/
│       └── journey.spec.ts       # Append-only Playwright journey spec
├── public/
│   └── images/                   # Recipe images (or use external URLs)
├── next.config.ts                # Next.js config (static export for demo)
├── tsconfig.json                 # Strict TypeScript
└── package.json
```

### Key File Decisions
- `lib/types.ts` is the single source of truth for all interfaces. Every component and store imports from here.
- `lib/constants.ts` holds magic strings (localStorage keys, default settings) so they are never hardcoded.
- `stores/` is sibling to `app/` — contexts are consumed by both server and client components, but the providers are mounted in `app/layout.tsx` with `"use client"` wrappers.
- `data/seed-recipes.json` is imported directly in `RecipeStore` at initialization time (build-time static import).

---

## 4. localStorage Schema (`recipe-book:v1`)

Three keys, all JSON-serialized. On first load, if keys are absent, seed from `data/seed-recipes.json`.

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `recipe-book:recipes` | `Recipe[]` | All recipes (seeded + user-created) | Seed data (5 recipes) |
| `recipe-book:favorites` | `string[]` | Array of recipe `id` strings treated as a Set | `[]` |
| `recipe-book:settings` | `Settings` | User preferences | `{ units: 'metric' }` |

### TypeScript Interfaces (exact shape stored)

```typescript
// lib/types.ts

export interface Ingredient {
  name: string;
  quantity: number;      // Always stored in metric base units
  unit: 'g' | 'ml' | 'kg' | 'l' | 'tsp' | 'tbsp' | 'pinch' | 'piece';
}

export interface Recipe {
  id: string;            // UUID v4 or nanoid
  title: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Snack';
  ingredients: Ingredient[];
  instructions: string[]; // Array of steps
  prepTime: number;      // Minutes
  cookTime: number;      // Minutes
  imageUrl: string;      // Absolute URL (public/ or external)
  createdAt: string;     // ISO 8601
}

export interface Settings {
  units: 'metric' | 'imperial';
}

// localStorage key constants
export const STORAGE_KEYS = {
  RECIPES: 'recipe-book:recipes',
  FAVORITES: 'recipe-book:favorites',
  SETTINGS: 'recipe-book:settings',
} as const;
```

### Schema Upgrade Path
- The `:v1` suffix in the key namespace allows future migration. If we ever ship v2, we can read v1, migrate in memory, and write to `recipe-book:v2` keys.

---

## 5. Seed Data Schema (`data/seed-recipes.json`)

Exactly 5 recipes. All ingredient quantities stored in metric. Image URLs can point to `https://images.unsplash.com/...` or similar public image service so no local assets are required.

```json
[
  {
    "id": "seed-001",
    "title": "Classic Pancakes",
    "category": "Breakfast",
    "ingredients": [
      { "name": "All-purpose flour", "quantity": 200, "unit": "g" },
      { "name": "Milk", "quantity": 300, "unit": "ml" },
      { "name": "Eggs", "quantity": 2, "unit": "piece" },
      { "name": "Sugar", "quantity": 30, "unit": "g" },
      { "name": "Butter", "quantity": 50, "unit": "g" }
    ],
    "instructions": [
      "Whisk flour, sugar, and a pinch of salt in a large bowl.",
      "In another bowl, beat eggs and milk together.",
      "Pour wet ingredients into dry and stir until just combined.",
      "Melt butter on a griddle over medium heat.",
      "Cook pancakes 2–3 minutes per side until golden."
    ],
    "prepTime": 10,
    "cookTime": 15,
    "imageUrl": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Required Categories for Seed Data
At least one recipe in each of:
- Breakfast
- Lunch  
- Dinner
- Dessert
- Snack

This ensures the `/categories` screen has meaningful content.

---

## 6. Unit Conversion Logic

### Conversion Table (metric base → imperial)

| Metric Unit | Imperial Unit | Conversion Factor | Notes |
|-------------|---------------|-------------------|-------|
| g (grams) | oz (ounces) | 1 g = 0.035274 oz | Round to 1 decimal |
| kg (kilograms) | lb (pounds) | 1 kg = 2.20462 lb | Round to 2 decimals |
| ml (milliliters) | fl oz (fluid ounces) | 1 ml = 0.033814 fl oz | Round to 1 decimal |
| l (liters) | cup | 1 l = 4.22675 cups | Round to 2 decimals |
| tsp (teaspoon) | tsp | 1:1 | Same unit |
| tbsp (tablespoon) | tbsp | 1:1 | Same unit |
| pinch | pinch | 1:1 | Same unit |
| piece | piece | 1:1 | Same unit |

### Conversion Function Signature

```typescript
// lib/conversions.ts

export type UnitSystem = 'metric' | 'imperial';

export interface ConvertedQuantity {
  value: number;
  unit: string;
  display: string;   // Formatted string, e.g. "7.1 oz"
}

/**
 * Convert a single ingredient quantity between metric and imperial.
 * Ingredients stored in metric are the canonical source.
 */
export function convertQuantity(
  quantity: number,
  unit: Ingredient['unit'],
  targetSystem: UnitSystem
): ConvertedQuantity;

/**
 * Format a number for display (strip trailing zeros).
 */
export function formatNumber(n: number, decimals: number): string;
```

### Rules
- **Storage is always metric.** Never write imperial values to localStorage.
- Conversion happens at render time inside `IngredientList` based on `SettingsStore.units`.
- `piece`, `tsp`, `tbsp`, `pinch` pass through unchanged regardless of system.
- For `g` → `oz`, if the result is > 16 oz, optionally display as `X lb Y oz` (nice-to-have, not required for MVP).

---

## 7. React Context Architecture

### Two Separate Contexts (prevents unnecessary re-renders)

#### `RecipeStore`
- Holds: `recipes`, `favorites`
- Actions: `addRecipe`, `updateRecipe`, `deleteRecipe`, `toggleFavorite`
- Persistence: every action writes to localStorage via `STORAGE_KEYS.RECIPES` / `STORAGE_KEYS.FAVORITES`
- Hydration: on mount, read from localStorage; if missing, seed from `data/seed-recipes.json`

```typescript
// stores/RecipeStore.tsx — key types

interface RecipeState {
  recipes: Recipe[];
  favorites: Set<string>;
}

type RecipeAction =
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'UPDATE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_FAVORITES'; payload: string[] };

interface RecipeContextValue extends RecipeState {
  dispatch: React.Dispatch<RecipeAction>;
  isFavorite: (id: string) => boolean;
}
```

#### `SettingsStore`
- Holds: `settings` (`{ units: 'metric' | 'imperial' }`)
- Actions: `setUnits`
- Persistence: writes to `STORAGE_KEYS.SETTINGS` on change

```typescript
// stores/SettingsStore.tsx — key types

interface SettingsState {
  settings: Settings;
}

type SettingsAction =
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'SET_UNITS'; payload: 'metric' | 'imperial' };

interface SettingsContextValue extends SettingsState {
  dispatch: React.Dispatch<SettingsAction>;
}
```

### Provider Stack in `app/layout.tsx`

```tsx
// app/layout.tsx

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          <RecipeProvider>
            <NavBar />
            <main>{children}</main>
          </RecipeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
```

- `SettingsProvider` is outermost so `RecipeProvider` (or any component) can read settings if needed.
- Both providers are client components (`"use client"`) because they interact with localStorage and use `useReducer`.

---

## 8. Route Structure & Shared Layout/Nav

### 8 Routes (plus root redirect)

| Route | Purpose | Key UI Elements |
|-------|---------|-----------------|
| `/` | Landing | Redirects to `/recipes` |
| `/recipes` | Recipe grid | `RecipeGrid`, `RecipeCard` cards with image, title, time, category |
| `/recipes/[id]` | Recipe detail | Full ingredients (`IngredientList`), instructions, heart icon, edit link |
| `/recipes/new` | Create recipe | `RecipeForm` (empty), save button |
| `/recipes/[id]/edit` | Edit recipe | `RecipeForm` (pre-filled), save button |
| `/favorites` | Favorites list | Filtered `RecipeGrid` showing only favorited recipes |
| `/search` | Search | Text input, live-filtered `RecipeGrid` |
| `/categories` | Categories | Category cards/buttons → clicking one navigates to `/recipes?category=X` |
| `/settings` | Settings | `UnitToggle`, future settings |

### Navigation Pattern
- **Mobile-first bottom nav** or **top nav bar** with links to: Recipes, Categories, Search, Favorites, Settings.
- Active route highlighted via `usePathname()` from `next/navigation`.
- Nav is rendered in `app/layout.tsx` so it persists across all routes.

### Dynamic Route Convention
- `[id]` segments use Next.js App Router dynamic route convention.
- For `/recipes/[id]/edit`, create `app/recipes/[id]/edit/page.tsx`.
- In the detail page, read `params.id` from the page props.

---

## 9. Playwright Test File Structure (Append-Only)

```
tests/
└── e2e/
    └── journey.spec.ts       # Single append-only spec
```

### Pattern
Each step that adds a user-facing gate appends a new `test(...)` block. A shared `completePriorSteps(page, { through: N })` helper lets each test walk from the start of the flow up to the prior step.

```typescript
// tests/e2e/journey.spec.ts — skeleton

import { test, expect, Page } from '@playwright/test';

export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Step 3: seed data loads
  if (opts.through >= 3) {
    await page.goto('/recipes');
    await expect(page.getByText('Classic Pancakes')).toBeVisible();
  }
  // Step 4: RecipeStore context
  if (opts.through >= 4) {
    // Verify localStorage persistence
  }
  // Step 5: Recipe grid (/recipes)
  if (opts.through >= 5) {
    // Grid renders cards
  }
  // Step 6: Recipe detail (/recipes/[id])
  if (opts.through >= 6) {
    await page.click('[data-testid="recipe-card-seed-001"]');
    await expect(page).toHaveURL(/\/recipes\/seed-001/);
  }
  // ... etc, each step extends this helper
}

// Example block added by a later step:
test('step 6: detail page shows ingredients in metric by default', async ({ page }) => {
  await completePriorSteps(page, { through: 5 });
  await page.click('[data-testid="recipe-card-seed-001"]');
  await expect(page.getByText('200 g')).toBeVisible();
  await expect(page.getByText('300 ml')).toBeVisible();
});
```

### Testing Rules
- **Never rewrite prior blocks** — only append.
- `data-testid` attributes on interactive elements (`recipe-card-{id}`, `favorite-btn`, `unit-toggle`, etc.) to keep selectors stable.
- Every test starts from `/recipes` (or `/`) and walks forward.
- localStorage state assertions use `page.evaluate(() => localStorage.getItem(...))`.

---

## 10. Screen Build Order

The 8 screens will be built across Steps 5–12 (after project scaffold, seed data, and stores are ready). Recommended order:

| Order | Screen | Step | Rationale |
|-------|--------|------|-----------|
| 1 | `/recipes` (grid) | Step 5 | Natural entry point; validates seed data + store |
| 2 | `/recipes/[id]` (detail) | Step 6 | Next logical click from grid; validates ingredient rendering |
| 3 | `/favorites` | Step 7 | Simple list filter; heart toggle wired in detail page |
| 4 | `/search` | Step 8 | Client-side filter; reuses RecipeGrid |
| 5 | `/categories` | Step 9 | Category grid + query-param filter on `/recipes` |
| 6 | `/recipes/new` | Step 10 | Create form; validates localStorage write |
| 7 | `/recipes/[id]/edit` | Step 11 | Edit form; validates localStorage update |
| 8 | `/settings` | Step 12 | Unit toggle; validates conversion re-render on detail |

This order follows the **user journey** naturally: browse → view → favorite → search → filter → create → edit → configure.

---

## 11. Step Mapping (19 Steps → This Plan)

| Step | Task | What This Plan Covers |
|------|------|----------------------|
| 1 | **Research and plan technical approach** | **This document** |
| 2 | Create worktree + initialize Next.js 15 + Tailwind v4 | §2 Tech Stack, §3 Project Structure |
| 3 | Create seed data + TypeScript types | §4 localStorage Schema, §5 Seed Data Schema |
| 4 | Build RecipeStore context with localStorage persistence | §6 Context Architecture (RecipeStore) |
| 5 | Build `/recipes` grid screen | §8 Route Structure, §10 Build Order |
| 6 | Build `/recipes/[id]` detail screen | §8 Route Structure, §6 Conversion Logic |
| 7 | Build `/favorites` screen + heart toggle | §8 Route Structure, §6 RecipeStore actions |
| 8 | Build `/search` screen with live filter | §8 Route Structure |
| 9 | Build `/categories` screen | §8 Route Structure |
| 10 | Build `/recipes/new` create form | §8 Route Structure, §4 Recipe type |
| 11 | Build `/recipes/[id]/edit` edit form | §8 Route Structure |
| 12 | Build `/settings` screen + unit toggle | §6 SettingsStore, §6 Conversion Logic |
| 13–18 | Polish, E2E tests, visual regression, accessibility | §9 Playwright Structure |
| 19 | Final validation + journey verification | §9 Playwright Journey |

---

## 12. Decisions Log

| Decision | Choice | Why |
|----------|--------|-----|
| Ingredient storage unit | Always metric in localStorage | Single source of truth; conversion at render time only |
| Recipe ID format | `seed-00N` for seeds, `nanoid()` for user-created | Simple, collision-free, readable |
| Context vs Zustand/Redux | React Context + `useReducer` | No external deps, fits localStorage-only app |
| Image hosting | External URLs (Unsplash) | No need to manage `public/images/` assets |
| Nav style | Top nav bar (desktop + mobile) | Simpler than bottom tab bar for 5 links |
| Form validation | HTML5 + simple client checks | No server, no complex validation needed |
| Category filter | Query param (`?category=Dessert`) on `/recipes` | Avoids duplicating grid logic on a separate route |

---

## 13. Risk Notes

- **Tailwind v4 is new.** The CSS-based config (`@theme`) differs from v3's `tailwind.config.ts`. Step 2 worker should verify the Next.js 15 + Tailwind v4 integration works before proceeding.
- **App Router + client contexts.** `layout.tsx` is a Server Component by default. The provider wrappers must be extracted into `"use client"` files (e.g., `app/providers.tsx`) and imported into `layout.tsx`.
- **localStorage SSR mismatch.** localStorage is not available during SSR. The contexts must guard against `typeof window === 'undefined'` and hydrate on mount.
- **Image optimization with external URLs.** Next.js `<Image>` requires `next.config.ts` `images.remotePatterns` for external hosts. Use standard `<img>` or configure `next.config.ts` accordingly.
