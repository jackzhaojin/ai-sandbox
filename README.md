# Recipe Book

A UI-heavy multi-screen recipe book app built with Next.js, React, and Tailwind CSS. Recipes are stored in localStorage so data persists across page reloads.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Running Tests

```bash
npm run test:e2e
```

## Routes

The app has 8 main routes:

1. `/recipes` — Grid of all recipes with image, title, time, and category
2. `/recipes/[id]` — Full recipe detail with ingredients and instructions
3. `/recipes/new` — Form to create a new recipe
4. `/recipes/[id]/edit` — Form to edit an existing recipe
5. `/favorites` — List of favorited recipes
6. `/search` — Live search by title or ingredient
7. `/categories` — Browse recipes by category
8. `/settings` — Toggle units (metric/imperial), theme, and default servings

## localStorage Persistence

Recipe data is stored under the key `recipe-book:v1` and settings under `recipe-book:settings`. Both persist across browser sessions and page reloads.
